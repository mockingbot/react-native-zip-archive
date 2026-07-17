# React Native Zip Archive [![npm](https://img.shields.io/npm/v/react-native-zip-archive.svg)](https://www.npmjs.com/package/react-native-zip-archive) [![React Native New Architecture](https://img.shields.io/badge/React%20Native-New%20Architecture%20(TurboModules)-61dafb)](https://reactnative.dev/docs/new-architecture-intro)

Zip archive utility for React Native.

> **v8.0** requires React Native ≥ 0.70 with New Architecture enabled. For older RN versions, use v7.x:
> ```bash
> npm install react-native-zip-archive@^7.0.0
> ```
> **iOS:** Version 7.0.0+ requires a deployment target of iOS 15.5+ to comply with App Store privacy policy.

## Requirements

| Platform | Minimum Version |
|----------|-----------------|
| React Native | >= 0.70.0 |
| React | >= 18.0.0 |
| iOS | >= 15.5 |
| Android | >= API 23 (Android 6.0) |

## Installation

```bash
npm install react-native-zip-archive
```

**iOS:**
```bash
cd ios && pod install
```

> To enable New Architecture, see [MIGRATION.md](./MIGRATION.md).

## Usage

```js
import {
  zip,
  zipWithPassword,
  unzip,
  unzipWithPassword,
  unzipAssets,
  subscribe,
  isPasswordProtected,
  getUncompressedSize,
  DEFAULT_COMPRESSION,
  NO_COMPRESSION,
  BEST_SPEED,
  BEST_COMPRESSION
} from 'react-native-zip-archive'
```

You may also want to use [react-native-fs](https://github.com/johanneslumpe/react-native-fs) to access the file system:

```js
import { DocumentDirectoryPath } from 'react-native-fs'
```

## API

### `zip(source: string | string[], target: string, compressionLevel?: number): Promise<string>`

Zip a folder (string) or an array of files to the target path.

- To zip a single file, pass it as an array: `zip([file], target)`.
- `compressionLevel` is ignored on iOS when the source is a file array. Use a directory source for custom compression on iOS.

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
- `compressionLevel` is ignored on iOS when the source is a file array.

**Encryption Types:**
- `'STANDARD'` — Standard ZIP encryption (default)
- `'AES-128'` — AES 128-bit
- `'AES-256'` — AES 256-bit

> **iOS:** Both AES-128 and AES-256 use AES-256 internally. AES encryption is **not supported** for file arrays on iOS — only `STANDARD` works.

```js
const sourcePath = DocumentDirectoryPath
const targetPath = `${DocumentDirectoryPath}/myFile.zip`

zipWithPassword(sourcePath, targetPath, 'password', 'STANDARD')
  .then((path) => console.log(`zip completed at ${path}`))
  .catch((error) => console.error(error))
```

### `unzip(source: string, target: string, charset?: string): Promise<string>`

Unzip from source to target.

> The `charset` parameter is only supported on Android (default: `UTF-8`). On iOS it is ignored.

```js
const sourcePath = `${DocumentDirectoryPath}/myFile.zip`
const targetPath = DocumentDirectoryPath

unzip(sourcePath, targetPath, 'UTF-8')
  .then((path) => console.log(`unzip completed at ${path}`))
  .catch((error) => console.error(error))
```

### `unzipWithPassword(source: string, target: string, password: string): Promise<string>`

Unzip a password-protected archive.

```js
unzipWithPassword(sourcePath, targetPath, 'password')
  .then((path) => console.log(`unzip completed at ${path}`))
  .catch((error) => console.error(error))
```

### `unzipAssets(assetPath: string, target: string): Promise<string>`

Unzip a file from the Android `assets` folder. **Android only.**

`assetPath` is the relative path inside the pre-bundled assets folder (e.g. `folder/myFile.zip`). Do not pass an absolute path.

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
| `zip` (folder) | ✅ | ✅ | — |
| `zip` (files array) | ✅ | ✅ | Compression level ignored on iOS |
| `zipWithPassword` (folder) | ✅ | ✅ | AES encryption supported |
| `zipWithPassword` (files array) | ⚠️ | ✅ | iOS: only `STANDARD` encryption |
| `unzip` | ✅ | ✅ | Charset ignored on iOS |
| `unzipWithPassword` | ✅ | ✅ | — |
| `unzipAssets` | ❌ | ✅ | Android only |
| `isPasswordProtected` | ✅ | ✅ | — |
| `getUncompressedSize` | ✅ | ✅ | Charset ignored on iOS |
| Progress Events | ✅ | ✅ | File path empty on iOS for zip |

### Cross-Platform Notes

- **Compression levels:** Android supports 0–9 for all operations. iOS supports them only for folder operations.
- **Encryption:** Android supports AES-128, AES-256, and Standard ZIP encryption for all operations. iOS supports AES and Standard for folders, but only Standard for file arrays.
- **Charset:** Android supports custom charsets (default UTF-8). iOS always uses UTF-8.
- **unzipAssets:** Supports `assets/` folder and `content://` URIs on Android. Not supported on iOS.

## Expo

This library **requires an Expo Development Build** and does not work in Expo Go because it includes custom native code. See [playground-expo](./playground-expo/) for a working Expo Development Build example.

## Playground

Two fully-featured playground apps are included to demonstrate every API method:

- **[playground-expo](./playground-expo/)** — Expo SDK 55 with Expo Router (New Architecture)
- **[playground-rn](./playground-rn/)** — Bare React Native 0.83.9 (New Architecture)

Both apps consume the local library via `file:..` and include Maestro E2E tests.

## Migrating from v7

See [MIGRATION.md](./MIGRATION.md) for detailed migration instructions.

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
