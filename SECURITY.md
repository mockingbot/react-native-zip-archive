# Security Policy

## Supported versions

| Version | Support |
| --- | --- |
| **9.x** (latest) | Actively supported |
| **8.x** | Not patched. Upgrade to 9.x — the JS API is compatible |
| **7.x** | Security fixes only through **2027-02-19**. After that, 7.x is unsupported. Stay on 7.x if you are on React Native &lt; 0.70 until you upgrade RN. 7.x will not be deleted or unpublished. |
| **&lt; 7** | Unsupported except for critical issues |

Zip Slip / symlink fixes shipped in 9.x will be **evaluated for 7.x backports**. If a patch is warranted, it will be published as `7.x.y`. **7.1.1** backports Zip Slip validation and symlink skipping for Android and iOS extract paths.

## Reporting a vulnerability

Prefer [GitHub Security Advisories](https://github.com/mockingbot/react-native-zip-archive/security/advisories/new).

You can also email the maintainer: **Perry Poon** &lt;plrthink@gmail.com&gt;.

Please **do not** file a public GitHub issue for an unfixed vulnerability.

## Scope

In scope:

- Zip Slip / path traversal on extract
- Symlink extract that resolves outside the destination directory
- Password / crypto issues in zip/unzip
- Supply-chain issues in native deps (**SSZipArchive** on iOS, **zip4j** on Android)

### What already landed in 9.x

- **Android Zip Slip** protection: 9.0.0 — extract rejects entries whose path escapes the destination.
- **Android symlink extract**: 9.0.2 — `unzip` / `unzipWithPassword` no longer materialize symlink entries.

iOS (verified in `ios/RNZipArchive.mm`): full and selective extract use minizip with `isSafeExtractPath` (Zip Slip) and skip symlink entries (`shouldSkipZipEntry`), matching Android #357 behavior. Full unzip no longer delegates extract to SSZipArchive.
