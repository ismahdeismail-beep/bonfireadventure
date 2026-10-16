# 03 — Homepage, section by section

**Status: CONFIRMED for content and order; UNVERIFIED for purely visual
behaviour** (animation, sticky header, image cropping).

Order below is the order the sections appear in the rendered homepage.

---

## 01 — Top utility bar

A thin bar above the header carrying, left to right:

- Social links: Facebook, X/Twitter, Instagram, TikTok. **The X/Twitter link is
  empty** (no `href`) in the footer social block (F-10).
- **Three phone numbers** presented as a list.
- One email address.
- One physical office address.

*Contact values redacted per repo policy.* Note the inconsistency: the utility
bar carries **3** numbers, `/contact-us/` lists **5** (F-09).

## 02 — Site header / primary navigation

Brand logo → homepage, plus a persistent "Contact Us" link and a search control.

Mega-menu has four top-level triggers: **Destinations**, **Tours & Packages**,
**About Us**, **Blog**. Full breakdown in `04-navigation-map.md`.

Inside the Destinations mega-menu there is also a **Featured holiday** promo
panel: "Dubai City Escape – 5 Days" with a WhatsApp booking button — i.e. a
promotional panel is embedded in the *navigation* (not the page body).

## 03 — Featured publications

Heading "FEATURED PUBLICATIONS" with brochure thumbnails (Turkey/Istanbul,
Thailand, Kenyan Bush, Europe, Diani, Watamu) and a "See More" link to
`/brochures/`. Rendered via the `dflip` flip-book plugin.

## 04 — Our promise / "Why Travel With Bonfire"

A trust band with animated counters:

- Years of Travel Experience — `0 +`
- Curated Safari & Beach Packages — `0 +`
- Happy Travelers — `0 K+`
- Transparency Pricing — `0 %`
- Travel Support — `0/7`
- Hotel Partners — `0 +`

**Finding F-19:** in the static/no-JS rendering every counter shows a literal
`0`. These are JS count-up animations whose start value is `0`; verification
needed that they always animate up (and are readable if JS fails).

## 05 — Reviews & testimonials

Heading "WHAT OUR TRAVELLERS SAY", a carousel of review cards
(`testimonials-carousel-elementor`), and a "Read All Reviews" link to
`/reviews-testimonials/`.

## 06 — Brand introduction ("LET'S GO TOGETHER")

- Headline: *"We Take You Places, You Make the Memories"*.
- Two value props: **Exclusive Deals** and **Premium Travel**.
- "About Us" link → `/about-us/`.

## 07 — "How Booking Works"

Heading "SIMPLE AND FAST / HOW BOOKING WORKS". **Finding F-24 (UNVERIFIED):**
the section heading renders, but the step content is not present in the static
capture — it is either empty, JS-injected, or an unpopulated widget. Needs a
browser check. This is the section that *should* describe the booking journey
that requirement 3 (`docs/requirements/03-booking-system.md`) has to make real.

## 08 — Coastal escapes & international experiences

Package cards. Each card shows: image, a category tag (e.g. *International*,
*Private Island*), package title, duration, price line(s), validity window, and
a **"More Info" button that is a WhatsApp link**.

Cards observed:
- Italy & Vatican Educational Tour 2026 — 8 Days / 7 Nights — USD 2,999 p.p.s.
- PrideInn Paradise Aqua Beach Holiday 2026 — 2 Nights / 4 Nights — validity
  **ends 31 Mar 2026**.
- Chale Island Private Paradise Escape 2026 — 3 Days / 5 Days — validity
  **14 Jan – 15 Mar 2026**.
- Hemingways Watamu Coastal Retreat 2026 — SGR vs flight pricing — validity
  windows entirely in H1 2026.

**Findings:**
- **F-05:** validity windows in the past are still actively promoted.
- **F-04:** every "More Info" button pre-fills a WhatsApp message referring to
  an **unrelated** package ("…Sarova Whitesands – Galentine Getaway…"), not the
  package the button sits under.
- The "See Full Collection" link points to the **Easter** package page rather
  than the coastal collection page it describes (F-12).

## 09 — Popular destinations

An 8-card grid (Dubai, Mauritius, South Africa, Mount Kenya, Nakuru,
Watamu/Malindi, Samburu, Naivasha) with a short description each and an
"Explore All" link → `/packages` (the *packages* listing, not destinations)
(F-12).

**Findings:**
- **F-02:** every card **title** links to `/destinations/samburu/` regardless of
  which destination it names (Dubai→Samburu, Mauritius→Samburu, …). Only the card
  *image* links to the correct destination.
- **F-17:** Mount Kenya and South Africa share byte-identical description copy;
  several others reuse the same templated sentences.

Below the grid, an "INTERNATIONAL DESTINATIONS" block contains **leftover theme
demo copy**: *"Leading Tour Packages Booking website, Over 30,000 Hotel rooms
worldwide…"* (F-18).

## 10 — Newsletter + final CTA

- A newsletter block whose "Subscribe" is an **Elementor popup trigger**
  (`elementor-action:action=popup:open…`), not an inline form.
- Final CTA band: "Ready to Plan Your Next Journey?" with a WhatsApp
  "Chat with a Travel Expert" button and a "Browse all Packages" link.

## 11 — Footer

Real brand footer: logo, tagline ("…since 2009"), one phone, one email,
"We are Open 24hours", four link columns (Explore Packages, Destinations,
Company, social), four trust badges, copyright, Privacy Policy, Terms &
Conditions.

**Findings:**
- **F-09:** footer says "Open 24hours" while `/contact-us/` says "Mon–Sat 9AM–6PM".
- **F-10:** social links in the footer are partly empty; "Frequently Asked
  Questions" and "Travel Policies" in the Company column are **plain text, not
  links**.
- **F-01 (critical):** immediately *after* the real footer there is a second,
  leftover **theme-demo footer** ("Best Travel Theme / Elementor Demos", six
  nicdark demo links, plus a foreign address, an unrelated email and unrelated
  phone numbers, and an "Our Contacts" block for a completely different
  business). This renders on the homepage, `/packages/` and `/contact-us/`.

## Section order (as rendered)

```
01 Top utility bar (socials · phones · email · address)
02 Header / mega-nav (+ embedded featured holiday promo)
03 Featured publications
04 Our promise (animated counters)
05 Reviews & testimonials
06 Brand introduction ("We Take You Places…")
07 How booking works            ← content missing in static render
08 Coastal escapes / package cards (WhatsApp "More Info")
09 Popular destinations         ← wrong title links, duplicate copy
10 Newsletter + final CTA
11 Footer (real)                ← followed by leftover theme-demo footer
```
