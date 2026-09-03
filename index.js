import {
  NativeEventEmitter,
  NativeModules,
  TurboModuleRegistry,
} from "react-native";

let _RNZipArchive = null;
let _rnzaEmitter = null;

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

export function ZipError(code, message) {
  const err = new Error(message);
  err.name = "ZipError";
  err.code = code;
  return err;
}

function zipError(code, message) {
  return new ZipError(code, message);
}

function getRNZipArchive() {
  if (!_RNZipArchive) {
    // Try TurboModuleRegistry first (New Architecture / Bridgeless)
    _RNZipArchive = TurboModuleRegistry.get("RNZipArchive");

    // Fallback to NativeModules (Old Architecture / Interop)
    if (!_RNZipArchive) {
      _RNZipArchive = NativeModules.RNZipArchive;
    }

    if (!_RNZipArchive) {
      throw zipError(
        ErrorCodes.UNSUPPORTED,
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

function isPlainOptions(value) {
  return value != null && typeof value === "object" && !Array.isArray(value);
}

function withAbort(signal, work) {
  if (!signal) {
    return Promise.resolve().then(work);
  }
  if (signal.aborted) {
    return Promise.reject(
      zipError(ErrorCodes.CANCELLED, "Operation cancelled")
    );
  }

  let settled = false;
  let rejectAbort;
  const abortGate = new Promise((_, reject) => {
    rejectAbort = reject;
  });
  const onAbort = () => {
    cancel().catch(() => {});
    if (!settled) {
      rejectAbort(zipError(ErrorCodes.CANCELLED, "Operation cancelled"));
    }
  };
  signal.addEventListener("abort", onAbort, { once: true });

  const run = Promise.resolve()
    .then(work)
    .then(
      (value) => {
        settled = true;
        return value;
      },
      (err) => {
        settled = true;
        if (signal.aborted) {
          throw zipError(ErrorCodes.CANCELLED, "Operation cancelled");
        }
        throw err;
      }
    );

  return Promise.race([run, abortGate]).finally(() => {
    signal.removeEventListener("abort", onAbort);
    run.catch(() => {});
    abortGate.catch(() => {});
  });
}

function resolveZipOptions(compressionLevelOrOptions) {
  if (isPlainOptions(compressionLevelOrOptions)) {
    const level = compressionLevelOrOptions.compressionLevel;
    return {
      compressionLevel: level === undefined ? DEFAULT_COMPRESSION : level,
      signal: compressionLevelOrOptions.signal,
    };
  }
  return {
    compressionLevel:
      compressionLevelOrOptions === undefined
        ? DEFAULT_COMPRESSION
        : compressionLevelOrOptions,
    signal: undefined,
  };
}

function resolvePasswordOptions(encryptionMethod, compressionLevel) {
  if (isPlainOptions(encryptionMethod)) {
    return {
      encryptionMethod: encryptionMethod.encryptionMethod ?? "",
      compressionLevel:
        encryptionMethod.compressionLevel === undefined
          ? DEFAULT_COMPRESSION
          : encryptionMethod.compressionLevel,
      signal: encryptionMethod.signal,
    };
  }
  return {
    encryptionMethod: encryptionMethod ?? "",
    compressionLevel:
      compressionLevel === undefined ? DEFAULT_COMPRESSION : compressionLevel,
    signal: undefined,
  };
}

function resolveUnzipArgs(charsetOrEntries, entries) {
  if (isPlainOptions(charsetOrEntries)) {
    const selected = charsetOrEntries.entries;
    if (selected !== undefined && selected !== null) {
      if (!Array.isArray(selected) || selected.length === 0) {
        return {
          error: zipError(
            ErrorCodes.INVALID_ARGS,
            "unzip: entries must be a non-empty array when provided"
          ),
        };
      }
    }
    return {
      charset: charsetOrEntries.charset ?? "UTF-8",
      entries: selected ?? null,
      signal: charsetOrEntries.signal,
    };
  }

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
        error: zipError(
          ErrorCodes.INVALID_ARGS,
          "unzip: entries must be a non-empty array when provided"
        ),
      };
    }
  } else {
    selected = null;
  }
  return { charset, entries: selected, signal: undefined };
}

export const unzip = (source, target, charsetOrEntries = "UTF-8", entries) => {
  const resolved = resolveUnzipArgs(charsetOrEntries, entries);
  if (resolved.error) {
    return Promise.reject(resolved.error);
  }
  return withAbort(resolved.signal, () =>
    getRNZipArchive().unzip(
      normalizeFilePath(source),
      normalizeFilePath(target),
      resolved.charset,
      resolved.entries
    )
  );
};

export const isPasswordProtected = (source) => {
  return getRNZipArchive()
    .isPasswordProtected(normalizeFilePath(source))
    .then((isEncrypted) => !!isEncrypted);
};

export const unzipWithPassword = (source, target, password, entries) => {
  let selected = entries;
  let signal;
  if (isPlainOptions(entries)) {
    selected = entries.entries;
    signal = entries.signal;
  }
  if (selected !== undefined && selected !== null) {
    if (!Array.isArray(selected) || selected.length === 0) {
      return Promise.reject(
        zipError(
          ErrorCodes.INVALID_ARGS,
          "unzipWithPassword: entries must be a non-empty array when provided"
        )
      );
    }
  }
  return withAbort(signal, () =>
    getRNZipArchive().unzipWithPassword(
      normalizeFilePath(source),
      normalizeFilePath(target),
      password,
      selected ?? null
    )
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
  const options = resolvePasswordOptions(encryptionMethod, compressionLevel);
  const RNZipArchive = getRNZipArchive();
  return withAbort(options.signal, () =>
    Array.isArray(source)
      ? RNZipArchive.zipFilesWithPassword(
          source.map(normalizeFilePath),
          normalizeFilePath(target),
          password,
          options.encryptionMethod,
          options.compressionLevel
        )
      : RNZipArchive.zipFolderWithPassword(
          normalizeFilePath(source),
          normalizeFilePath(target),
          password,
          options.encryptionMethod,
          options.compressionLevel
        )
  );
};

export const zip = (source, target, compressionLevelOrOptions) => {
  const options = resolveZipOptions(compressionLevelOrOptions);
  const RNZipArchive = getRNZipArchive();
  return withAbort(options.signal, () =>
    Array.isArray(source)
      ? RNZipArchive.zipFiles(
          source.map(normalizeFilePath),
          normalizeFilePath(target),
          options.compressionLevel
        )
      : RNZipArchive.zipFolder(
          normalizeFilePath(source),
          normalizeFilePath(target),
          options.compressionLevel
        )
  );
};

export const unzipAssets = (source, target, options) => {
  const RNZipArchive = getRNZipArchive();
  if (!RNZipArchive.unzipAssets) {
    throw zipError(
      ErrorCodes.UNSUPPORTED,
      "unzipAssets not supported on this platform"
    );
  }

  const signal = isPlainOptions(options) ? options.signal : undefined;
  return withAbort(signal, () =>
    RNZipArchive.unzipAssets(
      normalizeFilePath(source),
      normalizeFilePath(target)
    )
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
