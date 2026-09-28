#!/usr/bin/env bash
# Portable docs sync check (CI + pre-commit + local).
#
# Convention: https://agents.md/
#   README.md  — humans (install, API, examples)
#   AGENTS.md  — agents (canonical agent guide; AAIF / Linux Foundation)
#
# Checks:
#   1) Fact sync — shared product facts appear in both docs
#   2) Change pairing — doc-impacting code changes must update both docs
#
# Usage:
#   scripts/check-docs-sync.sh
#   scripts/check-docs-sync.sh --base origin/master
#   DOCS_SYNC_SKIP=1 scripts/check-docs-sync.sh
#
# Escape hatch in git history: include [docs-sync skip] in a commit message.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

BASE_REF=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --base)
      BASE_REF="${2:-}"
      shift 2
      ;;
    -h|--help)
      sed -n '2,22p' "$0"
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      exit 1
      ;;
  esac
done

if [[ "${DOCS_SYNC_SKIP:-}" == "1" ]]; then
  echo "docs-sync: skipped (DOCS_SYNC_SKIP=1)"
  exit 0
fi

FAILED=0
fail() {
  echo "docs-sync: ERROR: $*" >&2
  FAILED=1
}

[[ -f README.md ]] || fail "README.md missing"
[[ -f AGENTS.md ]] || fail "AGENTS.md missing"

PKG_VERSION="$(node -p "require('./package.json').version")"
RN_PEER="$(node -p "require('./package.json').peerDependencies['react-native']")"
REACT_PEER="$(node -p "require('./package.json').peerDependencies.react")"
RN_MIN="$(printf '%s' "$RN_PEER" | sed -E 's/^[^0-9]*([0-9]+\.[0-9]+).*/\1/')"
REACT_MIN="$(printf '%s' "$REACT_PEER" | sed -E 's/^[^0-9]*([0-9]+).*/\1/')"

require_in_both() {
  local label="$1"
  local pattern="$2"
  if ! grep -Eq "$pattern" README.md; then
    fail "README.md missing shared fact (${label}): /${pattern}/"
  fi
  if ! grep -Eq "$pattern" AGENTS.md; then
    fail "AGENTS.md missing shared fact (${label}): /${pattern}/"
  fi
}

# package.json is canonical for version numbers; docs must not invent peers.
require_in_both "point at package.json for current version" "package\\.json"
require_in_both "React Native minimum (${RN_MIN})" "${RN_MIN}"
require_in_both "React minimum (${REACT_MIN})" "${REACT_MIN}"
require_in_both "iOS 15.5 deployment target" "15\\.5"
require_in_both "Zip Slip / ERR_UNSAFE_PATH" "ERR_UNSAFE_PATH|Zip Slip"

if ! grep -Ei 'keep in sync' AGENTS.md >/dev/null; then
  fail "AGENTS.md needs a 'Keep in sync' section (see https://agents.md/)"
fi

if ! grep -Eq '\[AGENTS\.md\]' README.md; then
  fail "README.md should link to AGENTS.md"
fi

if ! grep -Eq 'README\.md' AGENTS.md; then
  fail "AGENTS.md should mention README.md (human docs)"
fi

# Optional: CLAUDE.md (and similar) should defer to AGENTS.md, not fork rules.
if [[ -f CLAUDE.md ]]; then
  if ! grep -Eq 'AGENTS\.md' CLAUDE.md; then
    fail "CLAUDE.md exists but does not reference AGENTS.md (keep one canonical agent guide)"
  fi
fi

resolve_base() {
  if [[ -n "$BASE_REF" ]]; then
    printf '%s' "$BASE_REF"
    return
  fi
  if [[ -n "${GITHUB_BASE_REF:-}" ]]; then
    printf 'origin/%s' "$GITHUB_BASE_REF"
    return
  fi
  if git rev-parse --verify --quiet origin/master >/dev/null; then
    printf 'origin/master'
    return
  fi
  if git rev-parse --verify --quiet master >/dev/null; then
    printf 'master'
    return
  fi
  printf ''
}

is_doc_impacting() {
  case "$1" in
    index.js|index.d.ts|app.plugin.js|package.json|RNZipArchive.podspec) return 0 ;;
    specs/*|android/src/*|ios/RNZipArchive.mm|ios/RNZipArchive.h) return 0 ;;
    *) return 1 ;;
  esac
}

BASE="$(resolve_base)"

if [[ -n "$BASE" ]] && git rev-parse --verify --quiet "$BASE" >/dev/null; then
  MERGE_BASE="$(git merge-base "$BASE" HEAD 2>/dev/null || true)"
  if [[ -n "$MERGE_BASE" ]]; then
    RANGE="${MERGE_BASE}..HEAD"
  else
    RANGE="${BASE}...HEAD"
  fi

  CHANGED="$(git diff --name-only "$RANGE" 2>/dev/null || true)"

  impacting=0
  readme_changed=0
  agents_changed=0
  while IFS= read -r f; do
    [[ -z "$f" ]] && continue
    if is_doc_impacting "$f"; then
      impacting=1
    fi
    [[ "$f" == "README.md" ]] && readme_changed=1
    [[ "$f" == "AGENTS.md" ]] && agents_changed=1
  done <<< "$CHANGED"

  if git log --format=%B "$RANGE" 2>/dev/null | grep -Eq '\[docs-sync skip\]'; then
    echo "docs-sync: change pairing skipped ([docs-sync skip] in commit range)"
    impacting=0
  fi

  if [[ "$impacting" -eq 1 ]]; then
    if [[ "$readme_changed" -ne 1 || "$agents_changed" -ne 1 ]]; then
      fail "doc-impacting code changed vs ${BASE}, but both README.md and AGENTS.md were not updated (${RANGE})"
      echo "docs-sync: update both (README = humans, AGENTS.md = agents), or commit with [docs-sync skip]." >&2
      echo "docs-sync: files in range:" >&2
      printf '%s\n' "$CHANGED" | sed 's/^/  /' >&2
    else
      echo "docs-sync: change pairing ok (code + README.md + AGENTS.md vs ${BASE})"
    fi
  else
    echo "docs-sync: no doc-impacting code changes vs ${BASE} (or pairing skipped)"
  fi
else
  echo "docs-sync: skipping change pairing (no git base ref)"
fi

if [[ "$FAILED" -ne 0 ]]; then
  echo "docs-sync: failed — keep README.md (humans) and AGENTS.md (agents) aligned." >&2
  exit 1
fi

echo "docs-sync: ok (package ${PKG_VERSION}, peers RN ${RN_PEER}, React ${REACT_PEER})"
exit 0
