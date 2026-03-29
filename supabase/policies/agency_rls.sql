-- Policy scaffold for future agency isolation
-- These are stubs only. Wire auth claims or profile joins before enabling in production.

-- Example approach:
-- alter table public.defendants enable row level security;
-- create policy "agency scoped defendants"
-- on public.defendants
-- for all
-- using (agency_id = auth.jwt() ->> 'agency_id')
-- with check (agency_id = auth.jwt() ->> 'agency_id');

-- Current repo status:
-- 1. Frontend supports agency-aware seed data and config selection.
-- 2. Supabase migration scaffolds agency_id columns.
-- 3. Query-level agency filtering is feature-flagged and off by default until backend claims exist.
