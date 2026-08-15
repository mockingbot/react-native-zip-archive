import { NativeEventSubscription } from "react-native";

declare module "react-native-zip-archive" {
  export enum EncryptionMethods {
    STANDARD = "STANDARD",
    AES_128 = "AES-128",
    AES_256 = "AES-256",
  }

  export const DEFAULT_COMPRESSION: number;
  export const NO_COMPRESSION: number;
  export const BEST_SPEED: number;
  export const BEST_COMPRESSION: number;

  export function isPasswordProtected(source: string): Promise<boolean>;

  export function zip(
    source: string | string[],
    target: string,
    compressionLevel?: number
  ): Promise<string>;

  export function zipWithPassword(
    source: string | string[],
    target: string,
    password: string,
    encryptionMethod?: EncryptionMethods,
    compressionLevel?: number
  ): Promise<string>;

  /**
   * Unzip an archive. Pass `entries` to extract only those paths
   * (directories include nested children). When using `entries`, you may
   * omit charset (`unzip(src, dest, ['a.txt'])`) or pass it explicitly
   * (`unzip(src, dest, 'GBK', ['a.txt'])`).
   */
  export function unzip(
    source: string,
    target: string,
    charset?: string | string[],
    entries?: string[]
  ): Promise<string>;

  /**
   * Unzip a password-protected archive. Pass `entries` to extract only
   * those paths (directories include nested children).
   */
  export function unzipWithPassword(
    source: string,
    target: string,
    password: string,
    entries?: string[]
  ): Promise<string>;

  export function unzipAssets(assetPath: string, target: string): Promise<string>;

  export type ZipEntry = {
    path: string;
    size: number;
    compressedSize: number;
    isDirectory: boolean;
    isEncrypted: boolean;
  };

  export function listContents(source: string, charset?: string): Promise<ZipEntry[]>;

  export function subscribe(
    callback: ({ progress, filePath }: { progress: number; filePath: string }) => void
  ): NativeEventSubscription;

  export function getUncompressedSize(source: string, charset?: string): Promise<number>;
}
