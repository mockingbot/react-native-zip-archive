declare module "react-native-zip-archive" {
  enum EncryptionMethods {
    STANDARD = "STANDARD",
    AES_128 = "AES-128",
    AES_256 = "AES-256",
  }
  import { NativeEventSubscription } from "react-native";
  export const DEFAULT_COMPRESSION: number;
  export const NO_COMPRESSION: number;
  export const BEST_SPEED: number;
  export const BEST_COMPRESSION: number;
  export function isPasswordProtected(source: string): Promise<boolean>;
  export function zip(
    source: string | string[],
    target: string,
    compressionLevel: number = DEFAULT_COMPRESSION
  ): Promise<string>;
  export function zipWithPassword(
    source: string | string[],
    target: string,
    password: string,
    encryptionMethod?: EncryptionMethods,
    compressionLevel: number = DEFAULT_COMPRESSION
  ): Promise<string>;
  export function unzip(source: string, target: string, charset?: string): Promise<string>;
  export function unzipWithPassword(assetPath: string, target: string, password: string): Promise<string>;
  export function unzipAssets(assetPath: string, target: string): Promise<string>;
  export function subscribe(callback: ({ progress, filePath }: { progress: number, filePath: string }) => void): NativeEventSubscription;
  export function getUncompressedSize(source: string, charset?: string): Promise<number>;
}
