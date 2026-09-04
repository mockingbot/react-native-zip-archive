#!/usr/bin/env node
/**
 * RNZA-16: fail if a non-password zip cannot be extracted by the tools that
 * caused #333 / #323 churn — Node `unzipper` and Java `ZipInputStream`.
 *
 * Also rejects WinZip-AES extra field 0x9901 (the old iOS default) unless
 * `--allow-aes` is passed.
 *
 * Usage:
 *   node scripts/verify-zip-interop.js <file.zip> [more.zip ...]
 *   node scripts/verify-zip-interop.js --fixtures
 *   node scripts/verify-zip-interop.js --expect-fail <aes-marker.zip>
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const { validateZip } = require('./validate-zip-header');

const WINZIP_AES_EXTRA = 0x9901;
const CENTRAL_DIRECTORY_HEADER = 0x02014b50;
const FLAG_ENCRYPTED = 0x0001;

function parseArgs(argv) {
  const files = [];
  let fixtures = false;
  let expectFail = false;
  let allowAes = false;
  for (const arg of argv) {
    if (arg === '--fixtures') {
      fixtures = true;
    } else if (arg === '--expect-fail') {
      expectFail = true;
    } else if (arg === '--allow-aes') {
      allowAes = true;
    } else if (arg.startsWith('-')) {
      throw new Error(`Unknown flag: ${arg}`);
    } else {
      files.push(arg);
    }
  }
  return { files, fixtures, expectFail, allowAes };
}

function defaultFixtures() {
  const dir = path.join(__dirname, '..', 'fixtures', 'interop');
  return fs
    .readdirSync(dir)
    .filter((name) => name.startsWith('plain-') && name.endsWith('.zip'))
    .map((name) => path.join(dir, name));
}

function scanExtraFields(extra, where) {
  let offset = 0;
  while (offset + 4 <= extra.length) {
    const id = extra.readUInt16LE(offset);
    const size = extra.readUInt16LE(offset + 2);
    if (id === WINZIP_AES_EXTRA) {
      throw new Error(`${where}: WinZip-AES extra field 0x9901 (use STANDARD/ZipCrypto, not AES)`);
    }
    offset += 4 + size;
  }
}

function assertPlainZip(filePath, buf) {
  let offset = 0;
  let localHeaders = 0;
  while (offset + 30 <= buf.length && buf.readUInt32LE(offset) === 0x04034b50) {
    const flags = buf.readUInt16LE(offset + 6);
    const nameLen = buf.readUInt16LE(offset + 26);
    const extraLen = buf.readUInt16LE(offset + 28);
    const compressedSize = buf.readUInt32LE(offset + 18);
    if (flags & FLAG_ENCRYPTED) {
      throw new Error(`${filePath}: local header ${localHeaders} is encrypted (plain fixture required)`);
    }
    const extraStart = offset + 30 + nameLen;
    scanExtraFields(buf.subarray(extraStart, extraStart + extraLen), `${filePath} local extra`);
    offset = extraStart + extraLen + compressedSize;
    if (flags & 0x0008) {
      // data descriptor: skip 12 or 16 bytes if present
      if (offset + 4 <= buf.length && buf.readUInt32LE(offset) === 0x08074b50) {
        offset += 16;
      } else {
        offset += 12;
      }
    }
    localHeaders++;
  }

  for (let i = 0; i + 46 <= buf.length; i++) {
    if (buf.readUInt32LE(i) !== CENTRAL_DIRECTORY_HEADER) {
      continue;
    }
    const flags = buf.readUInt16LE(i + 8);
    const nameLen = buf.readUInt16LE(i + 28);
    const extraLen = buf.readUInt16LE(i + 30);
    const commentLen = buf.readUInt16LE(i + 32);
    if (flags & FLAG_ENCRYPTED) {
      throw new Error(`${filePath}: central directory entry is encrypted (plain fixture required)`);
    }
    const extraStart = i + 46 + nameLen;
    if (extraStart + extraLen <= buf.length) {
      scanExtraFields(buf.subarray(extraStart, extraStart + extraLen), `${filePath} central extra`);
    }
    i += 46 + nameLen + extraLen + commentLen - 1;
  }

  if (localHeaders < 1) {
    throw new Error(`${filePath}: no local file headers walked`);
  }
}

function extractWithUnzipper(filePath) {
  let unzipper;
  try {
    unzipper = require('unzipper');
  } catch (err) {
    throw new Error(
      'Node unzipper is not installed. Run `npm install unzipper --no-save` (CI) or add it as a devDependency.'
    );
  }

  return unzipper.Open.file(filePath).then(async (directory) => {
    let files = 0;
    for (const file of directory.files) {
      if (file.type === 'Directory') {
        continue;
      }
      const body = await file.buffer();
      if (!Buffer.isBuffer(body)) {
        throw new Error(`${filePath}: unzipper returned non-buffer for ${file.path}`);
      }
      files++;
    }
    if (files < 1) {
      throw new Error(`${filePath}: Node unzipper extracted 0 file entries`);
    }
    console.log(`OK node unzipper ${filePath} files=${files}`);
  });
}

function extractWithJava(filePath) {
  const javaFile = path.join(__dirname, 'ZipInputStreamCheck.java');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'rnza-zip-interop-'));
  const compile = spawnSync('javac', ['-d', tmp, javaFile], { encoding: 'utf8' });
  if (compile.status !== 0) {
    throw new Error(
      `javac failed:\n${compile.stdout || ''}${compile.stderr || ''}`
    );
  }
  const run = spawnSync('java', ['-cp', tmp, 'ZipInputStreamCheck', filePath], {
    encoding: 'utf8',
  });
  if (run.status !== 0) {
    throw new Error(
      `Java ZipInputStream failed for ${filePath}:\n${run.stdout || ''}${run.stderr || ''}`
    );
  }
  process.stdout.write(run.stdout);
}

async function verifyOne(filePath, { allowAes }) {
  const { buf } = validateZip(filePath);
  if (!allowAes) {
    assertPlainZip(filePath, buf);
  }
  await extractWithUnzipper(filePath);
  extractWithJava(filePath);
}

async function main() {
  const { files, fixtures, expectFail, allowAes } = parseArgs(process.argv.slice(2));
  const targets = fixtures ? defaultFixtures() : files;
  if (targets.length === 0) {
    console.error(
      'Usage: node scripts/verify-zip-interop.js [--fixtures] [--expect-fail] [--allow-aes] <file.zip>...'
    );
    process.exit(2);
  }

  let failed = false;
  for (const file of targets) {
    try {
      await verifyOne(file, { allowAes });
      if (expectFail) {
        console.error(`${file}: expected interop failure, but the archive extracted`);
        failed = true;
      }
    } catch (err) {
      if (expectFail) {
        console.log(`OK expected failure ${file}: ${err.message || err}`);
      } else {
        console.error(String(err.message || err));
        failed = true;
      }
    }
  }
  process.exit(failed ? 1 : 0);
}

if (require.main === module) {
  main().catch((err) => {
    console.error(String(err && err.stack ? err.stack : err));
    process.exit(1);
  });
}

module.exports = { assertPlainZip, WINZIP_AES_EXTRA };
