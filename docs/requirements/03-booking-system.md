# Requirement 3 — A real booking system

**Source constraint:** *"we need to have a good booking system."*

## Intent

Today there is **no booking system**: no availability, no reservation, no
payment, no record. "Booking" means starting a WhatsApp chat (F-06), the pricing
shown is a placeholder (F-03), and the commerce layer is an empty WooCommerce
shell (F-07). The rebuild must let a visitor go from a package to a **confirmed
booking** and leave a **structured record** behind.

## Requirements

### Package & pricing integrity (prerequisite)

- **R3.1** Each package has **one canonical price model** (from-price, per-person,
  season/date modifiers) stored once and rendered everywhere — listing and detail
  must never disagree (fixes F-03).
- **R3.2** Offers with a validity window render only while valid, and are
  auto-hidden when expired (fixes F-05).
- **R3.3** Package name/ID used on cards, detail pages and any WhatsApp fallback
  is the same record (fixes F-04).

### The booking flow

- **R3.4** A visitor can select a package and specify: travel **date(s)**,
  **duration/option**, **number of travellers** (adults/children), and any
  rooms/vehicle option the package defines.
- **R3.5** The system computes and shows a **price for that selection** before
  commitment.
- **R3.6** The visitor can submit a booking request or reservation and receives a
  clear **confirmation state** (reference number + status).
- **R3.7** A booking has a **lifecycle** (`enquiry → reserved → confirmed →
  cancelled/expired`) and is **stored server-side** against a customer and a
  package.
- **R3.8** Staff can view and act on bookings (confirm, cancel, annotate).
- **R3.9** Payment is handled through a defined provider/stage — even if Phase 1
  is "reserve now, pay later", the model must have a payment/status field so
  payment can be switched on without a rebuild.
- **R3.10** Booking data is validated server-side (dates, availability, party
  size, price) — never trusted from the client.

### Availability & inventory (as far as packages allow)

- **R3.11** Where a package has finite capacity or fixed departure dates, the
  system tracks and enforces that; where it doesn't, the model still allows a
  date-based request without over-promising availability.

### Measurement

- **R3.12** Funnel events are recorded: view package → start booking → submit →
  confirmed. This is the data the current WhatsApp-only flow cannot produce.

## Acceptance criteria

1. End-to-end: a test user books a package, receives a reference and a status,
   and the booking is visible to staff with correct package/date/party/price.
2. Changing a package's price in one place updates the listing **and** the detail
   page and any price preview (no second source).
3. An offer whose validity has passed does not render anywhere.
4. Booking submission works with JS disabled at least to the point of a
   server-rendered confirmation (graceful degradation).

## Platform decision needed

The current stack is WordPress + Elementor, with WooCommerce installed but
inert. Options (see `../decisions/0003-booking-engine-direction.md`):

- **A — Fix/complete WooCommerce + a bookings extension.**
- **B — Purpose-built booking plugin** on the existing WordPress stack.
- **C — Headless / separate booking service** with the WordPress site as the
  marketing front-end.

Each has different implications for Requirements 1, 2 and 4, so this is the first
decision to lock.

## Non-goals

- Multi-currency/commission logic beyond what packages need now.
- Full CRM replacement — booking records feed staff, they don't replace it.

## Open items

1. Which option (A/B/C) above?
2. Which payment provider, and does Phase 1 take payment or only reserve?
3. Who fulfils bookings (the branch network?), and what do they need in the
   record?
4. Does "availability" reflect real inventory (hotel/seat contracts) or is it
   request-based?
