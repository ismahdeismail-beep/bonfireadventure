-- Bonfire Adventures — core tables (users, sessions, password resets, bookings).
--
-- Applied to the shared Supabase project. Every table is prefixed `bonfire_`
-- so it cannot collide with other work living in the same project.
--
-- Row Level Security is enabled with NO policies on purpose: the anon and
-- authenticated roles can read nothing. Only the server-side `service_role`
-- key (which bypasses RLS) touches these tables, and that key never leaves the
-- server. See app/README.md.

create extension if not exists pgcrypto;

-- ----------------------------------------------------------------- models ---

create table if not exists public.bonfire_users (
  id            uuid primary key,
  handle        text not null unique,
  name          text not null,
  role          text not null default 'customer' check (role in ('customer', 'staff')),
  password_hash text not null,
  consent_at    timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Sessions carry the CSRF token for the form that created them, so a session
-- row is required even for anonymous visitors.
create table if not exists public.bonfire_sessions (
  id         text primary key,
  user_id    uuid references public.bonfire_users (id) on delete cascade,
  csrf       text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create table if not exists public.bonfire_reset_tokens (
  token      text primary key,
  user_id    uuid not null references public.bonfire_users (id) on delete cascade,
  expires_at timestamptz not null,
  used       boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.bonfire_bookings (
  id             uuid primary key,
  ref            text not null unique,
  user_id        uuid references public.bonfire_users (id) on delete set null,
  traveller_name text not null,
  for_self       boolean not null default false,
  package_id     text not null,
  package_title  text not null,
  option_id      text,
  option_label   text,
  start_date     date not null,
  travellers     jsonb not null default '{}'::jsonb,
  extras         jsonb not null default '[]'::jsonb,
  currency       text not null,
  total          integer not null,
  deposit        integer not null,
  balance        integer not null,
  status         text not null default 'reserved'
                 check (status in ('enquiry', 'reserved', 'confirmed', 'cancelled', 'expired')),
  payment_status text not null default 'unpaid'
                 check (payment_status in ('unpaid', 'deposit_paid', 'paid', 'refunded')),
  history        jsonb not null default '[]'::jsonb,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ---------------------------------------------------------------- indexes ---

create index if not exists bonfire_sessions_expires_idx
  on public.bonfire_sessions (expires_at);
create index if not exists bonfire_sessions_user_idx
  on public.bonfire_sessions (user_id);
create index if not exists bonfire_reset_tokens_user_idx
  on public.bonfire_reset_tokens (user_id);
create index if not exists bonfire_bookings_user_idx
  on public.bonfire_bookings (user_id, created_at desc);
create index if not exists bonfire_bookings_status_idx
  on public.bonfire_bookings (status);

-- --------------------------------------------------------------------- RLS --

alter table public.bonfire_users        enable row level security;
alter table public.bonfire_sessions     enable row level security;
alter table public.bonfire_reset_tokens enable row level security;
alter table public.bonfire_bookings     enable row level security;

-- Deliberately no policies (deny-by-default for anon/authenticated).
