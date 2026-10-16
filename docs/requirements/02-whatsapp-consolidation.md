# Requirement 2 — WhatsApp is one entry point, not everywhere

**Source constraint:** *"the use of WhatsApp too should not overlap everywhere."*

## Intent

Today WhatsApp is the site's de-facto checkout **and** a floating widget **and**
a button on every card **and** a button inside the navigation **and** the final
CTA — with several hard-coded numbers and generic pre-filled text (F-06, F-04).

WhatsApp should be **at most one deliberate entry point**, secondary to the real
booking flow (Requirement 3), driven by configuration, and never duplicated.

## Requirements

- **R2.1** There is **exactly one** WhatsApp mechanism in the codebase: one
  reusable component that reads its number/message from **configuration**.
- **R2.2** WhatsApp appears in **at most one persistent, non-intrusive
  placement** (a single support entry), plus optionally **one** contextual
  placement on a package detail page — and both use the same component/config.
- **R2.3** WhatsApp must **not** appear on: package listing cards, the
  mega-menu, banner/promo panels, the homepage grid, or as a competing CTA in the
  final booking band. (All of these exist today.)
- **R2.4** The message is **generated from context** — the actual package
  name/ID — never a hard-coded string referring to a different package (F-04).
- **R2.5** WhatsApp is **not** the primary conversion action once Requirement 3
  ships; it is a fallback/"talk to a human" option.
- **R2.6** With contact surfaces suppressed (Requirement 1), the WhatsApp entry
  is **feature-flagged off by default** and only renders if its config is set.
- **R2.7** Whatever is enabled is **measurable** (click events), so we can tell
  whether it is used vs. the booking flow.

## Replaces / removes from the live site

| Live WhatsApp placement | Fate |
|---|---|
| Floating widget on every page (Joinchat, `creame-whatsapp-me`) | Removed |
| "More Info" button on every package card | Removed (cards link to the package) |
| Package-detail WhatsApp button | Replaced by "Book" (Req 3); optional single fallback |
| "Book via WhatsApp" in the mega-menu promo | Removed |
| Final CTA "Chat with a Travel Expert" | Replaced by the booking CTA |
| Hard-coded numbers in `wa.me` links | Replaced by one config value |

## Acceptance criteria

1. Grep the codebase for `wa.me` → **one** file (the component), **one** config
   key.
2. A rendered-page scan counts **at most one** WhatsApp action per page.
3. Clicking the entry produces a message containing the correct package context
   when on a package page.
4. Removing the config value makes every WhatsApp surface disappear with **no
   layout breakage**.

## Non-goals

- Removing WhatsApp as an *option*. It stays available — just consolidated.
- Choosing the eventual WhatsApp number (blocked by Requirement 1 for now).

## Open items

- Which single placement is preferred: a persistent support entry, or
  package-page-only? (Tracked in `../decisions/0002-single-whatsapp-entry-point.md`.)
- Is there one "official" number, or a routing layer (e.g. per-campaign)?
