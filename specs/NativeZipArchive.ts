import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export type ZipEntry = {
  path: string;
  size: number;
  compressedSize: number;
  isDirectory: boolean;
  isEncrypted: boolean;
};

export interface Spec extends TurboModule {
  isPasswordProtected(file: string): Promise<boolean>;
  unzip(from: string, destinationPath: string, charset: string): Promise<string>;
  unzipWithPassword(
    from: string,
    destinationPath: string,
    password: string
  ): Promise<string>;
  unzipFiles(
    from: string,
    destinationPath: string,
    entries: string[],
    charset: string
  ): Promise<string>;
  unzipFilesWithPassword(
    from: string,
    destinationPath: string,
    entries: string[],
    password: string
  ): Promise<string>;
  listContents(source: string, charset: string): Promise<ZipEntry[]>;
  zipFolder(
    from: string,
    destinationPath: string,
    compressionLevel: number
  ): Promise<string>;
  zipFiles(
    from: string[],
    destinationPath: string,
    compressionLevel: number
  ): Promise<string>;
  zipFolderWithPassword(
    from: string,
    destinationPath: string,
    password: string,
    encryptionType: string,
    compressionLevel: number
  ): Promise<string>;
  zipFilesWithPassword(
    from: string[],
    destinationPath: string,
    password: string,
    encryptionType: string,
    compressionLevel: number
  ): Promise<string>;
  getUncompressedSize(path: string, charset: string): Promise<number>;
  unzipAssets(source: string, target: string): Promise<string>;
  addListener(eventName: string): void;
  removeListeners(count: number): void;
}

export default TurboModuleRegistry.getEnforcing<Spec>('RNZipArchive');
