alter type public.ledger_reason add value if not exists 'mission_verified';

create table public.mission_templates (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  created_by uuid references public.profiles(id) on delete set null,
  title text not null,
  description text,
  category text not null,
  difficulty text not null,
  source text not null,
  status text not null,
  safety_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint mission_templates_title_length check (char_length(title) between 3 and 120),
  constraint mission_templates_description_length check (description is null or char_length(description) <= 600),
  constraint mission_templates_safety_notes_length check (safety_notes is null or char_length(safety_notes) <= 600),
  constraint mission_templates_category check (category in ('social', 'observation', 'photo', 'performance', 'team', 'low_key', 'wildcard')),
  constraint mission_templates_difficulty check (difficulty in ('easy', 'medium', 'hard', 'chaotic_safe')),
  constraint mission_templates_source check (source in ('manual', 'ai_generated')),
  constraint mission_templates_status check (status in ('active', 'pending_review', 'archived', 'rejected')),
  constraint mission_templates_source_status_default check (
    (source = 'manual' and status in ('active', 'archived', 'rejected'))
    or (source = 'ai_generated' and status in ('pending_review', 'active', 'archived', 'rejected'))
  )
);

create table public.mission_outings (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  created_by uuid references public.profiles(id) on delete set null,
  title text not null,
  venue_type text,
  vibe text,
  starts_at timestamptz,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  constraint mission_outings_title_length check (char_length(title) between 3 and 120),
  constraint mission_outings_venue_length check (venue_type is null or char_length(venue_type) <= 80),
  constraint mission_outings_vibe_length check (vibe is null or char_length(vibe) <= 120),
  constraint mission_outings_status check (status in ('draft', 'active', 'completed', 'cancelled'))
);

create table public.mission_assignments (
  id uuid primary key default gen_random_uuid(),
  outing_id uuid not null references public.mission_outings(id) on delete cascade,
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  mission_template_id uuid not null references public.mission_templates(id) on delete restrict,
  status text not null default 'assigned',
  assigned_at timestamptz not null default now(),
  completed_at timestamptz,
  verified_by uuid references public.profiles(id) on delete set null,
  verification_note text,
  rerolled_from_assignment_id uuid references public.mission_assignments(id) on delete set null,
  constraint mission_assignments_status check (status in ('assigned', 'completed', 'verified', 'rejected', 'skipped', 'rerolled')),
  constraint mission_assignments_verification_note_length check (verification_note is null or char_length(verification_note) <= 500),
  unique (outing_id, user_id)
);

create table public.mission_preferences (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  allow_performance boolean not null default true,
  allow_photo boolean not null default true,
  allow_talking_to_strangers boolean not null default false,
  allow_dancing boolean not null default true,
  allow_drinking_related boolean not null default false,
  max_difficulty text not null default 'medium',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint mission_preferences_max_difficulty check (max_difficulty in ('easy', 'medium', 'hard', 'chaotic_safe')),
  unique (group_id, user_id)
);

create index mission_templates_group_status_idx on public.mission_templates (group_id, status, category, difficulty);
create index mission_outings_group_created_idx on public.mission_outings (group_id, created_at desc);
create index mission_assignments_outing_status_idx on public.mission_assignments (outing_id, status);
create index mission_assignments_user_idx on public.mission_assignments (user_id);
create index mission_preferences_user_group_idx on public.mission_preferences (user_id, group_id);

create trigger mission_templates_touch_updated_at
  before update on public.mission_templates
  for each row execute function private.touch_updated_at();

create trigger mission_preferences_touch_updated_at
  before update on public.mission_preferences
  for each row execute function private.touch_updated_at();

alter table public.ledger
  add column if not exists mission_assignment_id uuid references public.mission_assignments(id) on delete cascade;

alter table public.ledger
  drop constraint if exists ledger_amount_by_reason;

alter table public.ledger
  add constraint ledger_amount_by_reason check (
    (reason::text = 'initial' and amount = 100 and prediction_id is null and vote_id is null and mission_assignment_id is null)
    or (reason::text = 'stake' and amount = -10 and prediction_id is not null and vote_id is not null and mission_assignment_id is null)
    or (reason::text = 'win' and amount = 20 and prediction_id is not null and vote_id is not null and mission_assignment_id is null)
    or (reason::text = 'mission_verified' and amount in (5, 10, 20, 30) and prediction_id is null and vote_id is null and mission_assignment_id is not null)
  );

create unique index ledger_one_mission_reward_per_assignment
  on public.ledger (mission_assignment_id)
  where reason::text = 'mission_verified';

create or replace function private.mission_difficulty_rank(p_difficulty text)
returns integer
language sql
immutable
as $$
  select case p_difficulty
    when 'easy' then 1
    when 'medium' then 2
    when 'hard' then 3
    when 'chaotic_safe' then 4
    else 2
  end;
$$;

create or replace function private.mission_points(p_difficulty text)
returns integer
language sql
immutable
as $$
  select case p_difficulty
    when 'easy' then 5
    when 'medium' then 10
    when 'hard' then 20
    when 'chaotic_safe' then 30
    else 10
  end;
$$;

create or replace function private.validate_mission_template_insert()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'not authenticated';
  end if;

  if new.created_by is distinct from v_user_id then
    raise exception 'not authorized';
  end if;

  if not private.is_group_admin(new.group_id, v_user_id) then
    raise exception 'admin required';
  end if;

  if new.source = 'manual' and new.status <> 'active' then
    raise exception 'manual missions must start active';
  end if;

  if new.source = 'ai_generated' and new.status <> 'pending_review' then
    raise exception 'ai missions must start pending review';
  end if;

  return new;
end;
$$;

create trigger mission_templates_validate_before_insert
  before insert on public.mission_templates
  for each row execute function private.validate_mission_template_insert();

create or replace function private.validate_mission_outing_insert()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'not authenticated';
  end if;

  if new.created_by is distinct from v_user_id then
    raise exception 'not authorized';
  end if;

  if not private.is_group_admin(new.group_id, v_user_id) then
    raise exception 'admin required';
  end if;

  return new;
end;
$$;

create trigger mission_outings_validate_before_insert
  before insert on public.mission_outings
  for each row execute function private.validate_mission_outing_insert();

create or replace function private.validate_mission_assignment_update()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'not authenticated';
  end if;

  if new.outing_id is distinct from old.outing_id
    or new.group_id is distinct from old.group_id
    or new.user_id is distinct from old.user_id
    or new.mission_template_id is distinct from old.mission_template_id
    or new.assigned_at is distinct from old.assigned_at
    or new.rerolled_from_assignment_id is distinct from old.rerolled_from_assignment_id then
    raise exception 'mission assignment fields cannot be changed';
  end if;

  if old.user_id = v_user_id then
    if old.status not in ('assigned', 'rejected') or new.status not in ('completed', 'skipped') then
      raise exception 'invalid assignment update';
    end if;

    if new.verified_by is not null or new.verification_note is not null then
      raise exception 'users cannot verify their own mission';
    end if;

    if new.status = 'completed' and new.completed_at is null then
      new.completed_at := now();
    end if;

    return new;
  end if;

  if not private.is_group_member(old.group_id, v_user_id) then
    raise exception 'not a group member';
  end if;

  if old.status <> 'completed' or new.status not in ('verified', 'rejected') then
    raise exception 'mission is not ready for verification';
  end if;

  if new.verified_by is distinct from v_user_id then
    raise exception 'invalid verifier';
  end if;

  return new;
end;
$$;

create trigger mission_assignments_validate_before_update
  before update on public.mission_assignments
  for each row execute function private.validate_mission_assignment_update();

create or replace function private.create_mission_verification_ledger()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_difficulty text;
begin
  if new.status = 'verified' and old.status is distinct from 'verified' then
    select mt.difficulty
    into v_difficulty
    from public.mission_templates mt
    where mt.id = new.mission_template_id;

    insert into public.ledger (group_id, user_id, mission_assignment_id, amount, reason)
    values (new.group_id, new.user_id, new.id, private.mission_points(v_difficulty), 'mission_verified')
    on conflict do nothing;
  end if;

  return new;
end;
$$;

create trigger mission_assignments_create_ledger_after_update
  after update on public.mission_assignments
  for each row execute function private.create_mission_verification_ledger();

create or replace function public.assign_missions_to_members(
  p_group_id uuid,
  p_outing_id uuid
)
returns table (assigned_count integer, skipped_count integer, warning text)
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_user_id uuid := auth.uid();
  v_outing public.mission_outings%rowtype;
  v_existing_count integer;
  v_member record;
  v_pref public.mission_preferences%rowtype;
  v_template public.mission_templates%rowtype;
  v_inserted integer;
  v_assigned_count integer := 0;
  v_skipped_count integer := 0;
  v_max_rank integer;
begin
  if v_user_id is null then
    raise exception 'not authenticated';
  end if;

  if not private.is_group_admin(p_group_id, v_user_id) then
    raise exception 'admin required';
  end if;

  select *
  into v_outing
  from public.mission_outings
  where id = p_outing_id
    and group_id = p_group_id
  for update;

  if not found then
    raise exception 'outing not found';
  end if;

  if v_outing.status in ('completed', 'cancelled') then
    raise exception 'outing is not assignable';
  end if;

  select count(*)
  into v_existing_count
  from public.mission_assignments
  where outing_id = p_outing_id;

  if v_existing_count > 0 then
    return query select v_existing_count, 0, 'Missions were already assigned for this outing.';
    return;
  end if;

  if not exists (
    select 1
    from public.mission_templates mt
    where mt.group_id = p_group_id
      and mt.status = 'active'
  ) then
    raise exception 'no active missions';
  end if;

  for v_member in
    select gm.user_id
    from public.group_members gm
    where gm.group_id = p_group_id
    order by gm.joined_at asc
  loop
    v_template := null;
    v_pref := null;

    select *
    into v_pref
    from public.mission_preferences mp
    where mp.group_id = p_group_id
      and mp.user_id = v_member.user_id;

    v_max_rank := private.mission_difficulty_rank(coalesce(v_pref.max_difficulty, 'medium'));

    select mt.*
    into v_template
    from public.mission_templates mt
    where mt.group_id = p_group_id
      and mt.status = 'active'
      and (coalesce(v_pref.allow_performance, true) or mt.category <> 'performance')
      and (coalesce(v_pref.allow_photo, true) or mt.category <> 'photo')
      and private.mission_difficulty_rank(mt.difficulty) <= v_max_rank
    order by
      exists (
        select 1
        from public.mission_assignments ma
        where ma.outing_id = p_outing_id
          and ma.mission_template_id = mt.id
      ) asc,
      (
        select count(*)
        from public.mission_assignments ma
        where ma.outing_id = p_outing_id
          and ma.mission_template_id = mt.id
      ) asc,
      random()
    limit 1;

    if v_template.id is null then
      select mt.*
      into v_template
      from public.mission_templates mt
      where mt.group_id = p_group_id
        and mt.status = 'active'
        and mt.category in ('low_key', 'team')
        and mt.difficulty = 'easy'
      order by
        (
          select count(*)
          from public.mission_assignments ma
          where ma.outing_id = p_outing_id
            and ma.mission_template_id = mt.id
        ) asc,
        random()
      limit 1;
    end if;

    if v_template.id is null then
      v_skipped_count := v_skipped_count + 1;
    else
      insert into public.mission_assignments (outing_id, group_id, user_id, mission_template_id)
      values (p_outing_id, p_group_id, v_member.user_id, v_template.id)
      on conflict do nothing;

      get diagnostics v_inserted = row_count;
      v_assigned_count := v_assigned_count + v_inserted;
    end if;
  end loop;

  update public.mission_outings
  set status = 'active'
  where id = p_outing_id
    and status = 'draft';

  return query select
    v_assigned_count,
    v_skipped_count,
    case
      when v_skipped_count > 0 then 'Some members were skipped because no safe preference-compatible mission was available.'
      else null
    end;
end;
$$;

create or replace function public.verify_mission_assignment(
  p_assignment_id uuid,
  p_note text default null
)
returns void
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_user_id uuid := auth.uid();
  v_assignment public.mission_assignments%rowtype;
begin
  if v_user_id is null then
    raise exception 'not authenticated';
  end if;

  select *
  into v_assignment
  from public.mission_assignments
  where id = p_assignment_id
  for update;

  if not found then
    raise exception 'mission assignment not found';
  end if;

  if v_assignment.user_id = v_user_id then
    raise exception 'users cannot verify their own mission';
  end if;

  if not private.is_group_member(v_assignment.group_id, v_user_id) then
    raise exception 'not a group member';
  end if;

  if v_assignment.status = 'verified' then
    return;
  end if;

  if v_assignment.status <> 'completed' then
    raise exception 'mission is not ready for verification';
  end if;

  update public.mission_assignments
  set status = 'verified',
      verified_by = v_user_id,
      verification_note = nullif(trim(p_note), '')
  where id = p_assignment_id;
end;
$$;

alter table public.mission_templates enable row level security;
alter table public.mission_outings enable row level security;
alter table public.mission_assignments enable row level security;
alter table public.mission_preferences enable row level security;

create policy "members can read active missions and admins can read all"
  on public.mission_templates
  for select
  to authenticated
  using (
    private.is_group_member(group_id, (select auth.uid()))
    and (status = 'active' or private.is_group_admin(group_id, (select auth.uid())))
  );

create policy "admins can create mission templates"
  on public.mission_templates
  for insert
  to authenticated
  with check (
    created_by = (select auth.uid())
    and private.is_group_admin(group_id, (select auth.uid()))
  );

create policy "admins can update mission templates"
  on public.mission_templates
  for update
  to authenticated
  using (private.is_group_admin(group_id, (select auth.uid())))
  with check (private.is_group_admin(group_id, (select auth.uid())));

create policy "admins can delete mission templates"
  on public.mission_templates
  for delete
  to authenticated
  using (private.is_group_admin(group_id, (select auth.uid())));

create policy "members can read mission outings"
  on public.mission_outings
  for select
  to authenticated
  using (private.is_group_member(group_id, (select auth.uid())));

create policy "admins can create mission outings"
  on public.mission_outings
  for insert
  to authenticated
  with check (
    created_by = (select auth.uid())
    and private.is_group_admin(group_id, (select auth.uid()))
  );

create policy "admins can update mission outings"
  on public.mission_outings
  for update
  to authenticated
  using (private.is_group_admin(group_id, (select auth.uid())))
  with check (private.is_group_admin(group_id, (select auth.uid())));

create policy "admins can insert mission assignments"
  on public.mission_assignments
  for insert
  to authenticated
  with check (
    private.is_group_admin(group_id, (select auth.uid()))
    and private.is_group_member(group_id, user_id)
  );

create policy "members can read relevant mission assignments"
  on public.mission_assignments
  for select
  to authenticated
  using (
    private.is_group_admin(group_id, (select auth.uid()))
    or user_id = (select auth.uid())
    or (
      status in ('completed', 'verified')
      and user_id <> (select auth.uid())
      and private.is_group_member(group_id, (select auth.uid()))
    )
  );

create policy "users can update their own mission completion state"
  on public.mission_assignments
  for update
  to authenticated
  using (
    user_id = (select auth.uid())
    and private.is_group_member(group_id, (select auth.uid()))
  )
  with check (
    user_id = (select auth.uid())
    and status in ('completed', 'skipped')
    and private.is_group_member(group_id, (select auth.uid()))
  );

create policy "members can verify completed missions"
  on public.mission_assignments
  for update
  to authenticated
  using (
    status = 'completed'
    and user_id <> (select auth.uid())
    and private.is_group_member(group_id, (select auth.uid()))
  )
  with check (
    status in ('verified', 'rejected')
    and user_id <> (select auth.uid())
    and private.is_group_member(group_id, (select auth.uid()))
  );

create policy "members can read their own mission preferences"
  on public.mission_preferences
  for select
  to authenticated
  using (
    user_id = (select auth.uid())
    and private.is_group_member(group_id, (select auth.uid()))
  );

create policy "members can insert their own mission preferences"
  on public.mission_preferences
  for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and private.is_group_member(group_id, (select auth.uid()))
  );

create policy "members can update their own mission preferences"
  on public.mission_preferences
  for update
  to authenticated
  using (
    user_id = (select auth.uid())
    and private.is_group_member(group_id, (select auth.uid()))
  )
  with check (
    user_id = (select auth.uid())
    and private.is_group_member(group_id, (select auth.uid()))
  );

grant select, insert, update, delete on public.mission_templates to authenticated;
grant select, insert, update on public.mission_outings to authenticated;
grant select, insert on public.mission_assignments to authenticated;
grant update (status, completed_at, verified_by, verification_note) on public.mission_assignments to authenticated;
grant select, insert, update on public.mission_preferences to authenticated;

grant select (id, group_id, user_id, mission_assignment_id, amount, reason, created_at) on public.ledger to authenticated;

revoke all on function public.assign_missions_to_members(uuid, uuid) from public;
revoke all on function public.verify_mission_assignment(uuid, text) from public;

grant execute on function public.assign_missions_to_members(uuid, uuid) to authenticated;
grant execute on function public.verify_mission_assignment(uuid, text) to authenticated;
