#!/bin/bash
set -e

# Run Maestro E2E tests on Android
# Usage: ./scripts/e2e-android.sh [flow-file ...]
# If no flow files are provided, runs all main flows.

FLOWS=("${@:-.maestro/flows/home.yaml .maestro/flows/zip-and-unzip.yaml .maestro/flows/password.yaml .maestro/flows/progress.yaml}")

for flow in ${FLOWS[@]}; do
  echo "▶️  Running $flow"
  maestro test "$flow"
done

echo "✅ All Android E2E tests passed"
