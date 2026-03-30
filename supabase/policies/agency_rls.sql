-- Agency RLS preparation script
-- Execute manually in Supabase SQL editor after agency_id backfill.
-- This script is intentionally explicit so rollout can be staged safely.

create or replace function public.current_agency_id()
returns text
language sql
stable
as $$
  select nullif(coalesce(auth.jwt() ->> 'agency_id', current_setting('request.jwt.claim.agency_id', true)), '');
$$;

create or replace function public.current_app_role()
returns text
language sql
stable
as $$
  select coalesce(auth.jwt() ->> 'app_role', current_setting('request.jwt.claim.app_role', true), 'defendant');
$$;

-- Enable RLS table-by-table only after verifying agency_id is fully populated.
alter table if exists public.users enable row level security;
alter table if exists public.defendants enable row level security;
alter table if exists public.bonds enable row level security;
alter table if exists public.court_dates enable row level security;
alter table if exists public.payments enable row level security;
alter table if exists public.check_ins enable row level security;
alter table if exists public.location_logs enable row level security;
alter table if exists public.reminders enable row level security;
alter table if exists public.notes enable row level security;
alter table if exists public.activity_logs enable row level security;

do $$
declare
  table_name text;
  policy_name text;
  tables text[] := array[
    'users',
    'defendants',
    'bonds',
    'court_dates',
    'payments',
    'check_ins',
    'location_logs',
    'reminders',
    'notes',
    'activity_logs'
  ];
begin
  foreach table_name in array tables loop
    policy_name := table_name || '_agency_scope';
    if not exists (
      select 1
      from pg_policies
      where schemaname = 'public'
        and tablename = table_name
        and policyname = policy_name
    ) then
      execute format(
        'create policy %I on public.%I for all using (agency_id = public.current_agency_id()) with check (agency_id = public.current_agency_id())',
        policy_name,
        table_name
      );
    end if;
  end loop;
end $$;

-- Role split policies (manual option):
-- Admins can read/write all rows in their agency.
-- Defendants should only read rows tied to their own defendant_id.
-- Implement that final refinement after linking jwt defendant_id claims.

-- Example defender policy pattern:
-- create policy defendants_self_scope on public.check_ins
-- for select
-- using (
--   agency_id = public.current_agency_id()
--   and defendant_id::text = coalesce(auth.jwt() ->> 'defendant_id', current_setting('request.jwt.claim.defendant_id', true))
-- );
