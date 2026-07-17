# Changelog

## [9.0.0] - 2026-07-17

### Changed (Breaking)
- Progress events are now byte-weighted per entry for `unzip`/`unzipWithPassword` on both platforms (previously byte-level with within-file granularity on Android, effectively start/end-only on iOS)
- iOS `unzip` progress events now report the zip entry name in `filePath` instead of the full destination path
- iOS `zip`/`zipWithPassword` with a files array now emits per-file progress events (previously only 0% and 100%)
- Android operations are serialized on a managed single-thread executor instead of one raw thread per call
- Android progress events are posted on the main thread; the final 100% event may now arrive after the promise resolves
- See [MIGRATION.md](./MIGRATION.md) for upgrade guidance

### Added
- Android: Zip Slip protection — entries escaping the destination directory are rejected during extraction (`unzip`, `unzipWithPassword`, `unzipAssets`)
- Android: `ZipSecurity` utility with JUnit regression tests
- CI: Android/iOS build workflows for both playground apps; Expo added to the E2E matrix

### Fixed
- Android: close all zip/stream handles via try-with-resources (previously leaked on error paths)
- Android: emit progress events on the main thread and flush output streams in `StreamUtil.copy`
- Android: `minSdkVersion` fallback now matches the documented API 23 minimum
- TypeScript: fix invalid default-parameter syntax in `index.d.ts`; move the `react-native` import to the top level
- iOS: nullability annotations in `RNZipArchive.h`
- iOS: per-entry `filePath` updates during unzip (previously dispatched a stale progress value)
- playground-rn: pin `react-native`, `react-native-screens`, `react-native-gesture-handler`, `react-native-safe-area-context` to match playground-expo (fixes CI codegen failure from floating `react-native-screens` 4.26.x)

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
