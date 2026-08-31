# Changelog (7.x)

## [7.1.2] - 2026-08-31

### Fixed
- Android: Zip Slip validation and disabled symlink extraction on `unzip` / `unzipWithPassword` / `unzipAssets` (#375)
- iOS: secure minizip extract — rejects Zip Slip entries and skips symlink entries (#375)

Note: npm already had **7.1.1** from an earlier release without these fixes; use **7.1.2** for the security backport.
