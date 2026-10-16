# 0002 — One WhatsApp entry point

- **Status:** Accepted (placement to be confirmed — see Open)
- **Date:** 2026-10-16
- **Source:** client instruction — *"the use of WhatsApp too should not overlap everywhere"*

## Context

WhatsApp currently appears in at least five simultaneous roles on the site: a
floating widget on every page (Joinchat plugin), buttons on every package card,
buttons on package detail pages, a button inside the header mega-menu, and the
final CTA — using multiple hard-coded numbers and generic pre-filled text that
often names the *wrong* package (F-04, F-06).

## Decision

1. Implement **one** WhatsApp component, reading its number and message from
   **configuration**.
2. Allow **at most one persistent placement** (a single support entry) plus, if
   desired, **one** contextual placement on a package detail page. Both use the
   same component and config.
3. **Remove** WhatsApp from: package listing cards, the mega-menu promo, homepage
   grids, and the final CTA band.
4. Generate the message from the real package context; never hard-code a
   package name.
5. WhatsApp is a **fallback**, not the primary action, once the booking system
   ships.
6. The entry is **feature-flagged**, default **off** in Phase 1 (per ADR-0001).

## Consequences

- **Positive:** removes visual clutter and CTA competition; makes the real
  booking flow the obvious path; makes WhatsApp measurable; kills F-04 (wrong
  pre-fill) and the F-06 "everywhere" problem.
- **Negative:** fewer one-tap contact options during Phase 1. Accepted, because
  the booking flow replaces that intent and Phase 1 forbids contact anyway.
- **Dependency:** the Joinchat plugin should be deactivated rather than
  merely hidden, so the floating widget and its config disappear entirely.

## Open

- Confirm the single preferred placement (persistent support entry **vs.**
  package-page-only). Recommendation: **package-page-only** in Phase 2, with a
  persistent entry reconsidered once contact is re-enabled.
