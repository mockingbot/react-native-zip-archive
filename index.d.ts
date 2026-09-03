export const EncryptionMethods: {
  readonly STANDARD: "STANDARD";
  readonly AES_128: "AES-128";
  readonly AES_256: "AES-256";
};

export const ErrorCodes: {
  readonly FILE_NOT_FOUND: "ERR_FILE_NOT_FOUND";
  readonly INVALID_PATH: "ERR_INVALID_PATH";
  readonly INVALID_ARGS: "ERR_INVALID_ARGS";
  readonly WRONG_PASSWORD: "ERR_WRONG_PASSWORD";
  readonly NOT_PASSWORD_PROTECTED: "ERR_NOT_PASSWORD_PROTECTED";
  readonly CORRUPT_ARCHIVE: "ERR_CORRUPT_ARCHIVE";
  readonly UNSAFE_PATH: "ERR_UNSAFE_PATH";
  readonly CANCELLED: "ERR_CANCELLED";
  readonly BUSY: "ERR_BUSY";
  readonly ZIP: "ERR_ZIP";
  readonly UNZIP: "ERR_UNZIP";
  readonly UNSUPPORTED: "ERR_UNSUPPORTED";
};

export type ZipErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

/** Runtime is a factory (not an ES class) so Metro does not inject @babel/runtime helpers. */
export function ZipError(code: ZipErrorCode, message: string): Error & {
  name: "ZipError";
  code: ZipErrorCode;
};

export const DEFAULT_COMPRESSION: -1;
export const NO_COMPRESSION: 0;
export const BEST_SPEED: 1;
export const BEST_COMPRESSION: 9;

export type ZipEntry = {
  path: string;
  size: number;
  compressedSize: number;
  isDirectory: boolean;
  isEncrypted: boolean;
};

export type ZipProgressEvent = {
  progress: number;
  filePath: string;
};

export type ZipSubscription = {
  remove: () => void;
};

export type Abortable = {
  signal?: AbortSignal;
};

export type ZipOptions = Abortable & {
  compressionLevel?: number;
};

export type ZipPasswordOptions = ZipOptions & {
  encryptionMethod?: "STANDARD" | "AES-128" | "AES-256" | "";
};

export type UnzipOptions = Abortable & {
  charset?: string;
  entries?: string[];
};

export type UnzipPasswordOptions = Abortable & {
  entries?: string[];
};

export function isPasswordProtected(source: string): Promise<boolean>;

export function zip(
  source: string | string[],
  target: string,
  compressionLevel?: number
): Promise<string>;
export function zip(
  source: string | string[],
  target: string,
  options: ZipOptions
): Promise<string>;

export function zipWithPassword(
  source: string | string[],
  target: string,
  password: string,
  encryptionMethod?: string,
  compressionLevel?: number
): Promise<string>;
export function zipWithPassword(
  source: string | string[],
  target: string,
  password: string,
  options: ZipPasswordOptions
): Promise<string>;

/**
 * Unzip an archive. Pass `entries` to extract only those paths
 * (directories include nested children). When using `entries`, you may
 * omit charset (`unzip(src, dest, ['a.txt'])`), pass it explicitly
 * (`unzip(src, dest, 'GBK', ['a.txt'])`), or use an options object
 * (`unzip(src, dest, { entries, signal })`).
 */
export function unzip(
  source: string,
  target: string,
  charset?: string | string[],
  entries?: string[]
): Promise<string>;
export function unzip(
  source: string,
  target: string,
  options: UnzipOptions
): Promise<string>;

/**
 * Unzip a password-protected archive. Pass `entries` to extract only
 * those paths, or `{ entries, signal }`.
 */
export function unzipWithPassword(
  source: string,
  target: string,
  password: string,
  entries?: string[] | UnzipPasswordOptions
): Promise<string>;

export function unzipAssets(
  assetPath: string,
  target: string,
  options?: Abortable
): Promise<string>;

export function listContents(
  source: string,
  charset?: string
): Promise<ZipEntry[]>;

export function subscribe(
  callback: (event: ZipProgressEvent) => void
): ZipSubscription;

export function getUncompressedSize(
  source: string,
  charset?: string
): Promise<number>;

export function cancel(): Promise<void>;
