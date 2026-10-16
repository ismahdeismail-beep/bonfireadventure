# 0003 — Booking engine direction

- **Status:** **Proposed** — needs client input
- **Date:** 2026-10-16
- **Source:** client instruction — *"we need to have a good booking system"*

## Context

There is no booking engine today. The stack is WordPress + Elementor with
**WooCommerce installed but inert** (`/shop/` → homepage, no products, empty
cart/checkout/my-account). Pricing on the listing is a shared placeholder
(Ksh. 36,200 for everything — F-03), and the only "booking" action is WhatsApp.

The choice of booking approach constrains Requirements 1, 2 and 4 (contact
suppression, WhatsApp consolidation, and where accounts live), so it must be
decided first.

## Options

### A — Complete WooCommerce + a bookings extension
Keep everything on WordPress; finish WooCommerce properly; add a bookings
extension for dates/capacity.
- ✅ Reuses installed infrastructure; staff tools familiar; accounts come free
  (WooCommerce customer accounts satisfy Requirement 4).
- ❌ Booking semantics bolted onto a shop metaphor; pricing/seasonality model can
  get awkward; performance of a heavy WP + Elementor + Woo stack.

### B — Purpose-built booking plugin on WordPress
Replace the WooCommerce shell with a dedicated booking engine (freeing the shop
layer).
- ✅ Purpose-built for dates/capacity/party size; faster to model packages
  correctly; keeps the current CMS.
- ❌ Another licensed dependency; accounts/permissions depend on the plugin;
  migration of the (inert) Woo data is trivial today — easier now than later.

### C — Headless / separate booking service
WordPress stays as the marketing site; booking + accounts live in a dedicated
service (custom app or a booking SaaS) with an API.
- ✅ Cleanest separation; the booking engine can be excellent; the marketing site
  can be redesigned freely.
- ❌ Most work and most cost; two systems to run; needs an API layer and
  identity strategy; overkill if volume is modest.

## Recommendation

**Option B**, with a **guarded fallback to C** if volume/complexity grows.
Rationale: the current WooCommerce install carries no usable data, so discarding
it costs nothing; a purpose-built engine models this business (packages, dates,
party size, seasonal pricing, validity windows) far more naturally than a
product/cart model; and it keeps the existing CMS investment.

Whatever is chosen, the **prerequisite** stands regardless of option:
single-source pricing (R3.1), auto-expiring offers (R3.2) and consistent package
records (R3.3). Those are content-model fixes, not engine features.

## Consequences (for Option B)

- Deactivate/remove the WooCommerce shells and the `-2` duplicates (F-07).
- Introduce a Booking entity with the lifecycle in R3.7.
- Pay now or reserve-later is a config choice; the payment field exists from day
  one (R3.9).
- Accounts (Requirement 4) are owned by the booking engine or a shared identity —
  see ADR-0004.

## Open

1. Client pick: A / B / C.
2. Publish scope: does the eventual booking need real availability (contracted
   inventory) or is every booking a request that staff confirm?
3. Payment provider and whether Phase 1 takes payment.
