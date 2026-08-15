import {
  NativeEventEmitter,
  NativeModules,
  TurboModuleRegistry,
} from "react-native";

let _RNZipArchive = null;
let _rnzaEmitter = null;

function getRNZipArchive() {
  if (!_RNZipArchive) {
    // Try TurboModuleRegistry first (New Architecture / Bridgeless)
    _RNZipArchive = TurboModuleRegistry.get("RNZipArchive");

    // Fallback to NativeModules (Old Architecture / Interop)
    if (!_RNZipArchive) {
      _RNZipArchive = NativeModules.RNZipArchive;
    }

    if (!_RNZipArchive) {
      throw new Error(
        "react-native-zip-archive: Native module not found. " +
          "Please ensure the library is properly linked and you are using React Native >= 0.70.0"
      );
    }
    _rnzaEmitter = new NativeEventEmitter(_RNZipArchive);
  }
  return _RNZipArchive;
}

const normalizeFilePath = (path) =>
  path.startsWith("file://") ? path.slice(7) : path;

export const EncryptionMethods = {
  STANDARD: "STANDARD",
  AES_128: "AES-128",
  AES_256: "AES-256",
};

export const ErrorCodes = {
  FILE_NOT_FOUND: "ERR_FILE_NOT_FOUND",
  INVALID_PATH: "ERR_INVALID_PATH",
  INVALID_ARGS: "ERR_INVALID_ARGS",
  WRONG_PASSWORD: "ERR_WRONG_PASSWORD",
  NOT_PASSWORD_PROTECTED: "ERR_NOT_PASSWORD_PROTECTED",
  CORRUPT_ARCHIVE: "ERR_CORRUPT_ARCHIVE",
  UNSAFE_PATH: "ERR_UNSAFE_PATH",
  CANCELLED: "ERR_CANCELLED",
  BUSY: "ERR_BUSY",
  ZIP: "ERR_ZIP",
  UNZIP: "ERR_UNZIP",
  UNSUPPORTED: "ERR_UNSUPPORTED",
};

export const DEFAULT_COMPRESSION = -1;
export const NO_COMPRESSION = 0;
export const BEST_SPEED = 1;
export const BEST_COMPRESSION = 9;

function resolveUnzipArgs(charsetOrEntries, entries) {
  let charset = "UTF-8";
  let selected = entries;
  if (Array.isArray(charsetOrEntries)) {
    selected = charsetOrEntries;
  } else if (charsetOrEntries != null && charsetOrEntries !== "") {
    charset = charsetOrEntries;
  }
  if (selected !== undefined && selected !== null) {
    if (!Array.isArray(selected) || selected.length === 0) {
      return {
        error: new Error(
          "unzip: entries must be a non-empty array when provided"
        ),
      };
    }
  } else {
    selected = null;
  }
  return { charset, entries: selected };
}

export const unzip = (source, target, charsetOrEntries = "UTF-8", entries) => {
  const resolved = resolveUnzipArgs(charsetOrEntries, entries);
  if (resolved.error) {
    return Promise.reject(resolved.error);
  }
  return getRNZipArchive().unzip(
    normalizeFilePath(source),
    normalizeFilePath(target),
    resolved.charset,
    resolved.entries
  );
};

export const isPasswordProtected = (source) => {
  return getRNZipArchive()
    .isPasswordProtected(normalizeFilePath(source))
    .then((isEncrypted) => !!isEncrypted);
};

export const unzipWithPassword = (source, target, password, entries) => {
  if (entries !== undefined && entries !== null) {
    if (!Array.isArray(entries) || entries.length === 0) {
      return Promise.reject(
        new Error(
          "unzipWithPassword: entries must be a non-empty array when provided"
        )
      );
    }
  }
  return getRNZipArchive().unzipWithPassword(
    normalizeFilePath(source),
    normalizeFilePath(target),
    password,
    entries ?? null
  );
};

export const listContents = (source, charset = "UTF-8") => {
  return getRNZipArchive().listContents(normalizeFilePath(source), charset);
};

export const zipWithPassword = (
  source,
  target,
  password,
  encryptionMethod = "",
  compressionLevel = DEFAULT_COMPRESSION
) => {
  const RNZipArchive = getRNZipArchive();
  return Array.isArray(source)
    ? RNZipArchive.zipFilesWithPassword(
        source.map(normalizeFilePath),
        normalizeFilePath(target),
        password,
        encryptionMethod,
        compressionLevel
      )
    : RNZipArchive.zipFolderWithPassword(
        normalizeFilePath(source),
        normalizeFilePath(target),
        password,
        encryptionMethod,
        compressionLevel
      );
};

export const zip = (source, target, compressionLevel = DEFAULT_COMPRESSION) => {
  const RNZipArchive = getRNZipArchive();
  return Array.isArray(source)
    ? RNZipArchive.zipFiles(
        source.map(normalizeFilePath),
        normalizeFilePath(target),
        compressionLevel
      )
    : RNZipArchive.zipFolder(
        normalizeFilePath(source),
        normalizeFilePath(target),
        compressionLevel
      );
};

export const unzipAssets = (source, target) => {
  const RNZipArchive = getRNZipArchive();
  if (!RNZipArchive.unzipAssets) {
    throw new Error("unzipAssets not supported on this platform");
  }

  return RNZipArchive.unzipAssets(
    normalizeFilePath(source),
    normalizeFilePath(target)
  );
};

export const subscribe = (callback) => {
  getRNZipArchive();
  return _rnzaEmitter.addListener("zipArchiveProgressEvent", callback);
};

export const getUncompressedSize = (source, charset = "UTF-8") => {
  return getRNZipArchive().getUncompressedSize(
    normalizeFilePath(source),
    charset
  );
};

export const cancel = () => {
  return getRNZipArchive().cancel();
};
