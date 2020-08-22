declare module 'react-native-zip-archive' {
  enum encryptionMethods {
    'STANDARD',
    'AES-128',
    'AES-256'
  }
  import { NativeEventSubscription } from 'react-native';
  export function isPasswordProtected(source: string): Promise<boolean>;
  export function zip(source: string | string[], target: string): Promise<string>;
  export function zipWithPassword(source: string | string[], target: string, password: string, encryptionMethod?: encryptionMethods): Promise<string>;
  export function unzip(source: string, target: string, charset?: string): Promise<string>;
  export function unzipWithPassword(assetPath: string, target: string, password: string): Promise<string>;
  export function unzipAssets(assetPath: string, target: string): Promise<string>;
  export function subscribe(callback: ({ progress, filePath }: { progress: number, filePath: string }) => void): NativeEventSubscription;
}
