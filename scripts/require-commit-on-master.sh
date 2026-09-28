#!/usr/bin/env bash
# Refuse to publish unless HEAD is already contained in master.
# Tag pushes check out the tag, so this must fetch origin/master first.
set -euo pipefail

REF="${MASTER_REF:-origin/master}"

if ! git rev-parse --verify --quiet "$REF" >/dev/null; then
  echo "::error::Missing ref ${REF}. Fetch master before this check."
  exit 1
fi

HEAD_SHA="$(git rev-parse HEAD)"
if git merge-base --is-ancestor HEAD "$REF"; then
  echo "Commit ${HEAD_SHA} is on ${REF}."
  exit 0
fi

echo "::error::Commit ${HEAD_SHA} is not on ${REF}. Merge the release pull request, then tag that merge commit. npm publish does not run from an open pull request."
exit 1
