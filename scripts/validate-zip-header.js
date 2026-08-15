#!/usr/bin/env node
/**
 * Lightweight ZIP interoperability check for archives produced by this library.
 *
 * Validates:
 *  - local file header signature 0x04034b50
 *  - end-of-central-directory signature 0x06054b50
 *
 * Usage: node scripts/validate-zip-header.js <file.zip> [more.zip ...]
 */
const fs = require('fs');

const LOCAL_FILE_HEADER = 0x04034b50;
const END_OF_CENTRAL_DIR = 0x06054b50;

function readUInt32LE(buf, offset) {
  return buf.readUInt32LE(offset);
}

function validateZip(filePath) {
  const buf = fs.readFileSync(filePath);
  if (buf.length < 22) {
    throw new Error(`${filePath}: file too small to be a zip (${buf.length} bytes)`);
  }

  const localSig = readUInt32LE(buf, 0);
  if (localSig !== LOCAL_FILE_HEADER) {
    throw new Error(
      `${filePath}: bad local header signature 0x${localSig.toString(16)} (expected 0x04034b50)`
    );
  }

  // EOCD is at the end; comment can make it earlier. Scan last 64KiB.
  const scanFrom = Math.max(0, buf.length - 65557);
  let eocd = -1;
  for (let i = buf.length - 22; i >= scanFrom; i--) {
    if (readUInt32LE(buf, i) === END_OF_CENTRAL_DIR) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) {
    throw new Error(`${filePath}: end-of-central-directory signature not found`);
  }

  console.log(`OK ${filePath} (local=0x04034b50, eocd@${eocd})`);
}

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error('Usage: node scripts/validate-zip-header.js <file.zip>...');
  process.exit(2);
}

let failed = false;
for (const file of files) {
  try {
    validateZip(file);
  } catch (err) {
    console.error(String(err.message || err));
    failed = true;
  }
}
process.exit(failed ? 1 : 0);
