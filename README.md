# React Native Zip Archive

[![npm](https://img.shields.io/npm/v/react-native-zip-archive.svg)](https://www.npmjs.com/package/react-native-zip-archive)
[![npm downloads](https://img.shields.io/npm/dw/react-native-zip-archive.svg)](https://www.npmjs.com/package/react-native-zip-archive)
[![TypeScript](https://img.shields.io/badge/TypeScript-types-3178C6?logo=typescript&logoColor=white)](./index.d.ts)
[![React Native New Architecture](https://img.shields.io/badge/React%20Native-New%20Architecture%20(TurboModules)-61dafb)](https://reactnative.dev/docs/new-architecture-intro)

Native zip and unzip for React Native and Expo (iOS & Android). Password protection, progress events, selective extract, and `AbortSignal` cancellation.

## Which version?

| React Native | Install |
|--------------|---------|
| **&lt; 0.70** | `npm install react-native-zip-archive@^7.0.0` |
| **0.70–0.81** | Latest **v9** (old architecture works; rebuild native) |
| **0.82+** | Latest **v9** (New Architecture only) |

**iOS:** v7+ requires deployment target **iOS 15.5+**.

New Architecture is recommended. See [MIGRATION.md](./MIGRATION.md) for upgrades from v7.

## Requirements

| | Minimum |
|--|---------|
| React Native | ≥ 0.70 |
| React | ≥ 18 |
| iOS | ≥ 15.5 |
| Android | API 23+ |

Published version and peer ranges: see [`package.json`](./package.json).

## Installation

### React Native

```bash
npm install react-native-zip-archive
cd ios && pod install
```

### Expo

Works in **development builds / EAS** only — not Expo Go (custom native code).

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

See [playground-expo](./playground-expo/) for a working example.

## Quick start

```js
import {
  zip,
  unzip,
  zipWithPassword,
  unzipWithPassword,
  listContents,
  subscribe,
  cancel,
  ErrorCodes,
} from 'react-native-zip-archive'

// Paths: use react-native-fs (bare) or expo-file-system/legacy (Expo)
import { DocumentDirectoryPath } from 'react-native-fs'
// Expo: const DocumentDirectoryPath = FileSystem.documentDirectory

const archive = `${DocumentDirectoryPath}/bundle.zip`
const outDir = `${DocumentDirectoryPath}/out`

// Zip a folder
await zip(DocumentDirectoryPath, archive)

// Unzip
await unzip(archive, outDir)

// Password
await zipWithPassword(DocumentDirectoryPath, archive, 'secret', 'STANDARD')
await unzipWithPassword(archive, outDir, 'secret')

// List + selective extract + AbortSignal
const controller = new AbortController()
const entries = await listContents(archive)
const assets = entries
  .filter((e) => !e.isDirectory && e.path.startsWith('assets/'))
  .map((e) => e.path)

await unzip(archive, outDir, { entries: assets, signal: controller.signal })
// controller.abort() → rejects with ZipError code ERR_CANCELLED
```

Progress and cancel:

```js
const sub = subscribe(({ progress, filePath }) => {
  console.log(progress, filePath) // progress: 0…1
})

await unzip(archive, outDir)
sub.remove()

// Or abort the in-flight native op
await cancel() // rejects with ErrorCodes.CANCELLED
```

## API

### `zip(source, target, compressionLevelOrOptions?)`

Zip a folder (`string`) or files/folders (`string[]`) to `target`.

- Single file: `zip([file], target)`.
- Array items may be directories; contents are added recursively (entry paths relative to that directory; empty dirs preserved).
- Third arg: compression level (`0`–`9`, or constants below) or `{ compressionLevel, signal }`.

```js
import { BEST_SPEED } from 'react-native-zip-archive'

await zip(sourceDir, targetZip)
await zip([fileA, fileB], targetZip, BEST_SPEED)
await zip(sourceDir, targetZip, { compressionLevel: BEST_SPEED, signal })
```

**Compression constants:** `DEFAULT_COMPRESSION` (-1), `NO_COMPRESSION` (0), `BEST_SPEED` (1), `BEST_COMPRESSION` (9).

### `zipWithPassword(source, target, password, encryptionTypeOrOptions?, compressionLevel?)`

Same sources as `zip`, with a password.

**Encryption types:**

| Value | Meaning |
|-------|---------|
| `'STANDARD'` (default) | ZipCrypto — readable by Node, Java, stock `unzip` |
| `'AES-128'` / `'AES-256'` | WinZip-AES (stronger; many server tools cannot open) |

On iOS, both AES options use AES-256 internally. Prefer `'STANDARD'` when archives will be unzipped off-device.

```js
await zipWithPassword(sourceDir, targetZip, 'password', 'STANDARD')
await zipWithPassword(sourceDir, targetZip, 'password', {
  encryptionMethod: 'AES-256',
  compressionLevel: BEST_COMPRESSION,
  signal,
})
```

### `unzip(source, target, charsetOrEntriesOrOptions?, entries?)`

Extract an archive. Optional `entries` extracts only those paths (directories include nested children).

```js
await unzip(source, target)
await unzip(source, target, 'UTF-8')
await unzip(source, target, ['readme.md', 'docs'])
await unzip(source, target, 'UTF-8', ['readme.md'])
await unzip(source, target, { entries: ['readme.md'], signal })
```

Charset defaults to `UTF-8`. On iOS, non-UTF-8 values reject with `ERR_UNSUPPORTED`.

### `unzipWithPassword(source, target, password, entriesOrOptions?)`

```js
await unzipWithPassword(source, target, 'password')
await unzipWithPassword(source, target, 'password', ['secret.txt'])
await unzipWithPassword(source, target, 'password', { entries: ['secret.txt'], signal })
```

### `listContents(source, charset?)` → `Promise<ZipEntry[]>`

```ts
type ZipEntry = {
  path: string
  size: number           // uncompressed bytes
  compressedSize: number
  isDirectory: boolean
  isEncrypted: boolean
}
```

### `unzipAssets(assetPath, target, options?)`

Unzip a **bundled** archive (relative path only — not an absolute filesystem path).

- **Android:** path under APK `assets/` (also accepts `content://` URIs)
- **iOS:** path in the main app bundle

```js
await unzipAssets('./myFile.zip', DocumentDirectoryPath)
await unzipAssets('./myFile.zip', DocumentDirectoryPath, { signal })
```

### `getUncompressedSize(source, charset?)` → `Promise<number>`

Total uncompressed size in bytes. Charset is Android-only; iOS ignores it.

### `isPasswordProtected(source)` → `Promise<boolean>`

### `cancel()` → `Promise<void>`

Best-effort abort of the in-flight operation. The active promise rejects with `ErrorCodes.CANCELLED` (`ERR_CANCELLED`).

Operations are serialized (Android single-thread executor / iOS serial queue). Concurrent calls queue FIFO; `cancel()` is not blocked behind in-flight work.

### `subscribe(callback)` → `{ remove() }`

```js
subscribe(({ progress, filePath }) => { /* progress 0…1 */ })
```

- Event is **global** — match `filePath` to your operation, then call `.remove()`.
- `unzip` / `unzipWithPassword`: byte-weighted after each entry.
- `zip` / `zipWithPassword`: per-file.
- `unzipAssets` (Android): approximate vs compressed size.

### Error codes

Stable `error.code` on both platforms (also on `ErrorCodes`):

| Code | When |
|------|------|
| `ERR_FILE_NOT_FOUND` | Source missing |
| `ERR_INVALID_PATH` | Bad / null path |
| `ERR_INVALID_ARGS` | Empty password, empty entries, etc. |
| `ERR_WRONG_PASSWORD` | Decrypt failed |
| `ERR_NOT_PASSWORD_PROTECTED` | Password API on a plain archive |
| `ERR_CORRUPT_ARCHIVE` | Not a zip / truncated |
| `ERR_UNSAFE_PATH` | Zip Slip / path traversal |
| `ERR_CANCELLED` | `cancel()` or `AbortSignal` |
| `ERR_ZIP` / `ERR_UNZIP` | Generic failure |
| `ERR_UNSUPPORTED` | Not available on this platform |

`ZipError` is a factory (not an ES class). Check `error.code`; do not use `instanceof`.

## Platform support

| Feature | iOS | Android |
|---------|:---:|:-------:|
| `zip` / `zipWithPassword` | ✅ | ✅ |
| `unzip` / `unzipWithPassword` (+ selective `entries`) | ✅ | ✅ |
| `listContents` | ✅ | ✅ |
| `unzipAssets` | ✅ | ✅ |
| `cancel` / `AbortSignal` | ✅ | ✅ |
| `isPasswordProtected` / `getUncompressedSize` | ✅ | ✅ |
| Progress events | ✅ | ✅ |

**Notes**

- **Encryption:** Prefer `'STANDARD'` for server-side unzip. AES archives often fail with Node `unzipper` / Java `ZipInputStream`.
- **Charset:** Android supports custom charsets; iOS is UTF-8 only (`ERR_UNSUPPORTED` otherwise).
- **Paths:** Decode URL-encoded paths (`decodeURIComponent`) before passing them — `%20` has been mistaken for corrupt archives (#333).
- **Interop check:** `node scripts/validate-zip-header.js /path/to/archive.zip` and `npm run test:interop`.

## Old architecture (RN 0.70–0.81)

Stay on v7 only for RN **&lt; 0.70**. On 0.70+, install latest v9 and rebuild native — do not stay on v7 for old architecture.

v9 loads via `TurboModuleRegistry` first, then `NativeModules.RNZipArchive`. On RN **0.82+**, the opt-out flags `newArchEnabled=false` / `RCT_NEW_ARCH_ENABLED=0` are ignored (New Architecture only).

CI compile proof for RN 0.81.6: [`.github/workflows/old-arch.yml`](./.github/workflows/old-arch.yml). Agent/contributor details: [AGENTS.md](./AGENTS.md).

## Playgrounds

| App | Stack |
|-----|--------|
| [playground-expo](./playground-expo/) | Expo SDK 55, Expo Router, New Architecture |
| [playground-rn](./playground-rn/) | Bare RN 0.83.9, New Architecture |

Both consume the library via `file:..` and include Maestro E2E flows under [`.maestro/`](./.maestro/).

## Comparison

| | This library | JSZip | Nitro unzip/archive |
|--|--------------|-------|---------------------|
| Zip / unzip | Native iOS + Android | Pure JS | Native via Nitro |
| Password zips | Yes | Small in-memory only | Check those packages |
| Expo Go | No (dev build) | Yes | No (dev build) |
| Extra native deps | None | None | `react-native-nitro-modules` |
| Large files | Native I/O | Memory-heavy | Varies |

Use this library for on-device native zip/unzip. Use JSZip for small in-JS archives.

## Testing

```bash
npm test                 # Jest (JS layer + mocks)
npm run test:interop     # Node/Java unzip of committed fixtures
npm run test:docs-sync   # README ↔ AGENTS.md fact + change pairing
```

E2E (Maestro): see [e2e/README.md](./e2e/README.md).

## Migrating

Coming from v7? Start with [Upgrade from v7](./MIGRATION.md#upgrade-from-v7). Full notes: [MIGRATION.md](./MIGRATION.md).

## Security

Supported versions and reporting: [SECURITY.md](./SECURITY.md).

## Contributing

- Use the [playground apps](#playgrounds) to exercise changes.
- **[AGENTS.md](./AGENTS.md)** — canonical agent guide ([agents.md](https://agents.md/) standard). README is for humans; keep shared facts in sync (`npm run test:docs-sync`).
- Review focus areas: [REVIEW.md](./REVIEW.md).
- Optional local gate: [pre-commit](https://pre-commit.com/) (`.pre-commit-config.yaml`).

### Minor releases

Each minor (`vX.Y.0`) gets one GitHub Discussion in **Announcements**.

1. Add `.github/announcements/vX.Y.md` with an H1 title and `<!-- releases: vX.Y.0 -->`
2. Merge to `master` — [minor-discussion.yml](./.github/workflows/minor-discussion.yml) opens or reuses the Discussion

## Related

- [ZipArchive](https://github.com/ZipArchive/ZipArchive) (iOS)
- [zip4j](https://github.com/srikanth-lingala/zip4j) (Android)

---

[!["Buy Me A Coffee"](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://www.buymeacoffee.com/plrthink)
