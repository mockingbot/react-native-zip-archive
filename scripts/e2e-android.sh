#!/bin/bash
set -e

# Run Maestro E2E tests on Android
# Usage: ./scripts/e2e-android.sh [--rn] [flow-file ...]
# --rn: Run against playground-rn instead of playground-expo
# If no flow files are provided, runs all main flows.

APP="expo"
if [ "$1" = "--rn" ]; then
  APP="rn"
  shift
fi

if [ "$APP" = "rn" ]; then
  export APP_ID="com.rnziparchive.playground.rn"
else
  export APP_ID="com.rnziparchive.playground.expo"
fi

echo "🧪 Testing app: $APP (package: $APP_ID)"

FLOWS=("${@:-.maestro/flows/home.yaml .maestro/flows/zip-and-unzip.yaml .maestro/flows/password.yaml .maestro/flows/progress.yaml .maestro/flows/assets.yaml}")

for flow in ${FLOWS[@]}; do
  echo "▶️  Running $flow"
  maestro test --env APP_ID="$APP_ID" "$flow"
done

echo "✅ All Android E2E tests passed"
