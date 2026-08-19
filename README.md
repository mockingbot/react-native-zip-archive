# React Native Zip Archive [![npm](https://img.shields.io/npm/v/react-native-zip-archive.svg)](https://www.npmjs.com/package/react-native-zip-archive) [![React Native New Architecture](https://img.shields.io/badge/React%20Native-New%20Architecture%20(TurboModules)-61dafb)](https://reactnative.dev/docs/new-architecture-intro)

Zip archive utility for React Native.

> Latest **v8+ / v9** targets React Native ≥ 0.70 with TurboModules. **New Architecture is recommended.**
>
> Use `^7.0.0` only if you are on React Native **< 0.70**:
> ```bash
> npm install react-native-zip-archive@^7.0.0
> ```
> If the native module fails to load on an old-architecture 0.70+ app, fall back to v7 until Interop Layer support is confirmed.
>
> **iOS:** Version 7.0.0+ requires a deployment target of iOS 15.5+ to comply with App Store privacy policy.

## Requirements

| Platform | Minimum Version |
|----------|-----------------|
| React Native | >= 0.70.0 |
| React | >= 18.0.0 |
| iOS | >= 15.5 |
| Android | >= API 23 (Android 6.0) |

## Comparison

| | This library | JSZip in React Native | Nitro (`react-native-nitro-unzip` / `react-native-nitro-archive`) |
|---|---|---|---|
| Zip / unzip | Native iOS + Android | Pure JS (not a native unzip) | Native via Nitro |
| Password-protected zip | Yes | Fine for small in-memory archives | Check those packages |
| Expo | Development builds / EAS (not Expo Go) | Can run in Expo Go | Native — needs a development build |
| Extra native dependency | None beyond this package | None | `react-native-nitro-modules` |
| Large files | Native I/O | Memory-heavy | Speed / extra-format claims |
| Install base | Production RN apps | Very widely used as JS | Much smaller today |

Use this library for native zip/unzip on device. Use JSZip when you only need small archives in JS. Nitro may fit if you want additional archive formats and accept the extra Nitro dependency and smaller install base.

## Installation

### React Native (bare)

```bash
npm install react-native-zip-archive
```

**iOS:**
```bash
cd ios && pod install
```

New Architecture is recommended. See [MIGRATION.md](./MIGRATION.md).

### Expo

Works in **Expo development builds / EAS**. Does **not** work in Expo Go (this package includes custom native code).

```bash
npx expo install react-native-zip-archive
```

Add the config plugin in `app.json`:

```json
{
  "expo": {
    "plugins": ["react-native-zip-archive"]
  }
}
```

See [playground-expo](./playground-expo/) for a working Expo Development Build example.

## Usage

```js
import {
  zip,
  zipWithPassword,
  unzip,
  unzipWithPassword,
  listContents,
  unzipAssets,
  cancel,
  subscribe,
  isPasswordProtected,
  getUncompressedSize,
  ErrorCodes,
  DEFAULT_COMPRESSION,
  NO_COMPRESSION,
  BEST_SPEED,
  BEST_COMPRESSION
} from 'react-native-zip-archive'
```

**Bare React Native** — [react-native-fs](https://github.com/johanneslumpe/react-native-fs):

```js
import { DocumentDirectoryPath } from 'react-native-fs'
```

**Expo** — [playground-expo](./playground-expo/) uses `expo-file-system/legacy`:

```js
import * as FileSystem from 'expo-file-system/legacy'

const DocumentDirectoryPath = FileSystem.documentDirectory
```

## API

### `zip(source: string | string[], target: string, compressionLevel?: number): Promise<string>`

Zip a folder (string) or an array of files to the target path.

- To zip a single file, pass it as an array: `zip([file], target)`.
- Array items may also be directories: their contents are added recursively with entry paths relative to the listed directory (the directory's own name is not included). This behaves the same on Android and iOS. Empty directories are preserved on both platforms.
- `compressionLevel` applies on both platforms for folder and file-array sources.

**Compression Level Constants:**
- `DEFAULT_COMPRESSION` (-1)
- `NO_COMPRESSION` (0)
- `BEST_SPEED` (1)
- `BEST_COMPRESSION` (9)

```js
const sourcePath = DocumentDirectoryPath
const targetPath = `${DocumentDirectoryPath}/myFile.zip`

zip(sourcePath, targetPath)
  .then((path) => console.log(`zip completed at ${path}`))
  .catch((error) => console.error(error))
```

### `zipWithPassword(source: string | string[], target: string, password: string, encryptionType?: string, compressionLevel?: number): Promise<string>`

Zip with password protection.

- To zip a single file, pass it as an array: `zipWithPassword([file], target, password)`.
- Array items may also be directories: their contents are added recursively with entry paths relative to the listed directory (the directory's own name is not included). This behaves the same on Android and iOS. Empty directories are preserved on both platforms.
- `compressionLevel` applies on both platforms for folder and file-array sources.

**Encryption Types:**
- `'STANDARD'` — Traditional ZIP encryption / ZipCrypto (default). This is **not** PKWARE Strong Encryption. On Android this writes zip4j `ZIP_STANDARD` so iOS and common unzip tools can decrypt the archive.
- `'AES-128'` — AES 128-bit
- `'AES-256'` — AES 256-bit

> **iOS:** Both AES-128 and AES-256 use AES-256 internally. File arrays honor `encryptionType` the same as folders. The default is ZipCrypto (`'STANDARD'`), including when the 4th argument is omitted — file arrays previously always wrote WinZip-AES. Pass `'AES-128'` or `'AES-256'` if you need AES. Prefer `'STANDARD'` when the archive will be unzipped by Node, Java, or other non-WinZip tools.

```js
const sourcePath = DocumentDirectoryPath
const targetPath = `${DocumentDirectoryPath}/myFile.zip`

zipWithPassword(sourcePath, targetPath, 'password', 'STANDARD')
  .then((path) => console.log(`zip completed at ${path}`))
  .catch((error) => console.error(error))
```

### `unzip(source: string, target: string, charset?: string | string[], entries?: string[]): Promise<string>`

Unzip from source to target. Pass `entries` to extract only those paths; directory names match that entry and all nested children (e.g. `'docs'` extracts `docs/` and `docs/readme.md`).

You can pass entries as the third argument when using the default charset:

```js
unzip(sourcePath, targetPath, ['readme.md', 'docs'])
```

Or with an explicit charset:

```js
unzip(sourcePath, targetPath, 'UTF-8', ['readme.md', 'docs'])
```

> The `charset` parameter defaults to `UTF-8`. On Android, other charsets are supported. On iOS, non-UTF-8 values reject with `ERR_UNSUPPORTED`.

```js
const sourcePath = `${DocumentDirectoryPath}/myFile.zip`
const targetPath = DocumentDirectoryPath

unzip(sourcePath, targetPath, 'UTF-8')
  .then((path) => console.log(`unzip completed at ${path}`))
  .catch((error) => console.error(error))
```

### `unzipWithPassword(source: string, target: string, password: string, entries?: string[]): Promise<string>`

Unzip a password-protected archive. Pass `entries` to extract only those paths.

```js
unzipWithPassword(sourcePath, targetPath, 'password')
  .then((path) => console.log(`unzip completed at ${path}`))
  .catch((error) => console.error(error))

unzipWithPassword(sourcePath, targetPath, 'password', ['secret.txt'])
  .then((path) => console.log(`selective unzip completed at ${path}`))
  .catch((error) => console.error(error))
```

### `listContents(source: string, charset?: string): Promise<ZipEntry[]>`

List archive entries without extracting.

```ts
type ZipEntry = {
  path: string
  size: number           // uncompressed size in bytes
  compressedSize: number
  isDirectory: boolean
  isEncrypted: boolean
}
```

> The `charset` parameter defaults to `UTF-8`. On Android, other charsets are supported. On iOS, non-UTF-8 values reject with `ERR_UNSUPPORTED`.

```js
listContents(sourcePath)
  .then((entries) => {
    entries.forEach((entry) => {
      console.log(entry.path, entry.size, entry.isDirectory)
    })
  })
  .catch((error) => console.error(error))
```

### `unzipAssets(assetPath: string, target: string): Promise<string>`

Unzip a bundled archive.

- **Android:** relative path inside the APK `assets/` folder (also accepts `content://` URIs).
- **iOS:** relative path inside the main app bundle (e.g. a file copied with Xcode “Copy Bundle Resources”).

Do not pass an absolute filesystem path.

```js
unzipAssets('./myFile.zip', DocumentDirectoryPath)
  .then((path) => console.log(`unzip completed at ${path}`))
  .catch((error) => console.error(error))
```

### `getUncompressedSize(source: string, charset?: string): Promise<number>`

Returns the total uncompressed size of all files in the zip archive (in bytes).

> The `charset` parameter is only supported on Android. On iOS it is ignored.

```js
getUncompressedSize(sourcePath)
  .then((size) => console.log(`Uncompressed size: ${size} bytes`))
  .catch((error) => console.error(error))
```

### `cancel(): Promise<void>`

Cancel the in-flight zip/unzip operation (best-effort). The active operation's promise rejects with `ErrorCodes.CANCELLED` (`ERR_CANCELLED`).

Zip/unzip work is serialized. Android runs operations on a **single-thread executor**; concurrent calls queue FIFO and do not run in parallel. iOS uses a background serial queue similarly, so `cancel()` is not blocked behind the operation it is meant to stop.

```js
const unzipPromise = unzip(sourcePath, targetPath)
cancel()
unzipPromise.catch((error) => {
  if (error.code === ErrorCodes.CANCELLED) {
    console.log('unzip cancelled')
  }
})
```

### Error codes

Native rejections use stable `error.code` values on both platforms:

| Code | When |
|------|------|
| `ERR_FILE_NOT_FOUND` | Source missing |
| `ERR_INVALID_PATH` | Bad / null path |
| `ERR_INVALID_ARGS` | Empty password, empty entries, etc. |
| `ERR_WRONG_PASSWORD` | Password decrypt failed |
| `ERR_NOT_PASSWORD_PROTECTED` | Password API used on a plain archive |
| `ERR_CORRUPT_ARCHIVE` | Not a zip / truncated / unreadable |
| `ERR_UNSAFE_PATH` | Zip Slip / path traversal |
| `ERR_CANCELLED` | `cancel()` interrupted the operation |
| `ERR_ZIP` / `ERR_UNZIP` | Generic zip/unzip failure |
| `ERR_UNSUPPORTED` | API not available on this platform |

Also exported as the `ErrorCodes` constant map.

### `subscribe(callback: ({ progress: number, filePath: string }) => void): EmitterSubscription`

Subscribe to progress events. Useful for showing a progress bar.

- `progress` — value from 0 to 1 (1 = completed)
- `filePath` — the zip file path (on iOS, the entry being processed for unzip operations; empty for zip operations)

Progress is reported monotonically from 0 to 1, with explicit 0% and 100% events at the start and end of each operation. The granularity depends on the operation:

- `unzip` / `unzipWithPassword` — byte-weighted: progress reflects uncompressed bytes extracted so far, updated after each entry completes.
- `zip` / `zipWithPassword` — per-file: progress reflects the number of files compressed so far.
- `unzipAssets` (Android only) — approximate: compares bytes read to the compressed archive size.

> The event is global — check `filePath` in your callback to ensure it matches the operation you care about. Remember to call `.remove()` on the returned subscription when done.

```js
import { useEffect } from 'react'

useEffect(() => {
  const sub = subscribe(({ progress, filePath }) => {
    console.log(`progress: ${progress}, file: ${filePath}`)
  })
  return () => sub.remove()
}, [])
```

## Platform Support

| Feature | iOS | Android | Notes |
|---------|-----|---------|-------|
| `zip` (folder) | ✅ | ✅ | `compressionLevel` 0–9 |
| `zip` (files array) | ✅ | ✅ | `compressionLevel` applies on both platforms |
| `zipWithPassword` (folder) | ✅ | ✅ | Prefer `STANDARD` for server unzip |
| `zipWithPassword` (files array) | ✅ | ✅ | iOS honors `STANDARD` vs AES; `compressionLevel` applies |
| `unzip` | ✅ | ✅ | Optional `entries`; non-UTF-8 charset → `ERR_UNSUPPORTED` on iOS |
| `unzipWithPassword` | ✅ | ✅ | Optional `entries` for selective extract |
| `listContents` | ✅ | ✅ | Non-UTF-8 charset → `ERR_UNSUPPORTED` on iOS |
| `unzipAssets` | ✅ | ✅ | Android `assets/` (+ `content://`); iOS main bundle |
| `cancel` | ✅ | ✅ | Best-effort mid-operation abort |
| `isPasswordProtected` | ✅ | ✅ | — |
| `getUncompressedSize` | ✅ | ✅ | Non-UTF-8 charset → `ERR_UNSUPPORTED` on iOS |
| Progress Events | ✅ | ✅ | File path empty on iOS for zip |

### Cross-Platform Notes

- **Compression levels:** Android and iOS apply `compressionLevel` (0–9) for folder and file-array `zip` / `zipWithPassword`.
- **Encryption:** Android supports AES-128, AES-256, and Standard ZIP encryption for all operations. On iOS, pass `'STANDARD'` (default) for ZipCrypto archives that Node `unzipper` / Java `ZipInputStream` can read; `'AES-128'` / `'AES-256'` produce WinZip-AES archives that many server tools cannot open.
- **Charset:** Android supports custom charsets (default UTF-8). iOS accepts only UTF-8; other values reject with `ERR_UNSUPPORTED`.
- **unzipAssets:** Android reads `assets/` (and `content://`). iOS reads from the main app bundle using the same relative path.
- **Empty directories:** Preserved when zipping directory contents via a files/folders array on both platforms.
- **Concurrent operations:** Android zip/unzip run on a single-thread executor; concurrent calls queue FIFO and do not run in parallel. iOS uses a background serial queue similarly (so `cancel()` is not blocked behind in-flight work).

### Server-side unzip interoperability

Plain (non-AES) zips created on iOS and Android are intended to open with common server unzippers (`unzip`, Node `unzipper`, Java `ZipInputStream`). Practical tips:

- Prefer `zip(...)` or `zipWithPassword(..., 'STANDARD')` when the archive will be extracted off-device.
- Avoid AES password zips if the consumer is stock Java/`unzipper` — use `'STANDARD'` instead.
- Decode URL-encoded paths (`decodeURIComponent`) before passing them in; `%20` in paths has been mistaken for corrupt archives (#333).
- After upgrading, you can sanity-check a produced file with:

```bash
node scripts/validate-zip-header.js /path/to/archive.zip
```

## Expo

Works in Expo development builds / EAS only — not Expo Go. Install and plugin setup are under [Installation](#installation). See [playground-expo](./playground-expo/) for a working example.

## Playground

Two fully-featured playground apps are included to demonstrate every API method:

- **[playground-expo](./playground-expo/)** — Expo SDK 55 with Expo Router (New Architecture)
- **[playground-rn](./playground-rn/)** — Bare React Native 0.83.9 (New Architecture)

Both apps consume the local library via `file:..` and include Maestro E2E tests.

## Migrating

Coming from v7? Start with [Upgrade from v7](./MIGRATION.md#upgrade-from-v7). See [MIGRATION.md](./MIGRATION.md) for v7 → v8, v8 → v9.0, and v9.2–v9.4 notes.

## Security

See [SECURITY.md](./SECURITY.md) for supported versions and how to report vulnerabilities.

## Testing

```bash
npm test
```

## Contributing

See the [playground apps](#playground) for testing and contribution reference.

## Related Projects

- [ZipArchive](https://github.com/ZipArchive/ZipArchive)
- [zip4j](https://github.com/srikanth-lingala/zip4j)

---

[!["Buy Me A Coffee"](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://www.buymeacoffee.com/plrthink)
