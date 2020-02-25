import ReactNative from "react-native";

const { NativeEventEmitter, NativeModules } = ReactNative;

const RNZipArchive = NativeModules.RNZipArchive;

const rnzaEmitter = new NativeEventEmitter(RNZipArchive);

export const unzip = (source, target, charset = "UTF-8") => {
  return RNZipArchive.unzip(source, target, charset);
};
export const isPasswordProtected = source => {
  return RNZipArchive.isPasswordProtected(source).then(
    isEncrypted => !!isEncrypted
  );
};

export const unzipWithPassword = (source, target, password) => {
  return RNZipArchive.unzipWithPassword(source, target, password);
};

export const zipWithPassword = (
  source,
  target,
  password,
  encryptionMethod = ""
) => {
  return RNZipArchive.zipWithPassword(
    source,
    target,
    password,
    encryptionMethod
  );
};

export const zip = (source, target) => {
  return RNZipArchive.zip(source, target);
};

export const unzipAssets = (source, target) => {
  if (!RNZipArchive.unzipAssets) {
    throw new Error("unzipAssets not supported on this platform");
  }

  return RNZipArchive.unzipAssets(source, target);
};

export const subscribe = callback => {
  return rnzaEmitter.addListener("zipArchiveProgressEvent", callback);
};
