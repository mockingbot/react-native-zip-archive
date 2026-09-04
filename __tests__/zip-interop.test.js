const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const { assertPlainZip, WINZIP_AES_EXTRA } = require('../scripts/verify-zip-interop');
const { validateZip } = require('../scripts/validate-zip-header');

const FIXTURES = path.join(__dirname, '..', 'fixtures', 'interop');
const PLAIN = path.join(FIXTURES, 'plain-deflate.zip');
const AES = path.join(FIXTURES, 'winzip-aes-marker.zip');

describe('zip interop gate (RNZA-16)', () => {
  test('plain fixture has PKZIP signatures and no AES extra field', () => {
    const { buf } = validateZip(PLAIN);
    expect(() => assertPlainZip(PLAIN, buf)).not.toThrow();
  });

  test('WinZip-AES marker fixture is rejected before extractors run', () => {
    const buf = fs.readFileSync(AES);
    const nameLen = buf.readUInt16LE(26);
    const extraStart = 30 + nameLen;
    expect(buf.subarray(30, extraStart).toString()).toBe('secret.txt');
    expect(buf.readUInt16LE(extraStart)).toBe(WINZIP_AES_EXTRA);
    expect(() => assertPlainZip(AES, buf)).toThrow(/0x9901/);
  });

  test('CLI extracts the plain fixture with unzipper and ZipInputStream', () => {
    const result = spawnSync(
      process.execPath,
      [path.join(__dirname, '..', 'scripts', 'verify-zip-interop.js'), '--fixtures'],
      { encoding: 'utf8', cwd: path.join(__dirname, '..') }
    );
    expect(result.stderr).toBe('');
    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(/OK node unzipper/);
    expect(result.stdout).toMatch(/OK java ZipInputStream/);
  });

  test('CLI --expect-fail passes on the AES marker', () => {
    const result = spawnSync(
      process.execPath,
      [
        path.join(__dirname, '..', 'scripts', 'verify-zip-interop.js'),
        '--expect-fail',
        AES,
      ],
      { encoding: 'utf8', cwd: path.join(__dirname, '..') }
    );
    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(/OK expected failure/);
  });

  test('publish workflow requires the zip-interop job', () => {
    const yml = fs.readFileSync(
      path.join(__dirname, '..', '.github', 'workflows', 'publish.yml'),
      'utf8'
    );
    expect(yml).toMatch(/needs:\s*zip-interop/);
    expect(yml).toMatch(/verify-zip-interop\.js --fixtures/);
  });

  test('does not leave class files in the repo', () => {
    const tmpHint = os.tmpdir();
    expect(tmpHint.length).toBeGreaterThan(0);
    expect(fs.existsSync(path.join(__dirname, '..', 'scripts', 'ZipInputStreamCheck.class'))).toBe(
      false
    );
  });
});
