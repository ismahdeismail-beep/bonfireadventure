#!/usr/bin/env bash
# Guard for ADR-0001: Phase 1 exposes no contact surfaces.
#
# Run before every commit. Exits non-zero if any *contact value* is found in the
# tracked tree. Documentation under docs/ may legitimately *name* the mechanisms
# (`wa.me`, `mailto:`), so those words are only flagged outside docs/.
#
# Usage:  bash scripts/check-no-contact.sh
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$root"

fail=0

say() { printf '%s\n' "$*"; }

# --- Pass 1: outside docs/, flag contact *values* and value-bearing links ----
# (The mechanism names wa.me/mailto:/tel: are allowed in code; only links that
#  actually carry a number/address are flagged.)
mapfile -t p1 < <(grep -rInE \
  'wa\.me/[0-9]|mailto:[^"'"'"'< ]+@|tel:\+?[0-9]|[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}|\+254|(^|[^0-9])0[0-9]{2}[ .-]?[0-9]{3}[ .-]?[0-9]{3}([^0-9]|$)' \
  --include='*.md' --include='*.xml' --include='*.sh' --include='*.js' --include='*.ts' \
  --include='*.json' --include='*.html' --include='*.yml' --include='*.yaml' \
  . 2>/dev/null | grep -v '^\./docs/' | grep -v '^\./scripts/check-no-contact\.sh:' || true)
if ((${#p1[@]})); then
  say "FAIL: contact mechanisms/values found outside docs/:"
  printf '  %s\n' "${p1[@]}"
  fail=1
fi

# --- Pass 2: everywhere, flag concrete values only ---------------------------
mapfile -t p2 < <(grep -rInE \
  '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}|\+254|(^|[^0-9])0[0-9]{2}[ .-]?[0-9]{3}[ .-]?[0-9]{3}([^0-9]|$)|Brickell|Yala|Koinange|Biashara' \
  --include='*.md' --include='*.xml' . 2>/dev/null | grep -v '^\./scripts/check-no-contact\.sh:' || true)
if ((${#p2[@]})); then
  say "FAIL: concrete contact values found:"
  printf '  %s\n' "${p2[@]}"
  fail=1
fi

if ((fail)); then
  say ""
  say "See docs/decisions/0001-phase-1-hides-all-contact-surfaces.md"
  exit 1
fi

say "OK: no contact values committed (ADR-0001 satisfied)."
