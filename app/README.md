# Bonfire Adventures — prototype (Phase 3)

A runnable local prototype of the rebuilt site: **package browsing**, a **real
booking flow**, and **working accounts**. It exists to prove the Phase 1–2
requirements are buildable, and to give the client something concrete to react
to before a platform decision is made.

It deliberately implements the four constraints in the repo root `README.md`:

1. **No contact surfaces** — no phone, email, address or map pin anywhere. The
   guard `../scripts/check-no-contact.sh` covers this directory too.
2. **One WhatsApp entry point** — a single, configuration-driven component that
   renders **nothing** unless a number is configured (see ADR-0002).
3. **A real booking system** — server-computed pricing, a stored reservation
   with a reference and a lifecycle status (R3.x).
4. **Working accounts** — register / log in / log out, scrypt-hashed passwords,
   single-use password reset, roles (R4.x).

## Run it

No dependencies, no build step. Node ≥ 20 (developed on Node 24).

```sh
cd app
node server.js
# → http://127.0.0.1:3000
```

Then open <http://127.0.0.1:3000>.

To configure anything, copy `.env.example` to `.env` (it is gitignored) — or
just pass environment variables inline:

```sh
PORT=3000 \
ADMIN_HANDLE=desk ADMIN_PASSWORD='choose-something-long' \
WHATSAPP_NUMBER=... \
node server.js
```

### Where the data lives

Accounts, sessions and bookings are kept in **Supabase Postgres** when the
environment provides `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`; otherwise
the app falls back to a local JSON file at `app/data/db.json` (gitignored). Both
paths go through one async interface (`src/db.js`), so nothing else in the app
changes. See **ADR-0005** for why, and for the security rules around the
`service_role` key.

```sh
# Supabase (only needs the two variables above; usually read from .env)
node server.js

# Force the offline JSON file instead
STORE=json node server.js
```

The schema lives in `supabase/migrations/0001_bonfire_core.sql` — every table is
prefixed `bonfire_` because the Supabase project is shared with other work. Apply
it with the Supabase CLI (`supabase db push`) or by pasting it into the SQL
editor.

### Reset the data

```sh
node scripts/reset.js          # clears the active store and re-seeds staff
```

With `STORE=json` this simply rewrites `app/data/db.json`. With Supabase it
deletes rows **only** from the `bonfire_*` tables.

## What to try

| Try this | What it shows |
|---|---|
| Open a package and change date/travellers/extras | Live price preview (`/api/quote`); the server re-prices on submit |
| Sign in, then open any package | The lead traveller is **pre-filled from your account** — book in one step |
| Tick "Booking for someone else" | The field clears so you can reserve on another person's behalf |
| Submit the booking form | A stored reservation with a reference like `BF-XXXXX` and status `reserved` |
| Create an account, then book | The booking appears under **Your account** |
| Log in as staff (`ADMIN_HANDLE` / `ADMIN_PASSWORD`) → **Travel desk** | Confirm or cancel a reservation; the customer then sees the new status |
| Open **Offers** | Only in-window offers are bookable; ended ones are listed but blocked |
| Look at `Galentine & Easter 2026` | An expired offer: no booking form, "This offer has ended" |

## How it maps to the requirements

| Area | File |
|---|---|
| Single-source pricing, offer validity windows, quotes | `src/pricing.js` |
| Booking lifecycle, references, server-side validation | `src/bookings.js` |
| Accounts, sessions, CSRF, rate limiting, reset tokens | `src/auth.js` |
| Password hashing (scrypt, constant-time compare) | `src/password.js` |
| Security headers (CSP, HSTS, `X-Frame-Options`, nosniff…) | `src/http.js` |
| Storage facade + driver selection | `src/db.js` |
| Supabase PostgREST driver (`bonfire_*` tables) | `src/drivers/supabase.js` |
| Offline JSON driver (fallback) | `src/drivers/json.js` |
| SQL schema / migration | `supabase/migrations/0001_bonfire_core.sql` |
| Seed catalogue (destinations + packages) | `src/seed.js` |
| WhatsApp single entry point | `whatsappEntry()` in `src/views.js` |

## Security notes (fixing the live-site baseline)

The live audit found **no** CSP, HSTS or `X-Frame-Options` and no working login
(`docs/audit/08-findings-log.md`). This prototype adds, on every response:

- `Content-Security-Policy` (self-only; no inline script/style), `X-Frame-Options: DENY`,
  `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`,
  `Strict-Transport-Security`, `Permissions-Policy`, `Cross-Origin-Opener-Policy`.
- Session cookies are `HttpOnly`, `SameSite=Lax`, and `Secure` when `NODE_ENV=production`;
  the session id is regenerated on login.
- Every state-changing form carries and verifies a **CSRF** token.
- Login attempts are rate-limited; password reset tokens are single-use and expire.
- A password change invalidates all of that account's existing sessions.

This is a prototype, not production: there is no TLS termination, no email
delivery (reset links are shown on screen), and no payment provider.

## Why no dependency

The target environment had Node and nothing else (no Docker, no Composer), and
the whole point is to demonstrate the *booking and account logic*. Keeping it
dependency-free means it runs anywhere `node` does — including talking to
Supabase, which is done with the built-in `fetch` rather than an SDK.

## Open decisions this prototype does not settle

See `../docs/decisions/`:

- **ADR-0003** — which booking engine the real build should use (this prototype
  is a reference implementation of the requirements, not a choice of engine).
- **ADR-0004** — whether accounts are mandatory or guest checkout is allowed.
  This build currently allows **both** (a guest can book with just a name) and
  is designed so either can be enforced later.
- **ADR-0002** — where the WhatsApp entry point sits (currently package detail only).

Storage is settled: **ADR-0005** — accounts and bookings live in the shared
Supabase project, in `bonfire_*` tables, reached only from the server.
