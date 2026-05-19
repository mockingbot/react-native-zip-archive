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

export const DEFAULT_COMPRESSION = -1;
export const NO_COMPRESSION = 0;
export const BEST_SPEED = 1;
export const BEST_COMPRESSION = 9;

export const unzip = (source, target, charset = "UTF-8") => {
  return getRNZipArchive().unzip(
    normalizeFilePath(source),
    normalizeFilePath(target),
    charset
  );
};

export const isPasswordProtected = (source) => {
  return getRNZipArchive()
    .isPasswordProtected(normalizeFilePath(source))
    .then((isEncrypted) => !!isEncrypted);
};

export const unzipWithPassword = (source, target, password) => {
  return getRNZipArchive().unzipWithPassword(
    normalizeFilePath(source),
    normalizeFilePath(target),
    password
  );
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
