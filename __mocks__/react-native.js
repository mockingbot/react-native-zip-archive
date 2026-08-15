const mockRNZipArchive = {
  zip: jest.fn(() => Promise.resolve('/mock/path.zip')),
  zipFolder: jest.fn(() => Promise.resolve('/mock/path.zip')),
  zipFiles: jest.fn(() => Promise.resolve('/mock/path.zip')),
  zipFolderWithPassword: jest.fn(() => Promise.resolve('/mock/path.zip')),
  zipFilesWithPassword: jest.fn(() => Promise.resolve('/mock/path.zip')),
  unzip: jest.fn(() => Promise.resolve('/mock/dest')),
  unzipWithPassword: jest.fn(() => Promise.resolve('/mock/dest')),
  listContents: jest.fn(() =>
    Promise.resolve([
      {
        path: 'hello.txt',
        size: 12,
        compressedSize: 10,
        isDirectory: false,
        isEncrypted: false,
      },
    ])
  ),
  unzipAssets: jest.fn(() => Promise.resolve('/mock/dest')),
  isPasswordProtected: jest.fn(() => Promise.resolve(true)),
  getUncompressedSize: jest.fn(() => Promise.resolve(1024)),
  cancel: jest.fn(() => Promise.resolve()),
  addListener: jest.fn(),
  removeListeners: jest.fn(),
};

const TurboModuleRegistry = {
  get: jest.fn(() => mockRNZipArchive),
};

const NativeModules = {
  RNZipArchive: mockRNZipArchive,
};

const NativeEventEmitter = jest.fn(() => ({
  addListener: jest.fn(() => ({ remove: jest.fn() })),
}));

module.exports = {
  __esModule: true,
  default: { TurboModuleRegistry, NativeModules, NativeEventEmitter },
  TurboModuleRegistry,
  NativeModules,
  NativeEventEmitter,
};

module.exports.mockRNZipArchive = mockRNZipArchive;
