# Changelog (7.x)

## [Unreleased]

## [7.1.3] - 2026-09-28

### Fixed
- Android: `getCompressionLevel` switches on `(int) compressionLevel`, so the 7.x line compiles again (#390, #392). This is the #342 fix from 7.1.1; 7.1.2 was cut from 7.1.0 and did not include it.

## [7.1.2] - 2026-08-31

### Fixed
- Android: Zip Slip validation and disabled symlink extraction on `unzip` / `unzipWithPassword` / `unzipAssets` (#375)
- iOS: secure minizip extract — rejects Zip Slip entries and skips symlink entries (#375)

Note: npm already had **7.1.1** without these security fixes. **7.1.2** has the Zip Slip / symlink backport but does not compile on Android. Use **7.1.3**.
