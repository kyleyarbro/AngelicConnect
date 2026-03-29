create extension if not exists "pgcrypto";

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique,
  role text not null check (role in ('defendant','admin')),
  full_name text not null,
  email text not null unique,
  phone text,
  defendant_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.defendants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  full_name text not null,
  dob date,
  phone text,
  email text,
  emergency_contact_name text,
  emergency_contact_phone text,
  active boolean not null default true,
  bond_status text not null default 'active',
  missed_check_in boolean not null default false,
  bail_agent_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.users
  add constraint users_defendant_fk foreign key (defendant_id) references public.defendants(id) on delete set null;

create table if not exists public.bonds (
  id uuid primary key default gen_random_uuid(),
  defendant_id uuid not null references public.defendants(id) on delete cascade,
  bond_number text not null unique,
  bond_amount numeric(12,2) not null,
  status text not null,
  charges text,
  conditions text,
  indemnitor_name text,
  indemnitor_phone text,
  company_name text,
  company_phone text,
  company_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.court_dates (
  id uuid primary key default gen_random_uuid(),
  defendant_id uuid not null references public.defendants(id) on delete cascade,
  court_datetime timestamptz not null,
  court_address text not null,
  status text not null default 'scheduled',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  defendant_id uuid not null references public.defendants(id) on delete cascade,
  amount_due numeric(12,2) not null,
  due_date date not null,
  status text not null,
  paid_at timestamptz,
  method text,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.check_ins (
  id uuid primary key default gen_random_uuid(),
  defendant_id uuid not null references public.defendants(id) on delete cascade,
  checked_in_at timestamptz not null default now(),
  source text not null,
  status text not null,
  latitude numeric(9,6),
  longitude numeric(9,6),
  selfie_name text not null,
  selfie_data_url text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.location_logs (
  id uuid primary key default gen_random_uuid(),
  defendant_id uuid not null references public.defendants(id) on delete cascade,
  check_in_id uuid references public.check_ins(id) on delete set null,
  captured_at timestamptz not null default now(),
  latitude numeric(9,6),
  longitude numeric(9,6),
  source text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.reminders (
  id uuid primary key default gen_random_uuid(),
  defendant_id uuid not null references public.defendants(id) on delete cascade,
  type text not null,
  title text not null,
  message text not null,
  scheduled_for timestamptz not null,
  status text not null default 'pending',
  acknowledged boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  defendant_id uuid not null references public.defendants(id) on delete cascade,
  author_name text not null,
  body text not null,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_users_updated_at on public.users;
create trigger trg_users_updated_at before update on public.users for each row execute function public.set_updated_at();
drop trigger if exists trg_defendants_updated_at on public.defendants;
create trigger trg_defendants_updated_at before update on public.defendants for each row execute function public.set_updated_at();
drop trigger if exists trg_bonds_updated_at on public.bonds;
create trigger trg_bonds_updated_at before update on public.bonds for each row execute function public.set_updated_at();
drop trigger if exists trg_court_dates_updated_at on public.court_dates;
create trigger trg_court_dates_updated_at before update on public.court_dates for each row execute function public.set_updated_at();
drop trigger if exists trg_payments_updated_at on public.payments;
create trigger trg_payments_updated_at before update on public.payments for each row execute function public.set_updated_at();
drop trigger if exists trg_reminders_updated_at on public.reminders;
create trigger trg_reminders_updated_at before update on public.reminders for each row execute function public.set_updated_at();
