# Mission Impossible

A private friend-group prediction app built with Next.js App Router, TypeScript, Tailwind CSS, shadcn-style UI components, Supabase Auth/Postgres/RLS, and Zod.

This app uses virtual points only. It has no payments, deposits, withdrawals, or real-money wagering.

## Features

- Supabase email/password auth with profile creation on sign-up
- Private groups with unique invite codes
- Admin/member roles per group
- Yes/No predictions with close times
- One vote per prediction
- 10 point stake per vote
- Automatic stake ledger entries
- Creator/admin resolution
- Idempotent winner payouts of +20 points
- Group leaderboard from the ledger
- Group-specific Missions deck for bar/club outings
- Manual mission creation plus AI-generated missions with admin review
- Random mission assignment per outing with member preferences
- Mission completion, peer verification, and virtual point rewards
- RLS policies and server-side validation for writes

## Environment Variables

Copy `.env.example` to `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini
```

`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` is the preferred browser key. `NEXT_PUBLIC_SUPABASE_ANON_KEY` is optional legacy compatibility. `SUPABASE_SERVICE_ROLE_KEY` is listed for deployment parity but the app does not use it; never expose it in browser code.

`OPENAI_API_KEY` is only used by server actions for AI mission generation. Do not prefix it with `NEXT_PUBLIC_`. `OPENAI_MODEL` is optional and defaults to `gpt-4.1-mini`.

## Create A Supabase Project

1. Create a project at <https://supabase.com/dashboard>.
2. In Authentication, enable Email/Password sign-in.
3. Copy the Project URL and anon/publishable key into `.env.local`.
4. If email confirmations are enabled, set the Confirm signup email template link to:

```text
{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email
```

5. Add local and production URLs to Auth URL settings:

```text
http://localhost:3000
https://your-vercel-domain.vercel.app
```

## Run Migrations

The migrations live in `supabase/migrations/`:

- `202607060001_initial_schema.sql`
- `202607060002_missions.sql`

Using Supabase CLI:

```bash
npx supabase login
npx supabase init
npx supabase link --project-ref your-project-ref
npx supabase db push
```

Or open the SQL editor in the Supabase dashboard and run the migration file manually.

The migrations create all tables, constraints, triggers, RPC functions, grants, and RLS policies. They also include explicit grants because newer Supabase projects may not expose new public tables to the Data API automatically.

## Missions

Missions are group-specific challenges for a night out. Admins can create safe manual missions, generate similar AI missions, review/edit/approve/reject them, create an outing, and assign one active mission to each member.

Mission tables:

- `mission_templates`
- `mission_outings`
- `mission_assignments`
- `mission_preferences`

Mission rewards use the existing `ledger` table with reason `mission_verified`:

- Easy: +5
- Medium: +10
- Hard: +20
- Chaotic safe: +30

Verification is idempotent through a unique ledger index on `mission_assignment_id`, so a verified assignment cannot pay twice.

## AI Mission Generation

1. Add several manual missions in a group.
2. Open `/groups/[groupId]/missions/generate`.
3. Choose count, venue type, vibe, categories, and difficulty mix.
4. Generated missions are saved as `pending_review`.
5. Admins approve, edit, reject, archive, or delete from `/groups/[groupId]/missions/review`.

The server action calls the OpenAI Responses API with strict JSON schema output, validates the result with Zod, and runs a safety filter before inserting rows.

## Random Assignment

Create an outing at `/groups/[groupId]/missions/outings/new`, then open the outing detail page and click `Assign Random Missions`.

Assignment rules:

- Only admins can assign missions.
- Only active mission templates are eligible.
- Each member gets one assignment per outing.
- Unique missions are preferred when there are enough active missions.
- Duplicates are spread evenly when the deck is smaller than the group.
- Preferences filter performance/photo missions and max difficulty.
- Existing assignments are shown instead of duplicated.

## Mission Safety

The app blocks obvious unsafe mission text and prompts the model away from harassment, sexual pressure, alcohol pressure, filming strangers without consent, theft, vandalism, trespassing, fighting, bothering staff, drunk driving, illegal activity, dangerous stunts, and humiliation.

This is an MVP safety layer, not a moderation guarantee. Group admins must still review generated missions before they become assignable.

## Run Locally In VS Code

```bash
npm install
npm run dev
```

Open <http://localhost:3000>.

Recommended VS Code flow:

1. Open this folder: `mission impossible`.
2. Create `.env.local`.
3. Run the migration against Supabase.
4. Start the dev server with `npm run dev`.
5. Sign up, create a group, and invite a friend with the group code.

## Deploy To Vercel

1. Push the repo to GitHub.
2. Import the project in Vercel.
3. Add these environment variables in Vercel Project Settings:

```bash
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
OPENAI_API_KEY
OPENAI_MODEL
```

4. Set the Vercel domain in Supabase Auth URL settings.
5. Run the Supabase migration before using production.
6. Deploy.

Vercel build command:

```bash
npm run build
```

## Project Structure

```text
app/
components/
components/ui/
lib/actions/
lib/db/
lib/supabase/
lib/validations/
types/
supabase/migrations/
```

## Notes

- Vote counts refresh after voting or resolution via server action revalidation and client refresh.
- Group creation, joining, vote staking, and resolution are enforced in Postgres with RLS, triggers, and secure RPC functions.
- The service role key is not needed for this MVP.
