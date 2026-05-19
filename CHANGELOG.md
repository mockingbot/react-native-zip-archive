# Changelog

## [8.0.1] - 2026-05-19

### Fixed
- iOS: replace `_methodQueue` ivar with static `dispatch_once` to fix build on RN 0.83+ with New Architecture (#347)

### Added
- `playground-rn`: bare React Native 0.83.9 test app with New Architecture
- `playground-expo`: Expo SDK 55.0.24 test app with New Architecture
- Maestro E2E flows now use `${APP_ID}` env var for cross-app reuse
- npm scripts: `test:e2e:expo:ios`, `test:e2e:expo:android`, `test:e2e:rn:ios`, `test:e2e:rn:android`

### Changed
- Export `EncryptionMethods` enum from JS entry point
- Playground apps read library version dynamically from `package.json`
- Removed debug-specific Maestro flows (`connect-metro`, `debug-zip`)

## [8.0.0] - 2026-05-16

### Added
- TurboModule support for React Native New Architecture
- TypeScript specification with Codegen integration
- Playground app with Expo Development Builds
- Jest test suite with TurboModule integration tests
- Maestro E2E test flow for Android Assets (`assets.yaml`)
- Playground `listFilesRecursive` utility for displaying nested extracted files

### Changed
- iOS implementation converted from RCTBridgeModule to TurboModule protocol
- Android implementation converted from ReactContextBaseJavaModule to NativeZipArchiveSpec
- JS entry point now uses TurboModuleRegistry with NativeModules fallback
- Minimum React Native version: 0.70.0
- Minimum React version: 18.0.0
- Minimum Android API: 23

### Fixed
- Android `unzipAssets` now handles compressed assets (fallback from `openFd()` to `InputStream.available()`)
- Android `processZip` null check for `f.listFiles()` to prevent NPE
- iOS `zipFolderWithPassword` encryption default consistency (empty string → standard ZipCrypto)
- iOS old-arch fallback with `#ifdef RCT_NEW_ARCH_ENABLED` guards
- Android `unzipWithPassword` resolves with `destDirectory` string instead of array
- Android missing `return` statements after `promise.reject()` in multiple methods
- Android `updateProgress(1,1)` moved outside loop in `processZip`
- README broken markdown image link

### Removed
- Legacy Native Module APIs (RCT_EXPORT_METHOD, @ReactMethod)
