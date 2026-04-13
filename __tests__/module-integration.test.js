const mockRNZipArchive = {
  zip: jest.fn(() => Promise.resolve('/mock/path.zip')),
  zipFolder: jest.fn(() => Promise.resolve('/mock/path.zip')),
  zipFiles: jest.fn(() => Promise.resolve('/mock/path.zip')),
  zipFolderWithPassword: jest.fn(() => Promise.resolve('/mock/path.zip')),
  zipFilesWithPassword: jest.fn(() => Promise.resolve('/mock/path.zip')),
  unzip: jest.fn(() => Promise.resolve('/mock/dest')),
  unzipWithPassword: jest.fn(() => Promise.resolve('/mock/dest')),
  unzipAssets: jest.fn(() => Promise.resolve('/mock/dest')),
  isPasswordProtected: jest.fn(() => Promise.resolve(true)),
  getUncompressedSize: jest.fn(() => Promise.resolve(1024)),
  addListener: jest.fn(),
  removeListeners: jest.fn(),
};

describe('TurboModule Integration', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  test('uses TurboModuleRegistry first', () => {
    const mockTurboModuleRegistry = {
      get: jest.fn(() => mockRNZipArchive),
    };
    const mockNativeModules = {
      RNZipArchive: { ...mockRNZipArchive, __isFallback: true },
    };
    const mockNativeEventEmitter = jest.fn(() => ({
      addListener: jest.fn(() => ({ remove: jest.fn() })),
    }));

    jest.mock('react-native', () => ({
      TurboModuleRegistry: mockTurboModuleRegistry,
      NativeModules: mockNativeModules,
      NativeEventEmitter: mockNativeEventEmitter,
    }));

    const { zip } = require('../index');
    expect(mockTurboModuleRegistry.get).toHaveBeenCalledWith('RNZipArchive');
    zip('/a', '/b');
    expect(mockRNZipArchive.zipFolder).toHaveBeenCalled();
  });

  test('falls back to NativeModules when TurboModule not available', async () => {
    const mockTurboModuleRegistry = {
      get: jest.fn(() => null),
    };
    const mockNativeModules = {
      RNZipArchive: mockRNZipArchive,
    };
    const mockNativeEventEmitter = jest.fn(() => ({
      addListener: jest.fn(() => ({ remove: jest.fn() })),
    }));

    jest.mock('react-native', () => ({
      TurboModuleRegistry: mockTurboModuleRegistry,
      NativeModules: mockNativeModules,
      NativeEventEmitter: mockNativeEventEmitter,
    }));

    const { zip } = require('../index');
    await zip('/a', '/b');
    expect(mockTurboModuleRegistry.get).toHaveBeenCalledWith('RNZipArchive');
    expect(mockRNZipArchive.zipFolder).toHaveBeenCalled();
  });

  test('throws error when module not found', () => {
    const mockTurboModuleRegistry = {
      get: jest.fn(() => null),
    };
    const mockNativeModules = {};
    const mockNativeEventEmitter = jest.fn();

    jest.mock('react-native', () => ({
      TurboModuleRegistry: mockTurboModuleRegistry,
      NativeModules: mockNativeModules,
      NativeEventEmitter: mockNativeEventEmitter,
    }));

    expect(() => require('../index')).toThrow('react-native-zip-archive: Native module not found');
  });
});
