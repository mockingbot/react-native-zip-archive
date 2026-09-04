# Migration Guide

## Upgrade from v7

The JavaScript API is unchanged from v7 through v9 — no call-site changes. You need a native rebuild.

1. Install the latest release:
   ```bash
   npm install react-native-zip-archive
   ```
   Expo: `npx expo install react-native-zip-archive`
2. iOS: `cd ios && pod install`
3. Android: rebuild the native app (a Metro reload is not enough).
4. Verify `zip` / `unzip` (and password variants if you use them).
5. Rollback if needed:
   ```bash
   npm install react-native-zip-archive@^7.0.0
   ```

Working examples: [playground-expo](./playground-expo/) and [playground-rn](./playground-rn/).

Stay on v7 only for React Native **< 0.70**. On 0.70+, New Architecture is recommended. If the native module fails to load on an old-architecture 0.70+ app, fall back to v7 until Interop is confirmed.

## v9.5

Additive JavaScript APIs. Existing positional `zip` / `unzip` calls are unchanged.

- **`AbortSignal`:** pass `{ signal }` as the last argument to `zip` / `zipWithPassword` / `unzip` / `unzipWithPassword` / `unzipAssets` to cancel. Rejects with `ZipError` code `ERR_CANCELLED`.
- **`ZipError`:** factory (not an ES `class`) with a stable `.code`. Check `error.code`; do not use `instanceof ZipError`.
- **TypeScript:** `package.json` `"types"` points at `index.d.ts`.

```bash
npm install react-native-zip-archive@^9.5.0
cd ios && pod install && cd ..
```

## v9.2 / v9.3 / v9.4

These releases add APIs and align iOS with Android. Most JavaScript call sites keep working; the notes below are the native/default changes that existing apps may observe.

### iOS file-array `zipWithPassword` default is ZipCrypto (9.3.0)

On iOS, `zipWithPassword([files], target, password)` used to always write **WinZip-AES**, even when `encryptionType` was omitted. It now follows `encryptionType` the same way folders and Android do:

| Call | Before 9.3 (iOS file array) | 9.3+ |
|---|---|---|
| `zipWithPassword(files, dest, password)` | WinZip-AES | ZipCrypto (`STANDARD`) |
| `zipWithPassword(files, dest, password, 'STANDARD')` | WinZip-AES | ZipCrypto |
| `zipWithPassword(files, dest, password, 'AES-256')` | WinZip-AES | WinZip-AES |

ZipCrypto is **weaker encryption** than AES. It is the default so Node `unzipper`, Java `ZipInputStream`, and stock `unzip` can open the archive. Pass `'AES-128'` or `'AES-256'` if you need AES.

Existing AES archives are unchanged; only newly created file-array zips on iOS pick up the new default.

### Other 9.2–9.4 notes

- **9.2:** `cancel()` and stable `ErrorCodes` (`ERR_CANCELLED`, `ERR_WRONG_PASSWORD`, …). iOS zip/unzip run on a background serial queue so `cancel()` is not blocked behind in-flight work (FIFO, same as Android’s single-thread executor).
- **9.2:** Android `'STANDARD'` encryption is ZipCrypto (`ZIP_STANDARD`), not PKWARE Strong Encryption.
- **9.3:** File-array `zip` / `zipWithPassword` apply `compressionLevel` on iOS (previously always `Z_DEFAULT_COMPRESSION`).
- **9.4:** iOS `unzipAssets` reads from the app bundle; non-UTF-8 `charset` rejects with `ERR_UNSUPPORTED`; `getUncompressedSize` rejects on failure instead of resolving `-1`.
- **9.4:** Empty directories are preserved on iOS when zipping directory items in a files array (already true on Android).

```bash
npm install react-native-zip-archive@^9.4.0
cd ios && pod install && cd ..
```

## v8.x to v9.0

### What's Changed

v9.0 hardens the native implementations and aligns progress reporting across platforms. The **JavaScript API is unchanged** — all breaking changes are in native behavior that existing code may observe.

### Breaking Changes

| | v8.x | v9.0 |
|---|---|---|
| `unzip` progress (Android) | Byte-level, within-file granularity | Byte-weighted, per-entry granularity |
| `unzip` progress (iOS) | Effectively start/end events only | Byte-weighted, per-entry granularity |
| `unzip` event `filePath` (iOS) | Full destination path | Zip entry name (e.g. `folder/file.txt`) |
| `zip` progress with files array (iOS) | Only 0% and 100% events | Per-file progress events |
| Concurrent operations (Android) | Ran in parallel (one thread per call) | **Serialized FIFO** on a single-thread executor — concurrent zip/unzip calls queue; they do **not** run in parallel |
| Malicious/traversal zip entries (Android) | Extracted outside destination | Rejected (Zip Slip protection) |

### Migration Steps

#### Step 1: Check your progress-event handling

If you subscribe to `zipArchiveProgressEvent`:

- **Don't parse `filePath` on iOS** expecting a filesystem path for `unzip` operations — it is now the archive entry name. On Android it remains the source zip path.
- **Don't assume the final 100% event arrives before the promise resolves.** On Android, events are now posted to the main thread and the last event may land after `.then()` runs. Gate completion logic on the promise, not the event.
- Progress is byte-weighted per entry for `unzip`: with archives containing one very large file, expect the bar to jump rather than advance smoothly within that file.

#### Step 2: Check concurrent usage

If you kick off multiple zip/unzip operations simultaneously, they execute **one at a time in call order** (FIFO). They do not run in parallel.

- **Android:** a single-thread executor (`Executors.newSingleThreadExecutor`). Later calls wait until earlier ones finish.
- **iOS:** a background serial work queue (same FIFO behavior; this is what lets `cancel()` run).

Await operations sequentially, or expect later calls to take longer because they are queued.

#### Step 3: Rebuild

```bash
npm install react-native-zip-archive@^9.0.0
cd ios && pod install && cd ..
```

### Need Help?

- Check the playground apps (`playground-rn/`, `playground-expo/`) for working examples
- Open an issue on GitHub

## v7.x to v8.0

### What's Changed

v8.0 migrates `react-native-zip-archive` from Legacy Native Modules to **TurboModules**. This brings:
- Better performance through lazy loading
- Type safety via Codegen
- Support for React 18 concurrent features

### Breaking Changes

| | v7.x | v8.0 |
|---|---|---|
| React Native | >= 0.60.0 | >= 0.70.0 |
| React | >= 16.8.6 | >= 18.0.0 |
| Android API | >= 21 | >= 23 |
| Architecture | Legacy Native Modules | TurboModules (New Architecture recommended) |

**JavaScript API is unchanged.** No JavaScript call-site changes are required.

Use v8+/v9 on React Native >= 0.70. Stay on v7 only if you are on React Native **< 0.70**. New Architecture is recommended; old-architecture Interop on 0.70+ is not confirmed — if the native module fails to load, fall back to v7 or enable New Architecture (see Troubleshooting).

### Migration Steps

#### Step 1: Check Your React Native Version

```bash
npx react-native --version
```

If you're on React Native < 0.70, stay on v7.x of this library (or upgrade React Native to 0.70+ first).

#### Step 2: New Architecture (recommended)

Follow the [official React Native guide](https://reactnative.dev/docs/new-architecture-intro).

**Android**: In `android/gradle.properties`:
```properties
newArchEnabled=true
```

**iOS**: Reinstall pods with New Architecture enabled:
```bash
cd ios
RCT_NEW_ARCH_ENABLED=1 pod install
```

#### Step 3: Update the Library

```bash
npm install react-native-zip-archive@latest
```

#### Step 4: Clean and Rebuild

**iOS:**
```bash
cd ios
rm -rf Pods Podfile.lock build
pod install
cd ..
```

**Android:**
```bash
cd android
./gradlew clean
cd ..
npx react-native start --reset-cache
```

#### Step 5: Verify

Run your app and test zip/unzip operations.

### Rollback to v7.x

If you encounter issues:

```bash
npm install react-native-zip-archive@^7.0.0
```

### Troubleshooting

| Issue | Solution |
|-------|----------|
| "Native module not found" | Enable New Architecture first. On an old-architecture 0.70+ app, fall back to `^7.0.0` until Interop is confirmed. |
| Build fails on iOS | Delete `ios/Pods` and `ios/Podfile.lock`, then `pod install` |
| Build fails on Android | Run `./gradlew clean` and clear Metro cache |
| Works on Android but not iOS | Ensure you ran `RCT_NEW_ARCH_ENABLED=1 pod install` |
| Expo Go shows "Native module not found" | Use Expo Development Build instead |

### Need Help?

- Check [playground-expo](./playground-expo/) and [playground-rn](./playground-rn/) for working examples
- Open an issue on GitHub
