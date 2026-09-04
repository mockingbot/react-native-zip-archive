const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const pkg = require('../package.json');

describe('npm listing (RNZA-13) and packed files', () => {
  test('description names zip/unzip, React Native, Expo, and both platforms', () => {
    expect(pkg.description).toBe(
      'Zip and unzip files in React Native and Expo (iOS & Android)'
    );
  });

  test('keywords include expo, eas, password, aes, and turbo-module', () => {
    for (const keyword of ['expo', 'eas', 'password', 'aes', 'turbo-module', 'unzip']) {
      expect(pkg.keywords).toContain(keyword);
    }
  });

  test('package.json points TypeScript at index.d.ts', () => {
    expect(pkg.types).toBe('index.d.ts');
  });

  test('npm pack includes the Expo plugin and SECURITY.md', () => {
    const packed = spawnSync('npm', ['pack', '--dry-run', '--json'], {
      cwd: path.join(__dirname, '..'),
      encoding: 'utf8',
    });
    expect(packed.status).toBe(0);
    const parsed = JSON.parse(packed.stdout);
    const packMeta = Array.isArray(parsed)
      ? parsed[0]
      : parsed[pkg.name] ?? Object.values(parsed)[0];
    expect(packMeta?.files).toBeDefined();
    const files = packMeta.files.map((f) => f.path);
    expect(files).toContain('app.plugin.js');
    expect(files).toContain('SECURITY.md');
    expect(files).toContain('package.json');
    expect(files).toContain('README.md');
    expect(files).toContain('index.d.ts');
    expect(files).not.toContain('playground-expo/app.json');
    expect(files.some((f) => f.startsWith('fixtures/'))).toBe(false);
  });
});

describe('docs claims vs native source (RNZA-7/15/17/19)', () => {
  const read = (rel) => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');

  test('JS still falls back from TurboModuleRegistry to NativeModules', () => {
    const index = read('index.js');
    expect(index).toMatch(/TurboModuleRegistry\.get\("RNZipArchive"\)/);
    expect(index).toMatch(/NativeModules\.RNZipArchive/);
  });

  test('Android zip/unzip still serialize on a single-thread executor', () => {
    expect(read('android/src/main/java/com/rnziparchive/RNZipArchiveModule.java')).toMatch(
      /Executors\.newSingleThreadExecutor/
    );
  });

  test('iOS preserves empty child directories in a files-array zip', () => {
    const mm = read('ios/RNZipArchive.mm');
    expect(mm).toMatch(/Empty directories are preserved as directory entries/);
    expect(mm).toMatch(/writeFolderAtPath/);
  });

  test('iOS file-array zip applies compressionLevel', () => {
    const mm = read('ios/RNZipArchive.mm');
    expect(mm).toMatch(/compressionLevel:compressionLevel/);
    expect(mm).toMatch(/zlibCompressionLevel/);
  });

  test('SECURITY.md matches the Android Zip Slip / symlink helpers that exist', () => {
    const security = read('SECURITY.md');
    const zipSecurity = read('android/src/main/java/com/rnziparchive/ZipSecurity.java');
    const ios = read('ios/RNZipArchive.mm');
    expect(security).toMatch(/9\.x/);
    expect(security).toMatch(/2027-02-19/);
    expect(security).toMatch(/7\.1\.2/);
    expect(security).toMatch(/maintenance-7/);
    expect(zipSecurity).toMatch(/setExtractSymbolicLinks\(false\)/);
    expect(zipSecurity).toMatch(/Zip Path Traversal Vulnerability/);
    expect(ios).toMatch(/isSafeExtractPath/);
    expect(ios).toMatch(/shouldSkipZipEntry/);
    expect(ios).toMatch(/isSymlinkZipEntryVersion/);
    expect(ios).not.toMatch(/SSZipArchive unzipFileAtPath/);
  });

  test('README documents old-arch v9 load path and playground-rn CI', () => {
    const readme = read('README.md');
    const pkgJava = read('android/src/main/java/com/rnziparchive/RNZipArchivePackage.java');
    expect(readme).toMatch(/old-arch\.yml/);
    expect(readme).toMatch(/newArchEnabled=false/);
    expect(readme).toMatch(/RCT_NEW_ARCH_ENABLED=0/);
    expect(pkgJava).toMatch(/boolean isTurboModule = BuildConfig\.IS_NEW_ARCHITECTURE_ENABLED/);
    expect(pkgJava).not.toMatch(/true\s*\/\/ isTurboModule = true/);
  });

  test('README records AbortSignal and ZipError usage', () => {
    const readme = read('README.md');
    expect(readme).toMatch(/test:interop/);
    expect(readme).toMatch(/AbortSignal/);
    expect(readme).toMatch(/ZipError/);
  });
});
