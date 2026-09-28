# Changelog (7.x)

## [Unreleased]

### Fixed
- Android: cast `compressionLevel` to `int` in `getCompressionLevel` so the 7.x line compiles again (#390). Cherry-pick of #342 (`304dc16`), which shipped in 7.1.1 but was not on the 7.1.0 base used for 7.1.2.

## [7.1.2] - 2026-08-31

### Fixed
- Android: Zip Slip validation and disabled symlink extraction on `unzip` / `unzipWithPassword` / `unzipAssets` (#375)
- iOS: secure minizip extract — rejects Zip Slip entries and skips symlink entries (#375)

Note: npm already had **7.1.1** from an earlier release without these fixes; use **7.1.2** for the security backport.
