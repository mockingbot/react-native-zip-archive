import ReactNative from "react-native";

const { NativeEventEmitter, NativeModules } = ReactNative;

const RNZipArchive = NativeModules.RNZipArchive;

const rnzaEmitter = new NativeEventEmitter(RNZipArchive);

const normalizeFilePath = (path) =>
  path.startsWith("file://") ? path.slice(7) : path;

export const DEFAULT_COMPRESSION = -1;
export const NO_COMPRESSION = 0;
export const BEST_SPEED = 1;
export const BEST_COMPRESSION = 9;

export const unzip = (source, target, charset = "UTF-8") => {
  return RNZipArchive.unzip(
    normalizeFilePath(source),
    normalizeFilePath(target),
    charset
  );
};

export const isPasswordProtected = (source) => {
  return RNZipArchive.isPasswordProtected(normalizeFilePath(source)).then(
    (isEncrypted) => !!isEncrypted
  );
};

export const unzipWithPassword = (source, target, password) => {
  return RNZipArchive.unzipWithPassword(
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
  compressionLevel = DEFAULT_COMPRESSION,
) => {
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
  if (!RNZipArchive.unzipAssets) {
    throw new Error("unzipAssets not supported on this platform");
  }

  return RNZipArchive.unzipAssets(
    normalizeFilePath(source),
    normalizeFilePath(target)
  );
};

export const subscribe = (callback) => {
  return rnzaEmitter.addListener("zipArchiveProgressEvent", callback);
};

export const getUncompressedSize = (source, charset = "UTF-8") => {
  return RNZipArchive.getUncompressedSize(normalizeFilePath(source), charset);
};
