#!/usr/bin/env bash
# Guard for ADR-0001: Phase 1 exposes no contact surfaces.
#
# Run before every commit. Exits non-zero if any *contact value* is found in the
# files that would actually be committed. Documentation under docs/ may
# legitimately *name* the mechanisms (`wa.me`, `mailto:`), so those words are
# only flagged outside docs/.
#
# Scope note: this scans git's own file list — tracked files plus untracked
# files that are *not* gitignored. Generated runtime state such as
# `app/data/db.json` is gitignored, so it can hold live session data (long
# random hex) without tripping the phone-number heuristic below. New source
# files are still covered, because they are untracked-but-not-ignored.
#
# Usage:  bash scripts/check-no-contact.sh
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$root"

fail=0
say() { printf '%s\n' "$*"; }

# --- Build the candidate list: what a commit would actually contain ----------
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  mapfile -t candidates < <(git ls-files --cached --others --exclude-standard)
else
  # Not a repo: fall back to the working tree, minus known-generated paths.
  mapfile -t candidates < <(find . -type f \
    -not -path './.git/*' -not -path './node_modules/*' -not -path './app/data/*' \
    | sed 's|^\./||')
fi

# Keep only the file types this guard reasons about.
mapfile -t files < <(printf '%s\n' "${candidates[@]:-}" \
  | grep -E '\.(md|xml|sh|js|ts|json|html|yml|yaml)$' || true)

if ((${#files[@]} == 0)); then
  say "OK: no contact values committed (ADR-0001 satisfied)."
  exit 0
fi

VALUE_RE='wa\.me/[0-9]|mailto:[^"'"'"'< ]+@|tel:\+?[0-9]|[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}|\+254|(^|[^0-9])0[0-9]{2}[ .-]?[0-9]{3}[ .-]?[0-9]{3}([^0-9]|$)'

# --- Pass 1: outside docs/, flag contact *values* and value-bearing links ----
mapfile -t p1 < <(grep -InE "$VALUE_RE" -- "${files[@]}" 2>/dev/null \
  | grep -v '^docs/' | grep -v '^scripts/check-no-contact\.sh:' || true)
if ((${#p1[@]})); then
  say "FAIL: contact mechanisms/values found outside docs/:"
  printf '  %s\n' "${p1[@]}"
  fail=1
fi

# --- Pass 2: anywhere, flag concrete values only -----------------------------
mapfile -t docs_files < <(printf '%s\n' "${files[@]}" | grep -E '\.(md|xml)$' || true)
if ((${#docs_files[@]})); then
  mapfile -t p2 < <(grep -InE \
    '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}|\+254|(^|[^0-9])0[0-9]{2}[ .-]?[0-9]{3}[ .-]?[0-9]{3}([^0-9]|$)|Brickell|Yala|Koinange|Biashara' \
    -- "${docs_files[@]}" 2>/dev/null | grep -v '^scripts/check-no-contact\.sh:' || true)
  if ((${#p2[@]})); then
    say "FAIL: concrete contact values found:"
    printf '  %s\n' "${p2[@]}"
    fail=1
  fi
fi

if ((fail)); then
  say ""
  say "See docs/decisions/0001-phase-1-hides-all-contact-surfaces.md"
  exit 1
fi

say "OK: no contact values committed (ADR-0001 satisfied)."
