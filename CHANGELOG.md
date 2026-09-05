# Changelog

## [Unreleased]

### Fixed
- Android: register as a legacy Native Module when New Architecture is off (`isTurboModule` follows `BuildConfig.IS_NEW_ARCHITECTURE_ENABLED`) so `NativeModules.RNZipArchive` is non-null on old-arch apps (RNZA-5)

### Added
- CI: RN 0.81.6 old-architecture Android + iOS compile in `.github/workflows/old-arch.yml` (RNZA-5). RN 0.82+ cannot opt out of New Architecture.

### Changed
- README + MIGRATION: install table by RN version — v7 only for RN < 0.70; v9 on 0.70–0.81 including old architecture; New Architecture only on 0.82+

## [9.5.0] - 2026-09-04

### Added
- CI + npm publish gate: non-password zip fixtures must extract with Node `unzipper` and Java `ZipInputStream`; WinZip-AES extra field `0x9901` fails the job (#383, RNZA-16, #333 / #323 class)
- `AbortSignal` on `zip` / `zipWithPassword` / `unzip` / `unzipWithPassword` / `unzipAssets` via an options object (`{ signal, compressionLevel?, entries? }`) (#383)
- `ZipError` with a stable `.code` (`ERR_CANCELLED`, `ERR_INVALID_ARGS`, …) — implemented as a factory so Metro does not need `@babel/runtime` helpers when bundling the library (#383)
- `package.json` `"types": "index.d.ts"` so TypeScript and reactnative.directory `hasTypes` resolve (#383)

### Changed
- SECURITY.md: 7.x Zip Slip / symlink backport is **7.1.2** (`maintenance-7`), not 7.1.1 (#383)

## [9.4.1] - 2026-08-29

### Fixed
- iOS: full `unzip` / `unzipWithPassword` / `unzipAssets` now use the same minizip extract path as selective extract — rejects Zip Slip entries with `ERR_UNSAFE_PATH` and skips symlink entries instead of materializing them (#357 parity with Android)

## [9.4.0] - 2026-07-25

### Added
- iOS: `unzipAssets` reads archives from the main app bundle (parity with Android `assets/`) (#368)
- iOS: preserve empty directories when zipping directory items in a files array (#368)

### Changed
- iOS: non-UTF-8 `charset` arguments now reject with `ERR_UNSUPPORTED` instead of being silently ignored (#368)
- iOS: `getUncompressedSize` rejects on failure (previously resolved `-1`) for parity with Android

### Fixed
- iOS: `unzip` / `unzipAssets` emit 0% progress on failure (matches Android) instead of a 100% event before reject

## [9.3.0] - 2026-07-25

### Changed
- iOS: `zipWithPassword` with a files array now honors `encryptionType`. Omitting it (JS default, treated as `'STANDARD'`) writes ZipCrypto instead of the previous always-AES (WinZip-AES) default. ZipCrypto is weaker encryption than AES; pass `'AES-128'` or `'AES-256'` to keep AES. This matches Android's default and common server unzippers (#367).

### Fixed
- iOS: `zipFilesWithPassword` now honors `encryptionType` — `'STANDARD'` uses ZipCrypto instead of always writing WinZip-AES (improves server-side unzip with Node/Java tools) (#367, #333, #323)
- iOS: fsync zip output after successful `zip` / `zipWithPassword` so immediate uploads/reads see full bytes (#367)
- iOS: file-array `zip` / `zipWithPassword` now apply the requested compression level (previously always `Z_DEFAULT_COMPRESSION`)

### Added
- `scripts/validate-zip-header.js` — checks local-file and EOCD signatures for interoperability smoke tests
- README guidance for server-side unzip compatibility

## [9.2.0] - 2026-07-25

### Added
- `cancel()` — best-effort abort of the in-flight zip/unzip operation; rejects with `ERR_CANCELLED` (#366)
- Stable cross-platform error codes (`ERR_FILE_NOT_FOUND`, `ERR_WRONG_PASSWORD`, `ERR_UNSAFE_PATH`, …) and JS `ErrorCodes` map (#366)

### Fixed
- iOS: `cancel()` now interrupts in-flight work. Zip/unzip run on a background serial queue so `cancel()` is not blocked behind the operation it is meant to stop.
- Android: reset the cancel flag when enqueueing work, not when the worker starts — `cancel()` immediately after `unzip`/`zip` is no longer discarded.
- iOS: selective extract checks `fwrite` byte counts and `unzCloseCurrentFile` CRC; wrong-password / not-protected cases map to `ERR_WRONG_PASSWORD` / `ERR_NOT_PASSWORD_PROTECTED` instead of generic `ERR_UNZIP`.
- iOS: `listContents` uses 64-bit zip entry info (`unzGetCurrentFileInfo64`) so entries ≥ 4 GiB report correct sizes.
- iOS: selective extract emits 0% progress on failure (matches Android) instead of a 100% event before reject.
- Android: `unzipWithPassword` selective extract no longer forces UTF-8 charset, matching the full-extract path.

## [9.1.0] - 2026-07-25

### Added
- `listContents(source, charset?)` — inspect archive entries (path, sizes, directory/encrypted flags) without extracting (#365)
- Optional `entries` on `unzip` / `unzipWithPassword` — extract only selected entry paths; directory names include nested children (#365)
- Android unit tests for selective-extract entry matching

### Changed
- Android: `'STANDARD'` password encryption writes ZipCrypto (`ZIP_STANDARD`). zip4j's `ZIP_STANDARD_VARIANT_STRONG` is write-only and produced archives that common unzippers (including this library) could not extract.

## [9.0.2] - 2026-07-22

### Fixed
- Android: `unzip`/`unzipWithPassword` no longer extract symlink entries — zip4j's default `extractSymbolicLinks=true` allowed a crafted archive to plant a symlink resolving outside the destination directory (#357, thanks @kimdu0)
- iOS: `zip`/`zipWithPassword` with a files array now add directory items recursively with entry paths relative to the listed directory, matching Android (previously directories produced empty entries and their contents were silently dropped) (#339, thanks @trustytrojan)

## [9.0.1] - 2026-07-22

### Fixed
- Android: close the zip output file before resolving `zip`/`zipWithPassword` promises — fixes zipped data occasionally reading as 0 bytes when used immediately after `zip(...)` (#355, thanks @jamesthomp)

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
