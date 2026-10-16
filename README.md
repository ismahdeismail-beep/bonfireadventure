# Bonfire Adventures — Website Audit, Rebuild Requirements, and Prototype

Working repository for (a) documenting the **current** Bonfire Adventures website
(`bonfireadventures.com`) exactly as it is, and (b) capturing the **requirements,
decisions and a runnable prototype** for the rebuilt site.

Everything was captured/built on **2026-10-16**. Nothing in this repo contains
contact details — every artefact complies with ADR-0001 (below).

## Status at a glance

| Phase | Purpose | State |
|---|---|---|
| 1 — Audit | Document the live site section by section | ✅ draft complete — `docs/audit/` |
| 2 — Requirements | Agreed behaviour for the new build | ✅ draft — `docs/requirements/` |
| 3 — Design / build | Runnable local prototype (browsing, booking, accounts) | ✅ runnable — `app/` |
| 4 — Storage | Accounts + bookings in the shared Supabase project (ADR-0005) | ✅ applied (`bonfire_users`, `bonfire_sessions`, `bonfire_reset_tokens`, `bonfire_bookings`) |
| 5 — Deployment | Vercel serverless adapter committed; auto-deploy via GitHub→Vercel | ✅ wired (`api/index.js`, `vercel.json`) |
| Pending | Booking-engine choice (ADR-0003), mandatory accounts vs guest (ADR-0004), customer-care phone | ⏳ awaits client |

## Non-negotiable constraints — they apply to every file in this repo

1. **No contact details anywhere.**
   No phone numbers, email addresses, physical addresses, WhatsApp numbers or
   map pins. Audit findings describe contact *surfaces* (how many, where, whether
   they agree) without reproducing values. Raw HTML captures are kept **outside**
   the repo at `/tmp/opencode/bonfire-evidence/` (see `evidence/README.md`).
   Enforced by `scripts/check-no-contact.sh` plus a committed pre-commit hook.
   **Zero** email or phone literals in the tracked tree.

2. **One WhatsApp entry point.**
   A single config-driven component (`whatsappEntry()` in `app/src/views.js`) that
   renders **nothing** unless `WHATSAPP_NUMBER` is configured (ADR-0002).

3. **A real booking system.**
   WhatsApp used to act as checkout — replaced with a server-priced reservation
   that has a reference and a lifecycle status (R3.x). See
   `docs/requirements/03-booking-system.md`.

4. **Working accounts and login.**
   Register / log in / log out; scrypt-hashed passwords; single-use reset tokens;
   roles; rate-limited login. See `docs/requirements/04-authentication-and-accounts.md`.

## Navigation

```
docs/
  00-methodology.md              Review framework used for the audit.
  audit/                         What the live site is and how it behaves (10 files)
  inventory/                     Every URL pulled from the site's own sitemaps
  requirements/                  What the rebuild must do (4 numbered docs, README)
  decisions/                     ADRs — 6 so far, with rationale
evidence/                        Non-contact raw evidence (sitemaps, status matrix)
app/                             Runnable local prototype (package browsing, booking, accounts)
scripts/                         Guards, hooks, evidence-capture helpers
```

Start here: `docs/audit/README.md` → `docs/audit/08-findings-log.md` →
`docs/requirements/` → `docs/decisions/`. For the running prototype:
**`app/README.md`**.

## Run the prototype

No dependencies, no build step. Node ≥ 20 (developed on Node 24).

```sh
cd app
npm start           # or: node server.js
# → http://127.0.0.1:3000
```

`cd app && node --check server.js && node --check src/handler.js` validates syntax.

## Configuration (all in `.env`, which is gitignored)

Copy `app/.env.example` to `app/.env`. Nothing is required to boot — defaults are
safe (all contact surfaces OFF).

| Key | Purpose |
|---|---|
| `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` | Where accounts and bookings live (shared SAVANNA-MOTORS project; Bonfire uses only `bonfire_*` tables) |
| `STORE` | `supabase` / `json` (auto-detected when Supabase keys present) |
| `SESSION_SECRET` | Sign/verify sessions (set a long random string anywhere shared) |
| `ADMIN_HANDLE` / `ADMIN_PASSWORD` | Seeds the travel-desk staff account on first run |
| `WHATSAPP_NUMBER` / `WHATSAPP_PLACEMENT` | The single WhatsApp entry point; empty = off |
| `PAY_*` (`PAY_PAYBILL`, `PAY_ACCOUNT`, `PAY_NAME`, `PAY_PROVIDER`, `PAY_PAYBILL` toggle `PAYMENTS_ENABLED`) | M-Pesa panel on booking confirmation |
| `CHILD_RATE` / `DEPOSIT_RATE` | Pricing tuning |

The `service_role` key bypasses Row Level Security — server-side only, never
commit. See ADR-0005.

## Data model

Schema lives in `app/supabase/migrations/0001_bonfire_core.sql`:
`bonfire_users`, `bonfire_sessions`, `bonfire_reset_tokens`, `bonfire_bookings`
(21 columns). All indexes + RLS-without-policies are in the migration.

```sh
cd app
node scripts/reset.js   # clears the active store and re-seeds staff
```

## Deploy (Vercel — GitHub auto-deploy already connected)

`api/index.js` + `vercel.json` make every route a serverless function. The
GitHub→Vercel connection means every push auto-deploys. Function environment
must include at minimum: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
`SESSION_SECRET`, `ADMIN_HANDLE`, `ADMIN_PASSWORD`, and optionally `PAY_*` and
`WHATSAPP_NUMBER`. With Supabase keys absent the build falls back to the JSON
driver (`DATA_FILE=/tmp/bonfire-db.json`), which is ephemeral.

## Tests

The end-to-end flow suite is `app/../tmp/opencode/bf-flow-test.sh` (lives
outside the repo in the test workspace). It resets the active store, seeds staff,
and exercises all 49 cases — auth, booking, pre-fill, reset, CSRF, rate limits,
role checks, healthz. A green run prints `RESULT: 49 passed, 0 failed`.

## Audit in brief

24 findings (F-01 … F-24) are logged in `docs/audit/08-findings-log.md`.
Headline ones the prototype deliberately fixes:

- **F-03 / F-16** — one placeholder price on every package, and duplicate
  packages. The prototype carries per-package prices and no duplicate slugs.
- **F-04 / F-06** — WhatsApp on every card/header/CTA with the wrong
  pre-filled text. Single config-driven entry point on package pages only.
- **F-05** — stale "2026" offers advertised. Offers page hides ended ones.
- **F-09 / F-10 / F-11** — no working login, prices not machine-readable,
  admin view broken. Working accounts + machine-readable page, travel desk works.
- **F-13** — no CSP/HSTS. Security headers on every response.
- **F-17** — bookings are not stored. Stored reservations with references.
- **F-18** — a play-money `714777`/`0759398975` was copy-pasted onto every offer.
  Now a real M-Pesa instruction panel rendered only when configured.

## Key decisions recorded (ADRs)

| ADR | Topic | Status | File |
|---|---|---|---|
| 0001 | Phase 1 hides all contact surfaces | Accepted | `docs/decisions/0001-phase-1-hides-all-contact-surfaces.md` |
| 0002 | One WhatsApp entry point | Accepted | `docs/decisions/0002-single-whatsapp-entry-point.md` |
| 0003 | Booking engine choice (A/B/C candidate comparison + questions) | **Proposed** (client decision pending) | `docs/decisions/0003-booking-engine-direction.md` |
| 0004 | Account ownership + mandatory vs guest checkout | **Proposed** | `docs/decisions/0004-account-and-auth-direction.md` |
| 0005 | Supabase for storage (namespaced tables, first-party auth) | Accepted | `docs/decisions/0005-supabase-storage.md` |
| 0006 | M-Pesa paybill panel on booking confirmation | Accepted | `docs/decisions/0006-payments-paybill.md` |

The two "Proposed" ADRs contain direct questions for the client — open them
before planning the next phase, because several prototype knobs
(stored procedures, account gating rules, reconciliation model) hinge on them.

## Guard clause (ADR-0001)

Every commit runs `scripts/check-no-contact.sh` automatically and it checks the whole
repo. `git push` to `main` only happens when it prints `OK`. Do not tamper with
the hook. To whitelist a new intentional surface you must update both the ADR and
the guard in the same commit.