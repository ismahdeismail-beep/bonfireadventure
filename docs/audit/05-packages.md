# 05 — Packages (listing and detail)

**Status: CONFIRMED for structure, copy and pricing as rendered.**

Packages are the site's core product. They are a WordPress custom post type
(`nd_travel_cpt_1`, 43 entries). The listing and the detail page are two
different templates and are assessed separately.

---

## A. Packages listing — `/packages/`

Page title "Our Packages". A grid of **package cards**.

### Card anatomy

```
┌──────────────────────────────┐
│  package photograph          │
├──────────────────────────────┤
│  2 Days            ← duration │
│  Package Title                │
│  Destination  (e.g. Nakuru)   │
│  Short description            │
│  From  Ksh. 36,200   ← price  │
│  [ Details ]                  │
└──────────────────────────────┘
```

### What the listing actually shows (10 cards captured)

| Package | Destination tag | Duration | "From" price |
|---|---|---|---|
| Standard Chartered Marathon Packages | Nakuru | 2 Days | Ksh. 36,200 |
| 2026 SGR Mombasa August Holiday Deals | Mombasa North Coast | 3/5 Days | Ksh. 36,200 |
| 2026 SGR Mombasa | Mombasa North Coast | 3/5 Days | Ksh. 36,200 |
| Diani SGR 2026 Deals | Diani | 3/5 Days | Ksh. 36,200 |
| Watamu / Malindi 2026 Deals | Malindi | 3/5 Days | Ksh. 36,200 |
| Kuala Lumpur Shopcation | Kuala Lumpur, Malaysia | 5 Days | Ksh. 36,200 |
| Coastal Escapes & International Experiences 2026 | Seasonal Offers | — | Ksh. 36,200 |
| 2026 Easter Packages | Seasonal Offers | — | Ksh. 36,200 |
| Bush Packages – Maasai Mara | Maasai Mara | 3 days | Ksh. 36,200 |
| 5 Days 4 Nights Mauritius | Mauritius | 5 Days | Ksh. 36,200 |

### Findings

- **F-03 (high):** **every** listing shows the identical "From Ksh. 36,200".
  A package page that costs USD 2,999 (Italy) and a Nakuru weekend showing the
  same KSh figure is not plausible — this is a shared placeholder / default
  field, not real pricing. It makes the listing commercially unusable.
- **F-16:** "2026 SGR Mombasa August Holiday Deals" and "2026 SGR Mombasa" are
  duplicates — same image, same description, same price.
- **F-17:** copy is reused across unrelated packages — the **Diani SGR** card's
  description is Watamu/Malindi copy ("…curated stays in Watamu and Malindi…"),
  on a Diani package.
- No working **filters or sorting** are present on the listing (no category,
  duration, price or destination filter was found in the markup). For 43
  packages this is a discovery gap, not just a nicety.
- The card `Details` link and the card image both point at the same package URL —
  consistent (contrast with the Popular-destinations cards, F-02).

---

## B. Individual package page — `/packages/<slug>/`

Reference the client used: the Nakuru summer-deals package. Structure observed
on package detail pages:

1. Package title / hero + overview
2. Duration, destination and package meta
3. Transport / travel arrangement
4. Highlights + gallery
5. Day-by-day itinerary
6. What's included / excluded
7. Enquiry action (WhatsApp)
8. Related packages + final CTA

### Findings

- **F-06:** the primary/only conversion action on the detail page is a
  **WhatsApp enquiry**. There is no date picker, no availability, no traveller
  count, no price calculation, no reservation, no payment. "Booking" today means
  "start a WhatsApp chat".
- **F-04:** the enquiry message is **hard-coded text**, not generated from the
  package's own name — package pages share the same pre-filled WhatsApp copy
  (observed referring to an unrelated "Sarova Whitesands – Galentine Getaway"
  package on several different cards).
- **F-05:** validity windows/dated offers on package content include periods that
  have already passed (H1 2026) yet remain published and promoted.
- Price, duration and destination shown on the **card** vs the **detail page**
  are not guaranteed to agree because the card price is the shared placeholder
  (F-03). A field-by-field consistency pass across all 43 packages is required
  (tracked in `09-open-questions.md`).

---

## C. Package inventory

All 43 package URLs are listed in `docs/inventory/packages.md`.
