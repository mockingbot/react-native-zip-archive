# Zip interop fixtures (RNZA-16)

`plain-deflate.zip` is the release gate: a non-password PKZIP/deflate archive that **must** extract with Node `unzipper` and Java `ZipInputStream`.

`winzip-aes-marker.zip` is a negative fixture (WinZip-AES extra field `0x9901`). The gate must reject it. That is the #333 / #323 class of iOS default-AES archives.

Refresh:

```bash
python3 scripts/generate-interop-fixtures.py
```

To lock a zip produced on-device (preferred when replacing `plain-deflate.zip`):

1. Zip a folder with `zip(...)` in playground-ios (no password).
2. Copy the archive here as `plain-deflate.zip`.
3. `node scripts/verify-zip-interop.js --fixtures` must pass.
