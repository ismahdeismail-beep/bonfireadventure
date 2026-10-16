# 0005 — Accounts and bookings stored in Supabase Postgres

- **Status:** Accepted
- **Date:** 2026-10-16
- **Source:** client instruction — *"we need also to create a user database where they
  would login and track their booking … i prefer supabase"*, *"ask the session
  (safaris) for the credentials so you can get connected well under one project"*
- **Supersedes:** the JSON-file storage described in ADR-0004's phase-3 prototype

## Context

The Phase-3 prototype persisted everything to a single JSON file
(`app/data/db.json`). That was enough to demonstrate the booking and account
logic, but it cannot back a deployed site: a file is per-instance and is lost on
every redeploy (the target host runs on Vercel).

The client already has a Supabase account and an existing project that other
work ("safaris") uses. The instruction was to keep Bonfire **under the same
project** rather than spin up a new one.

## Decision

1. Store accounts, sessions, password-reset tokens and bookings in **Supabase
   Postgres**, in the shared project.
2. Every Bonfire table is prefixed **`bonfire_`** (`bonfire_users`,
   `bonfire_sessions`, `bonfire_reset_tokens`, `bonfire_bookings`) so nothing can
   collide with the other work living in that project. The schema ships as a
   migration: `app/supabase/migrations/0001_bonfire_core.sql`.
3. **Row Level Security is enabled with no policies.** The `anon` and
   `authenticated` roles can read nothing. Only the server-side
   `service_role` key touches these tables, and it never reaches the browser.
4. Access uses **PostgREST over `fetch`**, not the `@supabase/supabase-js` SDK, so
   the app keeps its zero-npm-dependency property.
5. Auth stays **first-party** (scrypt hashes in `bonfire_users`, server-issued
   session cookies). We deliberately do **not** use Supabase Auth: that would put
   Bonfire's users into the same `auth.users` pool as the other app in the
   project, letting a Bonfire account (or an administrator of the other app) see
   the other's users. Keeping `auth.users` untouched keeps the two products
   logically separate.
6. A **`json` driver remains** as an offline fallback, selected automatically
   when Supabase is not configured. Both drivers share one async interface
   (`src/db.js`), so the rest of the app is driver-agnostic.
7. Credentials come only from the environment (`SUPABASE_URL`,
   `SUPABASE_SERVICE_ROLE_KEY`). No key, project URL or ref is committed; the
   `.env` file is gitignored.

## Consequences

- **Positive:** durable, shared, serverless-friendly storage; bookings survive
  redeploys; a real "user database" the client asked for; the CSP and the
  single-WhatsApp rules are unaffected because the browser never talks to
  Supabase directly.
- **Positive:** prefixed tables + untouched `auth.users` mean the two products in
  the shared project cannot read or overwrite each other's data.
- **Negative:** the app now needs network access to Supabase to store anything.
  Mitigated by the JSON driver, which keeps the repo runnable with no secrets.
- **Negative:** login rate-limiting is still per-process (in memory). With more
  than one server instance it should move into the database; noted for the real
  build.
- **Security note:** the `service_role` key bypasses RLS. It must only ever be set
  in server-side environment variables — never in client code, never committed.

## Open

- Whether to use Supabase Auth (magic links / OAuth) once contact details are
  collected. Not now: Phase 1 forbids contact surfaces and the shared `auth.users`
  pool is a conflict (see Decision 5).
- Connection pooling / `DATABASE_URL` if a direct SQL connection is ever needed;
  PostgREST is sufficient today.
