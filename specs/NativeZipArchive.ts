import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  isPasswordProtected(file: string): Promise<boolean>;
  unzip(from: string, destinationPath: string, charset: string): Promise<string>;
  unzipWithPassword(
    from: string,
    destinationPath: string,
    password: string
  ): Promise<string>;
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
