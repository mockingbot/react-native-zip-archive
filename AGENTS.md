# AGENTS.md

Canonical guide for AI coding agents working in this repository ([AGENTS.md](https://agents.md/) open standard — complements the human-facing [README.md](./README.md)).

## Keep in sync

| File | Audience | Role |
|------|----------|------|
| [README.md](./README.md) | Humans / npm consumers | Install, quick start, API reference |
| **AGENTS.md** (this file) | Agents (+ contributor ops) | Hard rules, architecture, test/debug commands |
| [CLAUDE.md](./CLAUDE.md) | Claude Code | Thin pointer to this file — do not fork rules there |

**Shared facts** (version matrix, peer floors, iOS 15.5, Zip Slip / `ERR_UNSAFE_PATH`, public API names) must agree between `README.md` and this file. Prefer one canonical sentence + a cross-link over two diverging copies.

When you change doc-impacting code (`index.js`, `index.d.ts`, `specs/`, `android/src/`, `ios/RNZipArchive.*`, `package.json`, `app.plugin.js`):

1. Update **both** `README.md` and `AGENTS.md` in the same change when user-facing or agent-facing guidance shifts.
2. Run `npm run test:docs-sync` (same check as CI and optional [pre-commit](https://pre-commit.com/)).
3. Rare internal-only change with no doc impact: commit message may include `[docs-sync skip]`.

Enforcement is **portable** (not editor-specific): `scripts/check-docs-sync.sh` → GitHub Actions `docs-sync.yml` + optional `.pre-commit-config.yaml`.

## What this is

`react-native-zip-archive` — a React Native **TurboModule** that zips and unzips files on iOS and Android. Public npm package; JS API is stable across v7 → v9 (native rebuild required when upgrading).

| Layer | Role |
|-------|------|
| `index.js` / `index.d.ts` | Public JS API + TypeScript types |
| `specs/NativeZipArchive.ts` | Codegen TurboModule spec (source of truth for native method names) |
| `android/src/...` | Android implementation (zip4j) |
| `ios/RNZipArchive.mm` | iOS implementation (SSZipArchive / minizip) |
| `app.plugin.js` | Expo config plugin (passthrough; enables `plugins` entry) |
| `playground-expo/` / `playground-rn/` | Demo apps (`file:..` link to this package) |
| `__tests__/` | Jest tests (native module mocked) |
| `scripts/` | Interop validators, E2E helpers |
| `.maestro/` | Maestro E2E flows |

## Version matrix (do not invent)

| React Native | Package |
|--------------|---------|
| &lt; 0.70 | Stay on **v7** (`^7.0.0`) |
| 0.70–0.81 | **v9** — New Arch recommended; old arch works after native rebuild |
| 0.82+ | **v9** — New Arch only (RN ignores opt-out flags) |

- Current package version: see `package.json`.
- User-facing docs: `README.md`. Upgrade notes: `MIGRATION.md`. Security: `SECURITY.md`.
- Review checklist: `REVIEW.md`.

## Hard rules

1. **Spec parity.** Any change to `specs/NativeZipArchive.ts` must be reflected in Android, iOS, `index.js`, and `index.d.ts`. Do not ship one-sided API changes.
2. **Zip Slip.** Unzip must reject entry paths that escape the destination (`ERR_UNSAFE_PATH`). Touching path normalization or extract on either platform requires security scrutiny. Symlink entries must be skipped, not materialized.
3. **Stable error codes.** Reject with the `ERR_*` codes in `ErrorCodes` (`index.js`). Keep codes aligned on both platforms.
4. **No new heavy deps.** Peer range is React ≥ 18 and RN ≥ 0.70. Do not add native or JS dependencies lightly.
5. **`ZipError` is a factory**, not an ES `class` (Metro / `@babel/runtime`). Never introduce `instanceof ZipError` checks in docs or examples.
6. **Do not edit generated / lock noise** unless the task requires it: `node_modules/`, build outputs, playground lock churn without a real dep change.

## How the JS bridge loads

```text
TurboModuleRegistry.get('RNZipArchive')  →  NativeModules.RNZipArchive
```

If neither is present, throw `ERR_UNSUPPORTED` with a clear install/link message.

Options objects (`{ signal }`, `{ entries }`, `{ compressionLevel }`) are JS-side conveniences; natives use the codegen positional methods. Keep overloads in `index.d.ts` in sync with `index.js`.

## Native conventions

- **Threading:** Android zip/unzip on a single-thread executor (FIFO). iOS on a background serial queue. Never block the UI/main thread with archive I/O. `cancel()` must not wait behind the operation it should abort.
- **Encryption default:** `'STANDARD'` = ZipCrypto (interop with Node/Java/`unzip`). AES = WinZip-AES; many server tools cannot open AES zips — default to STANDARD for off-device consumers.
- **Charset:** Android may honor non-UTF-8; an invalid charset name rejects with `ERR_UNSUPPORTED`. iOS must reject non-UTF-8 with `ERR_UNSUPPORTED` (except where docs say charset is ignored, e.g. `getUncompressedSize` on iOS).
- **Progress:** Emit monotonic 0→1 with explicit start/end. Shape: `{ progress, filePath }`. Android `zip` counts work units before the first event. `unzipAssets` uses bytes copied when `ZipInputStream` reports compressed size `-1`, so progress cannot go negative. Treat cross-platform divergence as a bug.
- **Durability:** After a successful zip, fsync the archive before resolving (iOS `fsync`, Android `FileDescriptor.sync`) so a following read or upload sees the full file.
- **Missing sources:** Reject with `ERR_FILE_NOT_FOUND` when the archive path is missing (`unzip`, `unzipWithPassword`, `listContents`, `isPasswordProtected`, `getUncompressedSize`). Do not collapse that case into `ERR_UNZIP` / `ERR_CORRUPT_ARCHIVE`.

## Testing commands

Run from repo root:

```bash
npm test                 # Jest — preferred fast check for JS/API changes
npm run test:interop     # Node unzipper + Java ZipInputStream on fixtures/
npm run test:docs-sync   # README ↔ AGENTS.md (same as CI / pre-commit)
npm run lint             # ESLint on index.js
```

When changing the public API:

1. Update `__mocks__/react-native.js` if the native surface changes.
2. Extend `__tests__/api.test.js` (and related) for new overloads / error paths.
3. Prefer `npm test` before claiming done; add interop checks if zip format/encryption defaults change.

E2E (device/simulator, heavy):

```bash
npm run test:e2e:expo    # Maestro vs playground-expo
npm run test:e2e:rn      # Maestro vs playground-rn
```

See `e2e/README.md`. Skip E2E unless the change is native behavior that Jest cannot cover.

Old-architecture compile proof (CI): `.github/workflows/old-arch.yml` on RN **0.81.6**. Not device Maestro.

## Playgrounds

| Directory | Purpose |
|-----------|---------|
| `playground-expo/` | Expo SDK 55 / New Arch — config plugin + `expo-file-system` usage |
| `playground-rn/` | Bare RN 0.83.9 / New Arch |

Both depend on `"react-native-zip-archive": "file:.."`. After changing native code, rebuild the playground (Metro reload alone is not enough).

Treat playground edits as optional unless the task is demo/E2E related. Prefer keeping playgrounds compiling when you change the public API.

## Docs ownership

| File | Audience |
|------|----------|
| `README.md` | Humans — install, quick start, API |
| `AGENTS.md` | Agents — this file (canonical) |
| `CLAUDE.md` | Claude Code — pointer to `AGENTS.md` |
| `MIGRATION.md` | Version upgrades (v7→v9, minor notes) |
| `SECURITY.md` | Supported versions, vuln reporting, Zip Slip scope |
| `REVIEW.md` | PR review focus (parity, security, threading) |
| `CHANGELOG.md` | Release history |

Keep README examples accurate to `index.d.ts`. Prefer linking here or to `MIGRATION.md` for deep architecture detail instead of duplicating long matrices in the README. See [Keep in sync](#keep-in-sync).

## CI workflows (`.github/workflows/`)

| Workflow | What it covers |
|----------|----------------|
| `docs-sync.yml` | README ↔ AGENTS.md fact + change pairing (always) |
| `js-tests.yml` | Jest + lint when `js` paths change |
| `android-build.yml` / `ios-build.yml` | Native builds — only when `native` paths change |
| `e2e.yml` | Maestro E2E — only when `native` paths change |
| `old-arch.yml` | RN 0.81.6 paper/old-arch compile — `native` paths |
| `zip-interop.yml` | Fixture unzip interop — `interop` paths |
| `publish.yml` | npm publish (tags) |
| `minor-discussion.yml` | Announcement Discussion for minors |

Path filters live in [`.github/path-filters.yml`](./.github/path-filters.yml) (see [`.github/workflows/path-filters.md`](./.github/workflows/path-filters.md)). Docs-only PRs must not burn macOS/Android build minutes: heavy jobs are gated behind a cheap `changes` job so `concurrency: cancel-in-progress` can still stop outdated runs. Force a full build with **Actions → Run workflow**.

## Common tasks

### Add or change a public API

1. Spec (`specs/NativeZipArchive.ts`) if native signature changes.
2. Android + iOS implementations.
3. `index.js` wrappers (options / AbortSignal / validation).
4. `index.d.ts` overloads.
5. Jest mocks + tests.
6. README API section (short example) **and** this file if hard rules/commands change.
7. `npm run test:docs-sync`
8. `MIGRATION.md` if behavior/default changes for existing callers.

### Encryption / interop change

- Prefer STANDARD for defaults that leave the device.
- Update `fixtures/interop/` and `npm run test:interop` expectations.
- Document in `MIGRATION.md` if defaults flip.

### Security-sensitive extract change

- Mirror Android and iOS validation.
- Reject traversal with `ERR_UNSAFE_PATH`.
- Skip symlinks on extract.
- Note supported-version impact in `SECURITY.md` if shipping a fix.

## Do not

- Stay on or recommend v7 for RN ≥ 0.70 (except RN &lt; 0.70).
- Claim Expo Go support.
- Force-push `master` or rewrite published release tags.
- Add purple “AI slop” marketing to docs; keep README factual and scannable.
- Estimate calendar time in planning — describe technical scope instead.

## Quick orientation checklist

- [ ] Read `package.json` version and peer deps.
- [ ] Skim `specs/NativeZipArchive.ts` + `index.d.ts` for the real API.
- [ ] For native bugs: find the path in `ios/RNZipArchive.mm` and `android/src/main/java/com/rnziparchive/`.
- [ ] Run `npm test` after JS changes; `npm run test:interop` after format/crypto changes.
- [ ] Update docs for the surfaces you changed; keep README + AGENTS.md paired (`npm run test:docs-sync`).
