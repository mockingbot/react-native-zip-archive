#!/usr/bin/env python3
"""Create committed zip fixtures for scripts/verify-zip-interop.js (RNZA-16)."""

from __future__ import annotations

import io
import struct
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "fixtures" / "interop"


def write_plain_deflate() -> Path:
    """PKZIP deflate archive matching a non-password iOS/Android zip."""
    dest = OUT / "plain-deflate.zip"
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", compression=zipfile.ZIP_DEFLATED, allowZip64=False) as zf:
        zf.writestr("hello.txt", "hello from react-native-zip-archive\n")
        zf.writestr("nested/file.txt", "nested file\n")
        zf.writestr("empty-dir/", "")
    dest.write_bytes(buf.getvalue())
    return dest


def write_winzip_aes_marker() -> Path:
    """Minimal zip whose extra field is 0x9901 — must fail the plain-zip gate."""
    dest = OUT / "winzip-aes-marker.zip"
    name = b"secret.txt"
    data = b"x"
    extra = struct.pack("<HH", 0x9901, 7) + b"\x02\x00AE\x03\x00\x00"
    crc = 0x8B9F43A0  # zlib.crc32(b'x') & 0xffffffff
    # sig, ver, flags, method, time, date, crc, csize, usize, nlen, elen
    local = struct.pack(
        "<IHHHHHIIIHH",
        0x04034B50,
        20,
        0,
        0,  # stored
        0,
        0,
        crc,
        len(data),
        len(data),
        len(name),
        len(extra),
    )
    central = struct.pack(
        "<IHHHHHHIIIHHHHHII",
        0x02014B50,
        20,
        20,
        0,
        0,
        0,
        0,
        crc,
        len(data),
        len(data),
        len(name),
        len(extra),
        0,
        0,
        0,
        0,
        0,
    )
    eocd = struct.pack(
        "<IHHHHIIH",
        0x06054B50,
        0,
        0,
        1,
        1,
        46 + len(name) + len(extra),
        len(local) + len(name) + len(extra) + len(data),
        0,
    )
    dest.write_bytes(local + name + extra + data + central + name + extra + eocd)
    return dest


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    plain = write_plain_deflate()
    aes = write_winzip_aes_marker()
    print(f"wrote {plain} ({plain.stat().st_size} bytes)")
    print(f"wrote {aes} ({aes.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
