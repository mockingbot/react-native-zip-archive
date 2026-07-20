# Review Guidelines

This is `react-native-zip-archive`, a React Native TurboModule (New Architecture) that wraps zip/unzip functionality for iOS and Android.

## Critical Areas

- **Spec parity across platforms.** `specs/NativeZipArchive.ts` is the codegen source of truth. Any change to the spec must be reflected in both the Android implementation (`android/src/main/java/com/rnziparchive/`) and the iOS implementation (`ios/RNZipArchive.mm`), and in `index.js` / `index.d.ts`. Flag PRs that change one side without the others.
- **Path traversal (Zip Slip).** All unzip paths must be validated to stay inside the destination directory. Any change touching entry-name handling, path normalization, or file writing on either platform needs extra scrutiny for Zip Slip regressions.
- **Promise/error handling.** Rejections must propagate meaningful errors to JS on both platforms. Flag swallowed exceptions, empty catch blocks, or resolving with `nil`/`null` where an error should be rejected.
- **Threading.** Android work must stay off the main thread; iOS must use appropriate dispatch queues. Flag blocking I/O on the UI/main thread and race conditions in progress-event emission.
- **Progress events.** Progress callbacks must fire in the same order and shape on both platforms (the cross-platform progress contract was aligned in v9 — treat divergence as a bug).

## Conventions

- Public API surface (`index.js`) must keep its TypeScript types in `index.d.ts` in sync.
- Jest tests in `__tests__/` mock the native module via `__mocks__/react-native.js` — update the mock when the API changes.
- New dependencies must not be added lightly; this library targets a wide range of React Native versions (>= 0.70).

## Ignore

- `playground-expo/`, `playground-rn/` — demo apps; skip unless the PR specifically targets them.
- `node_modules/`, `android/build/`, `.expo/`, and other generated build output.
- `pnpm-lock.yaml` and other lock files, unless dependencies actually changed.
- `CHANGELOG.md`-only or version-bump commits.

## Performance

- Watch for unbounded buffering of large archives in memory (e.g. loading whole files into `NSData`/`byte[]` instead of streaming).
- Watch for per-entry overhead in loops: repeated path validation, string building, or event emission without throttling.
