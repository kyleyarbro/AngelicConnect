-- Agency RLS staging script
-- Run manually in Supabase SQL editor after:
-- 1) agency_id backfill is complete on agency-owned tables
-- 2) JWT claims are wired (agency_id, app_role, defendant_id)
--
-- NOTE: This is safe scaffolding, not "automatic production hardening."
-- If your JWT claims are missing, these policies will deny access.

create or replace function public.current_agency_id()
returns text
language sql
stable
as $$
  select nullif(
    coalesce(
      auth.jwt() ->> 'agency_id',
      current_setting('request.jwt.claim.agency_id', true)
    ),
    ''
  );
$$;

create or replace function public.current_app_role()
returns text
language sql
stable
as $$
  select lower(
    nullif(
      coalesce(
        auth.jwt() ->> 'app_role',
        auth.jwt() ->> 'role',
        current_setting('request.jwt.claim.app_role', true),
        current_setting('request.jwt.claim.role', true)
      ),
      ''
    )
  );
$$;

create or replace function public.current_defendant_id()
returns uuid
language sql
stable
as $$
  select
    case
      when coalesce(
        auth.jwt() ->> 'defendant_id',
        current_setting('request.jwt.claim.defendant_id', true)
      ) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      then (
        coalesce(
          auth.jwt() ->> 'defendant_id',
          current_setting('request.jwt.claim.defendant_id', true)
        )
      )::uuid
      else null
    end;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select public.current_app_role() in ('admin', 'agency_admin', 'owner');
$$;

create or replace function public.is_defendant()
returns boolean
language sql
stable
as $$
  select public.current_app_role() = 'defendant';
$$;

create or replace function public.same_agency(target_agency_id text)
returns boolean
language sql
stable
as $$
  select
    target_agency_id is not null
    and public.current_agency_id() is not null
    and target_agency_id = public.current_agency_id();
$$;

create or replace function public.is_self_defendant(target_defendant_id uuid)
returns boolean
language sql
stable
as $$
  select
    target_defendant_id is not null
    and public.current_defendant_id() is not null
    and target_defendant_id = public.current_defendant_id();
$$;

-- Enable RLS on agency-owned tables.
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
alter table if exists public.agencies enable row level security;

-- Clean up older broad policy names from previous scaffold revisions.
drop policy if exists users_agency_scope on public.users;
drop policy if exists defendants_agency_scope on public.defendants;
drop policy if exists bonds_agency_scope on public.bonds;
drop policy if exists court_dates_agency_scope on public.court_dates;
drop policy if exists payments_agency_scope on public.payments;
drop policy if exists check_ins_agency_scope on public.check_ins;
drop policy if exists location_logs_agency_scope on public.location_logs;
drop policy if exists reminders_agency_scope on public.reminders;
drop policy if exists notes_agency_scope on public.notes;
drop policy if exists activity_logs_agency_scope on public.activity_logs;

-- Agencies table: users can only read their own agency row.
drop policy if exists agencies_read_current on public.agencies;
create policy agencies_read_current on public.agencies
for select
to authenticated
using (id = public.current_agency_id());

-- Users: admins can read/write users in their agency.
-- Defendants can read only their own user row through auth_user_id.
drop policy if exists users_admin_all on public.users;
create policy users_admin_all on public.users
for all
to authenticated
using (public.is_admin() and public.same_agency(agency_id))
with check (public.is_admin() and public.same_agency(agency_id));

drop policy if exists users_defendant_read_self on public.users;
create policy users_defendant_read_self on public.users
for select
to authenticated
using (
  public.is_defendant()
  and public.same_agency(agency_id)
  and auth.uid() is not null
  and auth.uid() = auth_user_id
);

-- Defendants table: admins full agency scope; defendant can read own profile.
drop policy if exists defendants_admin_all on public.defendants;
create policy defendants_admin_all on public.defendants
for all
to authenticated
using (public.is_admin() and public.same_agency(agency_id))
with check (public.is_admin() and public.same_agency(agency_id));

drop policy if exists defendants_self_read on public.defendants;
create policy defendants_self_read on public.defendants
for select
to authenticated
using (
  public.is_defendant()
  and public.same_agency(agency_id)
  and public.is_self_defendant(id)
);

-- Bonds / cases: admins full agency scope; defendant read own rows.
drop policy if exists bonds_admin_all on public.bonds;
create policy bonds_admin_all on public.bonds
for all
to authenticated
using (public.is_admin() and public.same_agency(agency_id))
with check (public.is_admin() and public.same_agency(agency_id));

drop policy if exists bonds_defendant_read_self on public.bonds;
create policy bonds_defendant_read_self on public.bonds
for select
to authenticated
using (
  public.is_defendant()
  and public.same_agency(agency_id)
  and public.is_self_defendant(defendant_id)
);

-- Court dates: admins full agency scope; defendant read own rows.
drop policy if exists court_dates_admin_all on public.court_dates;
create policy court_dates_admin_all on public.court_dates
for all
to authenticated
using (public.is_admin() and public.same_agency(agency_id))
with check (public.is_admin() and public.same_agency(agency_id));

drop policy if exists court_dates_defendant_read_self on public.court_dates;
create policy court_dates_defendant_read_self on public.court_dates
for select
to authenticated
using (
  public.is_defendant()
  and public.same_agency(agency_id)
  and public.is_self_defendant(defendant_id)
);

-- Payments: admins full agency scope; defendant read own rows.
drop policy if exists payments_admin_all on public.payments;
create policy payments_admin_all on public.payments
for all
to authenticated
using (public.is_admin() and public.same_agency(agency_id))
with check (public.is_admin() and public.same_agency(agency_id));

drop policy if exists payments_defendant_read_self on public.payments;
create policy payments_defendant_read_self on public.payments
for select
to authenticated
using (
  public.is_defendant()
  and public.same_agency(agency_id)
  and public.is_self_defendant(defendant_id)
);

-- Check-ins: admins full agency scope; defendant can read/insert own rows.
drop policy if exists check_ins_admin_all on public.check_ins;
create policy check_ins_admin_all on public.check_ins
for all
to authenticated
using (public.is_admin() and public.same_agency(agency_id))
with check (public.is_admin() and public.same_agency(agency_id));

drop policy if exists check_ins_defendant_read_self on public.check_ins;
create policy check_ins_defendant_read_self on public.check_ins
for select
to authenticated
using (
  public.is_defendant()
  and public.same_agency(agency_id)
  and public.is_self_defendant(defendant_id)
);

drop policy if exists check_ins_defendant_insert_self on public.check_ins;
create policy check_ins_defendant_insert_self on public.check_ins
for insert
to authenticated
with check (
  public.is_defendant()
  and public.same_agency(agency_id)
  and public.is_self_defendant(defendant_id)
);

-- Location logs: admins full agency scope; defendant can read/insert own rows.
drop policy if exists location_logs_admin_all on public.location_logs;
create policy location_logs_admin_all on public.location_logs
for all
to authenticated
using (public.is_admin() and public.same_agency(agency_id))
with check (public.is_admin() and public.same_agency(agency_id));

drop policy if exists location_logs_defendant_read_self on public.location_logs;
create policy location_logs_defendant_read_self on public.location_logs
for select
to authenticated
using (
  public.is_defendant()
  and public.same_agency(agency_id)
  and public.is_self_defendant(defendant_id)
);

drop policy if exists location_logs_defendant_insert_self on public.location_logs;
create policy location_logs_defendant_insert_self on public.location_logs
for insert
to authenticated
with check (
  public.is_defendant()
  and public.same_agency(agency_id)
  and public.is_self_defendant(defendant_id)
);

-- Reminders: admins full agency scope; defendant read own rows.
drop policy if exists reminders_admin_all on public.reminders;
create policy reminders_admin_all on public.reminders
for all
to authenticated
using (public.is_admin() and public.same_agency(agency_id))
with check (public.is_admin() and public.same_agency(agency_id));

drop policy if exists reminders_defendant_read_self on public.reminders;
create policy reminders_defendant_read_self on public.reminders
for select
to authenticated
using (
  public.is_defendant()
  and public.same_agency(agency_id)
  and public.is_self_defendant(defendant_id)
);

-- Notes: admin-only by default (defendants do not read internal staff notes).
drop policy if exists notes_admin_all on public.notes;
create policy notes_admin_all on public.notes
for all
to authenticated
using (public.is_admin() and public.same_agency(agency_id))
with check (public.is_admin() and public.same_agency(agency_id));

-- Activity logs: admins full agency scope; defendants can read own timeline events.
drop policy if exists activity_logs_admin_all on public.activity_logs;
create policy activity_logs_admin_all on public.activity_logs
for all
to authenticated
using (public.is_admin() and public.same_agency(agency_id))
with check (public.is_admin() and public.same_agency(agency_id));

drop policy if exists activity_logs_defendant_read_self on public.activity_logs;
create policy activity_logs_defendant_read_self on public.activity_logs
for select
to authenticated
using (
  public.is_defendant()
  and public.same_agency(agency_id)
  and (
    defendant_id is null
    or public.is_self_defendant(defendant_id)
  )
);

-- Optional hardening step once verified in staging:
-- alter table public.users force row level security;
-- alter table public.defendants force row level security;
-- alter table public.bonds force row level security;
-- alter table public.court_dates force row level security;
-- alter table public.payments force row level security;
-- alter table public.check_ins force row level security;
-- alter table public.location_logs force row level security;
-- alter table public.reminders force row level security;
-- alter table public.notes force row level security;
-- alter table public.activity_logs force row level security;
