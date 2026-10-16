# 0001 — Phase 1 exposes no contact surfaces

- **Status:** Accepted
- **Date:** 2026-10-16
- **Source:** client instruction — *"in this repo, don't put any contact for now"*

## Context

The live site repeats contact data across templates with inconsistent values: a
utility bar with 3 phone numbers, a footer with 1, a contact page with 5 plus 9
branch offices, and a leftover **theme-demo footer** publishing a *foreign*
address, email and phone numbers (F-01, F-09, F-10). There is no single source of
truth, so the site cannot currently be kept consistent.

The client has instructed that Phase 1 carry **no contact details at all**.

## Decision

1. The Phase 1 rebuild ships with **no** phone, email, address, map or WhatsApp
   number anywhere — visible or embedded.
2. The same rule applies to **this repository**: no contact values are committed.
   Raw HTML captures (which contain them) are stored **outside** the repo, and
   `.gitignore` excludes `*.html` by default.
3. Contact data is modelled as **configuration** from the start, so it can be
   re-enabled per channel by changing one value, with no template edits.
4. Contact-dependent UI degrades to contact-free alternatives (booking flow,
   explainers) rather than empty slots.

## Consequences

- **Positive:** eliminates the F-01 demo-footer embarrassment and the F-09
  inconsistency in one move; removes a whole class of PII exposure and an
  anti-spam/abuse surface (the unprotected form).
- **Negative:** the business loses a familiar "call us" path during Phase 1;
  mitigation is Requirement 3 (booking) + Requirement 2 (a single, optional
  WhatsApp fallback that is **off** unless configured).
- **Enforcement:** a repository guard (grep for `tel:`, `mailto:`, `wa.me` and
  number patterns) runs before commit so the rule can't be broken by accident.
  Implemented as `scripts/check-no-contact.sh`; install with
  `cp scripts/hooks/pre-commit .git/hooks/pre-commit`.

## Alternatives considered

- **Keep contact but standardise it now** — rejected: the client explicitly said
  no contact for now, and standardising needs decisions (which numbers?) that
  aren't made.
- **Leave the demo footer but hide via CSS** — rejected: still in the HTML/source
  and search-indexable.
