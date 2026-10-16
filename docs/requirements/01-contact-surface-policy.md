# Requirement 1 — Contact-surface policy (Phase 1: no contact details)

**Source constraint:** *"in this repo, don't put any contact for now…"*

## Intent

Phase 1 ships **without any public contact surface**. No phone numbers, no email
addresses, no physical addresses, no map pins, no WhatsApp number, no branch
list. The site must be fully usable and trustworthy with **zero** contact data
visible or embedded.

This also applies to **this repository**: no contact values are committed here,
and raw captures that contain them are kept outside the repo
(`../evidence/README.md`).

## Requirements

- **R1.1** No page template renders a phone number, email address, street
  address, map pin or WhatsApp number in Phase 1.
- **R1.2** No contact value is present in any *non-visible* surface either —
  `mailto:`/`tel:`/`wa.me` links, `href`s, JSON-LD, meta tags, the sitemap or
  `robots.txt`.
- **R1.3** Contact data is modelled as **configuration**, not template content,
  so it can be enabled later by changing one config value per channel — not by
  editing pages.
- **R1.4** Any element that would normally show contact info degrades cleanly to
  a neutral, non-contact alternative (e.g. a "How booking works" explainer, or
  the booking flow from Requirement 3) rather than an empty box or dead link.
- **R1.5** The current multi-location contact mess (3 numbers in one place, 5 in
  another, office list elsewhere, F-09) must not be reproduced. When contact is
  reintroduced it comes from one canonical record.

## Replaces / removes from the live site

| Live surface | Fate in Phase 1 |
|---|---|
| Utility bar (3 phones + email + address) | Removed |
| Footer contact block (phone + email + "open 24h") | Removed |
| Contact page (5 phones, 9 branches, form) | Repurposed/removed |
| F-01 leftover theme-demo footer (foreign address/email/phones) | Removed — highest priority |
| Header "Contact Us" link | Removed or repointed to non-contact content |

## Acceptance criteria

1. A site-wide scan for `tel:`, `mailto:`, `wa.me`, and known number patterns
   returns **zero** hits in rendered HTML and in the HTML source.
2. Building and grep-ing the repo for contact values returns **zero** hits
   (see the guard in `../decisions/0001-no-contact-surface-in-phase-1.md`).
3. Every page remains navigable and every primary action still resolves to a
   working, contact-free destination.

## Non-goals

- Deciding *whether* contact returns, or in what form. That is a later phase.
- Removing the underlying business data from the client's back office — only
  from the public site and this repo.

## Open items

- Are the **9 branch offices** (F-09) to be re-published later? If so they become
  structured location records, not page copy.
- Is there an approved **single** public contact channel for the eventual
  re-enable? (Currently multiple, inconsistent.)
