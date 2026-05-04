# End-to-End Testing

This directory contains end-to-end (E2E) tests for the `react-native-zip-archive` playground app.

## Test Framework: Maestro

We use [Maestro](https://maestro.mobile.dev/) for E2E testing because it:
- Requires minimal native setup
- Works with both iOS and Android
- Uses simple YAML-based test flows
- Handles React Native apps reliably

## Installation

```bash
# macOS
curl -fsSL "https://get.maestro.mobile.dev" | bash

# Or via Homebrew
brew install maestro
```

For other platforms, see the [Maestro installation guide](https://maestro.mobile.dev/getting-started/installing-maestro).

## Running Tests

### iOS Simulator

1. Build the iOS app:
   ```bash
   cd playground/ios
   xcodebuild -workspace RNZipArchivePlayground.xcworkspace \
     -scheme RNZipArchivePlayground \
     -configuration Debug \
     -sdk iphonesimulator \
     -derivedDataPath build
   ```

2. Install and launch the app on a simulator, then run Maestro:
   ```bash
   maestro test .maestro/flows/
   ```

### Android Emulator

1. Build the Android app:
   ```bash
   cd playground/android
   ./gradlew :app:assembleDebug
   ```

2. Install the APK and run Maestro:
   ```bash
   adb install app/build/outputs/apk/debug/app-debug.apk
   maestro test .maestro/flows/
   ```

## Test Flows

| Flow | Description |
|------|-------------|
| `home.yaml` | Verifies the home screen loads with all demo cards |
| `zip-and-unzip.yaml` | Tests zipping a sample folder and unzipping it |
| `password.yaml` | Tests creating a password-protected zip and extracting it |
| `progress.yaml` | Tests subscribing to progress events during a large zip operation |

## Writing New Flows

Maestro flows are YAML files that describe user interactions. See the [Maestro documentation](https://maestro.mobile.dev/api-reference/commands) for available commands.

Example:
```yaml
appId: com.example.rnziparchive.playground
---
- launchApp
- tapOn: "Zip Operations"
- tapOn: "Zip Sample Folder"
- assertVisible: "Success"
```

## CI/CD Integration

Maestro can be integrated into GitHub Actions using the [Maestro Cloud](https://cloud.mobile.dev/) or by running the CLI directly on a macOS runner with simulators/emulators.
