# 0006 — Payments via M-Pesa paybill (config-driven, surfaced from Phase 1.1)

- **Status:** Accepted (customer-care phone still suppressed per ADR-0001)
- **Date:** 2026-10-16
- **Source:** client instruction — *"payment method so far is Bonfire Adventures … Paybill 714777 / Account 0759398975 … fix that too"*

## Context

Phase 1 hid every contact surface (ADR-0001) and the package-detail WhatsApp
entry (ADR-0002) is feature-flagged off, so visitors had **no way to act on a
booking** other than submit it. The live site, by contrast, hands over paybill
instructions on every offer. We need an equivalent that does not re-leak the
personal phone number active in the same source material.

## Decision

1. A **single payment panel** renders on the booking-confirmation page only —
   never on package cards, lists, destinations or the header.
2. It **reads every value from configuration** (`PAY_PAYBILL`, `PAY_ACCOUNT`,
   `PAY_NAME`, `PAY_PROVIDER`, `PAY_ACCOUNT_LABEL`, `PAYMENTS_ENABLED`). The repo
   carries **no paybill or account number** — only empty placeholders in
   `.env.example`; real values live in `.env` / the hosting environment, which
   is consistent with the way staff credentials and the Supabase keys are handled.
3. The panel is **feature-flagged off by default** — it renders only when a paybill
   is configured. A fresh clone with no config shows nothing.
4. The customer-care phone **stays suppressed**. It is contact, not payment
   routing, and remains blocked by ADR-0001 until the client replaces it. Payment
   routing (paybill + account) is treated as business-facing and surfaced.
5. Paybill instructions are **shown, not collected**. The prototype does not
   capture an M-Pesa receipt number or reconcile payments — bookings remain
   `reserved → confirmed` by the travel desk (see the booking engine question in
   ADR-0003).
6. No email, no phone and no mailing address are introduced by this change.

## Consequences

- **Positive:** visitors can pay a deposit for a reservation without leaving the
  site; the panel disappears automatically on a clone with no config.
- **Negative:** reconciliation is still manual. Acceptable for the prototype;
  automated reconciliation requires the booking-engine decision from ADR-0003.
- **Dependency:** the `scripts/check-no-contact.sh` guard continues to run in CI
  and pre-commit; it must keep passing (it does — paybill and account number
  are supplied via the environment, and no `tel:`/`mailto:`/email literals exist).

## Open

- Should the customer-care phone be un-suppressed once the client confirms the
  final one? Likely yes; then re-open ADR-0001.
- Receipt capture + automatic reconciliation (depends on ADR-0003).
