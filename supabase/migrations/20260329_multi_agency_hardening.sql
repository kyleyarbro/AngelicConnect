-- Multi-agency hardening follow-up
-- Run this after 20260329_multi_agency_scaffold.sql.
-- This keeps existing rows valid while adding the columns/tables needed for
-- stronger tenant separation and future selfie storage scaling.

create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  agency_id text references public.agencies(id),
  defendant_id uuid references public.defendants(id) on delete set null,
  event_type text not null default 'general',
  event_text text not null,
  event_meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table if exists public.check_ins add column if not exists selfie_storage_path text;
alter table if exists public.check_ins add column if not exists selfie_public_url text;
alter table if exists public.check_ins add column if not exists capture_method text;
alter table if exists public.check_ins add column if not exists check_in_session_id text;

create index if not exists idx_users_agency_id on public.users(agency_id);
create index if not exists idx_defendants_agency_id on public.defendants(agency_id);
create index if not exists idx_bonds_agency_id on public.bonds(agency_id);
create index if not exists idx_court_dates_agency_id on public.court_dates(agency_id);
create index if not exists idx_payments_agency_id on public.payments(agency_id);
create index if not exists idx_check_ins_agency_id on public.check_ins(agency_id);
create index if not exists idx_location_logs_agency_id on public.location_logs(agency_id);
create index if not exists idx_reminders_agency_id on public.reminders(agency_id);
create index if not exists idx_notes_agency_id on public.notes(agency_id);
create index if not exists idx_activity_logs_agency_id on public.activity_logs(agency_id);
create index if not exists idx_activity_logs_created_at on public.activity_logs(created_at desc);

comment on table public.activity_logs is 'Agency-scoped operational events and timeline entries.';
comment on column public.check_ins.selfie_storage_path is 'Future-safe Supabase Storage path for check-in selfies.';
comment on column public.check_ins.selfie_public_url is 'Public or signed URL cache for selfie preview when storage is used.';
comment on column public.check_ins.capture_method is 'Capture source (for example: live_camera).';
comment on column public.check_ins.check_in_session_id is 'Client session marker proving selfie was captured during the current check-in flow.';

-- Manual follow-up after migration:
-- 1) Backfill agency_id values for existing rows using your legacy tenant mapping.
-- 2) Set agency_id to NOT NULL on all agency-owned tables once backfill is complete.
-- 3) Enable and test RLS policies in supabase/policies/agency_rls.sql.
