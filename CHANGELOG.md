# Changelog

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
