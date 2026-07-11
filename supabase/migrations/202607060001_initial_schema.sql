create extension if not exists pgcrypto;

create type public.member_role as enum ('admin', 'member');
create type public.prediction_status as enum ('open', 'closed', 'resolved', 'cancelled');
create type public.ledger_reason as enum ('initial', 'stake', 'win');

create schema if not exists private;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'New player',
  username text not null unique,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_display_name_length check (char_length(display_name) between 2 and 60),
  constraint profiles_username_format check (username ~ '^[A-Za-z0-9_]{3,30}$')
);

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text not null unique,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint groups_name_length check (char_length(name) between 2 and 80),
  constraint groups_invite_code_format check (invite_code ~ '^[A-Z0-9]{6,16}$')
);

create table public.group_members (
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.member_role not null default 'member',
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create table public.predictions (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  closes_at timestamptz not null,
  status public.prediction_status not null default 'open',
  resolved_option_id uuid,
  resolved_outcome text,
  resolved_by uuid references auth.users(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint predictions_title_length check (char_length(title) between 5 and 140),
  constraint predictions_description_length check (description is null or char_length(description) <= 600),
  constraint predictions_close_after_create check (closes_at > created_at),
  constraint predictions_resolution_fields check (
    (status = 'resolved' and resolved_option_id is not null and resolved_outcome is not null and resolved_by is not null and resolved_at is not null)
    or (status <> 'resolved' and resolved_option_id is null and resolved_outcome is null and resolved_at is null)
  )
);

create table public.prediction_options (
  id uuid primary key default gen_random_uuid(),
  prediction_id uuid not null references public.predictions(id) on delete cascade,
  label text not null,
  position integer not null,
  created_at timestamptz not null default now(),
  constraint prediction_options_label_length check (char_length(label) between 1 and 40),
  constraint prediction_options_position_positive check (position > 0),
  unique (prediction_id, label),
  unique (prediction_id, position)
);

alter table public.predictions
  add constraint predictions_resolved_option_fk
  foreign key (resolved_option_id)
  references public.prediction_options(id)
  on delete restrict;

create table public.votes (
  id uuid primary key default gen_random_uuid(),
  prediction_id uuid not null references public.predictions(id) on delete cascade,
  option_id uuid not null references public.prediction_options(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  stake integer not null default 10,
  created_at timestamptz not null default now(),
  constraint votes_stake_is_default check (stake = 10),
  unique (prediction_id, user_id)
);

create table public.ledger (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  prediction_id uuid references public.predictions(id) on delete cascade,
  vote_id uuid references public.votes(id) on delete cascade,
  amount integer not null,
  reason public.ledger_reason not null,
  created_at timestamptz not null default now(),
  constraint ledger_amount_by_reason check (
    (reason = 'initial' and amount = 100 and prediction_id is null and vote_id is null)
    or (reason = 'stake' and amount = -10 and prediction_id is not null and vote_id is not null)
    or (reason = 'win' and amount = 20 and prediction_id is not null and vote_id is not null)
  )
);

create unique index ledger_one_initial_per_member
  on public.ledger (group_id, user_id)
  where reason = 'initial';

create unique index ledger_one_stake_per_vote
  on public.ledger (vote_id)
  where reason = 'stake';

create unique index ledger_one_win_per_vote
  on public.ledger (vote_id)
  where reason = 'win';

create index group_members_user_id_idx on public.group_members (user_id);
create index predictions_group_id_status_closes_idx on public.predictions (group_id, status, closes_at);
create index prediction_options_prediction_id_idx on public.prediction_options (prediction_id);
create index votes_prediction_id_idx on public.votes (prediction_id);
create index votes_user_id_idx on public.votes (user_id);
create index ledger_group_user_idx on public.ledger (group_id, user_id);

create or replace function private.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function private.touch_updated_at();

create trigger groups_touch_updated_at
  before update on public.groups
  for each row execute function private.touch_updated_at();

create trigger predictions_touch_updated_at
  before update on public.predictions
  for each row execute function private.touch_updated_at();

create or replace function private.is_group_member(p_group_id uuid, p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, private
as $$
  select p_user_id is not null
    and exists (
      select 1
      from public.group_members gm
      where gm.group_id = p_group_id
        and gm.user_id = p_user_id
    );
$$;

create or replace function private.is_group_admin(p_group_id uuid, p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, private
as $$
  select p_user_id is not null
    and exists (
      select 1
      from public.group_members gm
      where gm.group_id = p_group_id
        and gm.user_id = p_user_id
        and gm.role = 'admin'
    );
$$;

create or replace function private.shares_group_with(p_viewer uuid, p_subject uuid)
returns boolean
language sql
stable
security definer
set search_path = public, private
as $$
  select p_viewer is not null
    and p_subject is not null
    and (
      p_viewer = p_subject
      or exists (
        select 1
        from public.group_members viewer_membership
        join public.group_members subject_membership
          on subject_membership.group_id = viewer_membership.group_id
        where viewer_membership.user_id = p_viewer
          and subject_membership.user_id = p_subject
      )
    );
$$;

create or replace function private.user_group_balance(p_group_id uuid, p_user_id uuid)
returns integer
language sql
stable
security definer
set search_path = public, private
as $$
  select coalesce(sum(amount), 0)::integer
  from public.ledger
  where group_id = p_group_id
    and user_id = p_user_id;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_base_username text;
  v_username text;
  v_display_name text;
begin
  v_base_username := coalesce(
    nullif(regexp_replace(new.raw_user_meta_data->>'username', '[^A-Za-z0-9_]', '', 'g'), ''),
    'user_' || substr(replace(new.id::text, '-', ''), 1, 10)
  );

  v_display_name := coalesce(
    nullif(trim(new.raw_user_meta_data->>'display_name'), ''),
    split_part(new.email, '@', 1),
    'New player'
  );

  if char_length(v_base_username) < 3 then
    v_base_username := 'user_' || substr(replace(new.id::text, '-', ''), 1, 10);
  end if;

  if char_length(v_display_name) < 2 then
    v_display_name := 'New player';
  end if;

  v_username := left(v_base_username, 30);

  while exists (select 1 from public.profiles p where p.username = v_username) loop
    v_username := left(v_base_username, 24) || '_' || substr(encode(gen_random_bytes(3), 'hex'), 1, 5);
  end loop;

  insert into public.profiles (id, display_name, username, avatar_url)
  values (
    new.id,
    left(v_display_name, 60),
    v_username,
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function private.create_initial_ledger()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
begin
  insert into public.ledger (group_id, user_id, amount, reason)
  values (new.group_id, new.user_id, 100, 'initial')
  on conflict do nothing;

  return new;
end;
$$;

create trigger group_members_create_initial_ledger
  after insert on public.group_members
  for each row execute function private.create_initial_ledger();

create or replace function private.create_default_prediction_options()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
begin
  insert into public.prediction_options (prediction_id, label, position)
  values
    (new.id, 'Yes', 1),
    (new.id, 'No', 2);

  return new;
end;
$$;

create trigger predictions_create_default_options
  after insert on public.predictions
  for each row execute function private.create_default_prediction_options();

create or replace function private.validate_vote_insert()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_user_id uuid := auth.uid();
  v_prediction record;
begin
  if v_user_id is null then
    raise exception 'not authenticated';
  end if;

  if new.user_id is distinct from v_user_id then
    raise exception 'not a group member';
  end if;

  new.stake := 10;

  select p.group_id, p.status, p.closes_at
  into v_prediction
  from public.predictions p
  join public.prediction_options o
    on o.prediction_id = p.id
   and o.id = new.option_id
  where p.id = new.prediction_id;

  if not found then
    raise exception 'invalid prediction option';
  end if;

  perform pg_advisory_xact_lock(hashtext(v_prediction.group_id::text), hashtext(v_user_id::text));

  if not private.is_group_member(v_prediction.group_id, v_user_id) then
    raise exception 'not a group member';
  end if;

  if v_prediction.status <> 'open' then
    if v_prediction.status = 'resolved' then
      raise exception 'prediction already resolved';
    end if;

    raise exception 'voting closed';
  end if;

  if v_prediction.closes_at <= now() then
    raise exception 'voting closed';
  end if;

  if exists (
    select 1
    from public.votes v
    where v.prediction_id = new.prediction_id
      and v.user_id = v_user_id
  ) then
    raise exception 'already voted';
  end if;

  if private.user_group_balance(v_prediction.group_id, v_user_id) < 10 then
    raise exception 'not enough points';
  end if;

  return new;
end;
$$;

create trigger votes_validate_before_insert
  before insert on public.votes
  for each row execute function private.validate_vote_insert();

create or replace function private.create_stake_ledger()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_group_id uuid;
begin
  select group_id
  into v_group_id
  from public.predictions
  where id = new.prediction_id;

  insert into public.ledger (group_id, user_id, prediction_id, vote_id, amount, reason)
  values (v_group_id, new.user_id, new.prediction_id, new.id, -10, 'stake');

  return new;
end;
$$;

create trigger votes_create_stake_ledger
  after insert on public.votes
  for each row execute function private.create_stake_ledger();

create or replace function public.create_group(p_name text)
returns table (group_id uuid, invite_code text)
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_user_id uuid := auth.uid();
  v_group_id uuid;
  v_invite_code text;
  v_name text := trim(p_name);
begin
  if v_user_id is null then
    raise exception 'not authenticated';
  end if;

  if char_length(v_name) < 2 or char_length(v_name) > 80 then
    raise exception 'invalid group name';
  end if;

  loop
    v_invite_code := upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 8));
    exit when not exists (
      select 1 from public.groups g where g.invite_code = v_invite_code
    );
  end loop;

  insert into public.groups (name, invite_code, created_by)
  values (v_name, v_invite_code, v_user_id)
  returning id into v_group_id;

  insert into public.group_members (group_id, user_id, role)
  values (v_group_id, v_user_id, 'admin');

  return query select v_group_id, v_invite_code;
end;
$$;

create or replace function public.join_group(p_invite_code text)
returns table (group_id uuid, group_name text)
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_user_id uuid := auth.uid();
  v_group_id uuid;
  v_group_name text;
  v_invite_code text := upper(trim(p_invite_code));
begin
  if v_user_id is null then
    raise exception 'not authenticated';
  end if;

  select g.id, g.name
  into v_group_id, v_group_name
  from public.groups g
  where g.invite_code = v_invite_code;

  if not found then
    raise exception 'invalid invite code';
  end if;

  insert into public.group_members (group_id, user_id, role)
  values (v_group_id, v_user_id, 'member')
  on conflict (group_id, user_id) do nothing;

  return query select v_group_id, v_group_name;
end;
$$;

create or replace function public.resolve_prediction(
  p_prediction_id uuid,
  p_winning_option_id uuid
)
returns void
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_user_id uuid := auth.uid();
  v_prediction public.predictions%rowtype;
  v_outcome text;
begin
  if v_user_id is null then
    raise exception 'not authenticated';
  end if;

  select *
  into v_prediction
  from public.predictions
  where id = p_prediction_id
  for update;

  if not found or not private.is_group_member(v_prediction.group_id, v_user_id) then
    raise exception 'not a group member';
  end if;

  if v_prediction.status = 'resolved' then
    raise exception 'prediction already resolved';
  end if;

  if v_prediction.status = 'cancelled' then
    raise exception 'prediction cancelled';
  end if;

  if v_prediction.status = 'open' and v_prediction.closes_at > now() then
    raise exception 'prediction is still open';
  end if;

  if v_prediction.created_by <> v_user_id
    and not private.is_group_admin(v_prediction.group_id, v_user_id) then
    raise exception 'unauthorized resolution';
  end if;

  select label
  into v_outcome
  from public.prediction_options
  where id = p_winning_option_id
    and prediction_id = p_prediction_id;

  if not found then
    raise exception 'invalid winning option';
  end if;

  update public.predictions
  set status = 'resolved',
      resolved_option_id = p_winning_option_id,
      resolved_outcome = v_outcome,
      resolved_by = v_user_id,
      resolved_at = now()
  where id = p_prediction_id;

  insert into public.ledger (group_id, user_id, prediction_id, vote_id, amount, reason)
  select v_prediction.group_id, v.user_id, p_prediction_id, v.id, 20, 'win'
  from public.votes v
  where v.prediction_id = p_prediction_id
    and v.option_id = p_winning_option_id
  on conflict do nothing;
end;
$$;

alter table public.profiles enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.predictions enable row level security;
alter table public.prediction_options enable row level security;
alter table public.votes enable row level security;
alter table public.ledger enable row level security;

create policy "profiles are readable by self and shared groups"
  on public.profiles
  for select
  to authenticated
  using (private.shares_group_with((select auth.uid()), id));

create policy "profiles are insertable by owner"
  on public.profiles
  for insert
  to authenticated
  with check ((select auth.uid()) = id);

create policy "profiles are updateable by owner"
  on public.profiles
  for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "members can read their groups"
  on public.groups
  for select
  to authenticated
  using (private.is_group_member(id, (select auth.uid())));

create policy "members can read memberships in their groups"
  on public.group_members
  for select
  to authenticated
  using (private.is_group_member(group_id, (select auth.uid())));

create policy "members can read predictions in their groups"
  on public.predictions
  for select
  to authenticated
  using (private.is_group_member(group_id, (select auth.uid())));

create policy "members can create predictions in their groups"
  on public.predictions
  for insert
  to authenticated
  with check (
    created_by = (select auth.uid())
    and status = 'open'
    and private.is_group_member(group_id, (select auth.uid()))
  );

create policy "members can read options in their groups"
  on public.prediction_options
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.predictions p
      where p.id = prediction_id
        and private.is_group_member(p.group_id, (select auth.uid()))
    )
  );

create policy "members can read votes in their groups"
  on public.votes
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.predictions p
      where p.id = prediction_id
        and private.is_group_member(p.group_id, (select auth.uid()))
    )
  );

create policy "members can vote in their groups"
  on public.votes
  for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1
      from public.predictions p
      where p.id = prediction_id
        and private.is_group_member(p.group_id, (select auth.uid()))
    )
  );

create policy "members can read ledger in their groups"
  on public.ledger
  for select
  to authenticated
  using (private.is_group_member(group_id, (select auth.uid())));

grant usage on schema public to anon, authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select on public.groups to authenticated;
grant select on public.group_members to authenticated;
grant select, insert on public.predictions to authenticated;
grant select on public.prediction_options to authenticated;
grant select, insert on public.votes to authenticated;
grant select on public.ledger to authenticated;

revoke all on schema private from public;
grant usage on schema private to authenticated;
revoke all on all functions in schema private from public;
grant execute on all functions in schema private to authenticated;

revoke all on function public.handle_new_user() from public;
revoke all on function public.create_group(text) from public;
revoke all on function public.join_group(text) from public;
revoke all on function public.resolve_prediction(uuid, uuid) from public;

grant execute on function public.create_group(text) to authenticated;
grant execute on function public.join_group(text) to authenticated;
grant execute on function public.resolve_prediction(uuid, uuid) to authenticated;
