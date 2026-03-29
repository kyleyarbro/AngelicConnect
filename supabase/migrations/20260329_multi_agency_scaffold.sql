-- Multi-agency readiness scaffold
-- This migration prepares the schema for white-label separation without claiming
-- that all app queries are fully agency-scoped yet.

create table if not exists public.agencies (
  id text primary key,
  slug text not null unique,
  company_name text not null,
  created_at timestamptz not null default now()
);

alter table if exists public.users add column if not exists agency_id text references public.agencies(id);
alter table if exists public.defendants add column if not exists agency_id text references public.agencies(id);
alter table if exists public.bonds add column if not exists agency_id text references public.agencies(id);
alter table if exists public.court_dates add column if not exists agency_id text references public.agencies(id);
alter table if exists public.payments add column if not exists agency_id text references public.agencies(id);
alter table if exists public.check_ins add column if not exists agency_id text references public.agencies(id);
alter table if exists public.location_logs add column if not exists agency_id text references public.agencies(id);
alter table if exists public.reminders add column if not exists agency_id text references public.agencies(id);
alter table if exists public.notes add column if not exists agency_id text references public.agencies(id);

comment on table public.agencies is 'White-label agency registry for branded deployments.';
comment on column public.users.agency_id is 'Agency owner for future row-level isolation.';
comment on column public.defendants.agency_id is 'Agency owner for future row-level isolation.';
comment on column public.check_ins.agency_id is 'Agency owner for future row-level isolation.';
