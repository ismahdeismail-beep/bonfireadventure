# Bonfire Adventures — Website Audit & Rebuild

Working repository for (a) documenting the **current** Bonfire Adventures website
(`bonfireadventures.com`) exactly as it is today, and (b) capturing the
**requirements and decisions** for rebuilding it.

All live-site observations in this repo were captured on **2026-10-16**.

## Status

| Phase | Purpose | State |
|---|---|---|
| 1 — Audit | Document the live site section by section | 🟡 in progress |
| 2 — Requirements | Agreed behaviour for the new build | 🟡 in progress |
| 3 — Design / build | Local prototype of the rebuilt site | 🟢 runnable — `app/` |

## Non-negotiable constraints (Phase 1)

These came directly from the client and apply to **every** artefact in this repo.

1. **No contact details anywhere in this repo.**
   No phone numbers, email addresses, physical addresses, WhatsApp numbers or
   map pins. Existing-site findings describe contact *surfaces* (how many,
   where, whether they agree) without reproducing their values. Raw HTML
   captures are therefore kept **outside** the repo — see `evidence/README.md`.

2. **WhatsApp must not be scattered / overlapping across the site.**
   One consolidated entry point, driven by configuration rather than a
   hard-coded number repeated in every section and card.
   → `docs/requirements/02-whatsapp-consolidation.md`

3. **The site needs a real booking system.**
   WhatsApp is currently acting as checkout; that has to be replaced with an
   actual booking flow. → `docs/requirements/03-booking-system.md`

4. **User accounts and login must work properly.**
   → `docs/requirements/04-authentication-and-accounts.md`

Enforcement for constraint 1 lives in `scripts/check-no-contact.sh` (run it
before committing, or install the hook in `scripts/hooks/`).

## Navigation

```
docs/
  audit/          What the live site is and how it behaves, per area
  inventory/      Full index of live URLs pulled from the site's own sitemaps
  requirements/   What the rebuild must do (derived from the constraints above)
  decisions/      ADR-style records of decisions taken, with rationale
evidence/         Non-contact raw evidence (sitemaps, HTTP status matrix)
app/              Runnable local prototype (package browsing, booking, accounts)
```

Start with **`docs/audit/README.md`** (the audit checklist and index), then
**`docs/audit/08-findings-log.md`** (what's actually wrong today), then the
`docs/requirements/` set. For the running prototype, see **`app/README.md`**.

## A note on method

The audit follows the practical review framework rather than a pixel-perfect
reproduction: content and structure are confirmed from the rendered site and
its own sitemaps; purely visual and interaction details are explicitly marked
**UNVERIFIED** where they could not be confirmed from static evidence. The
audit itself only describes what exists; the rebuild lives in `docs/requirements/`
(agreed behaviour), `docs/decisions/` (open choices) and `app/` (a runnable
prototype of that behaviour).
