#!/bin/bash
set -e

# Run Maestro E2E tests on iOS
# Usage: ./scripts/e2e-ios.sh [flow-file ...]
# If no flow files are provided, runs all main flows.
# Set MAESTRO_IOS_DEVICE env var to specify a simulator UDID.

if [ -n "$MAESTRO_IOS_DEVICE" ]; then
  UDID="$MAESTRO_IOS_DEVICE"
else
  UDID=$(xcrun simctl list devices booted | grep -oE '[0-9A-F]{8}-([0-9A-F]{4}-){3}[0-9A-F]{12}' | head -1)
fi

if [ -z "$UDID" ]; then
  echo "❌ No booted iOS simulator found. Please boot one with:"
  echo "   xcrun simctl boot <udid>"
  exit 1
fi

echo "📱 Using iOS simulator: $UDID"

FLOWS=("${@:-.maestro/flows/home.yaml .maestro/flows/zip-and-unzip.yaml .maestro/flows/password.yaml .maestro/flows/progress.yaml}")

for flow in ${FLOWS[@]}; do
  echo "▶️  Running $flow"
  maestro test --device="$UDID" "$flow"
done

echo "✅ All iOS E2E tests passed"
