# Changelog

## [8.0.0] - 2024-XX-XX

### Added
- TurboModule support for React Native New Architecture
- TypeScript specification with Codegen integration
- Playground app with Expo Development Builds
- Jest test suite with TurboModule integration tests

### Changed
- iOS implementation converted from RCTBridgeModule to TurboModule protocol
- Android implementation converted from ReactContextBaseJavaModule to NativeZipArchiveSpec
- JS entry point now uses TurboModuleRegistry with NativeModules fallback
- Minimum React Native version: 0.70.0
- Minimum React version: 18.0.0
- Minimum Android API: 23

### Removed
- Legacy Native Module APIs (RCT_EXPORT_METHOD, @ReactMethod)
