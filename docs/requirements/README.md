# Phase 2 — Requirements for the rebuild

These documents turn the client's four constraints into testable requirements.
They are written against the audit findings in `../audit/`, and each requirement
records the live-site behaviour it is replacing.

| # | Requirement | Source constraint | Related findings |
|---|---|---|---|
| 1 | Contact-surface policy | "don't put any contact for now" | F-01, F-09, F-10 |
| 2 | WhatsApp consolidation | "WhatsApp should not overlap everywhere" | F-04, F-06 |
| 3 | Booking system | "we need a good booking system" | F-03, F-05, F-06, F-07 |
| 4 | Authentication & accounts | "user logins need to be fine" | F-07, F-08, security baseline |

## How to read these documents

Each requirement uses:

- **Intent** — why it exists, in the client's words.
- **Requirements** — numbered, testable statements (`R#`).
- **Acceptance criteria** — how we'll know it's met.
- **Non-goals** — what it deliberately doesn't cover yet.
- **Open items** — decisions still needed (tracked as ADRs in `../decisions/`).

## Cross-cutting principles

1. **One source of truth per fact.** A package's price, a phone number or a
   WhatsApp number must live in exactly one place and be *rendered* from there —
   never retyped into templates. Every inconsistency found in the audit (F-03,
   F-04, F-09) is a symptom of duplicated data.
2. **Nothing is promoted unless it is currently valid.** Expired offers must not
   render (F-05).
3. **Conversion is measured.** The current WhatsApp-only path produces no data
   (F-06). The rebuild must record intent-to-book.
4. **Phase 1 surfaces no contact details.** Until the client says otherwise, the
   site exposes no phone, email, address or WhatsApp number (constraint 1).
5. **Accessibility & security are baseline, not options.** The current site has
   no CSP/HSTS/X-Frame-Options and unverified contrast (security baseline, V-8).
