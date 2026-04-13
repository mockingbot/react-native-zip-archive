const {
  zip,
  zipWithPassword,
  unzip,
  unzipWithPassword,
  unzipAssets,
  isPasswordProtected,
  getUncompressedSize,
  subscribe,
  DEFAULT_COMPRESSION,
  NO_COMPRESSION,
  BEST_SPEED,
  BEST_COMPRESSION,
} = require('../index');

const { mockRNZipArchive } = require('react-native');

describe('react-native-zip-archive API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('exports all functions', () => {
    expect(typeof zip).toBe('function');
    expect(typeof zipWithPassword).toBe('function');
    expect(typeof unzip).toBe('function');
    expect(typeof unzipWithPassword).toBe('function');
    expect(typeof unzipAssets).toBe('function');
    expect(typeof isPasswordProtected).toBe('function');
    expect(typeof getUncompressedSize).toBe('function');
    expect(typeof subscribe).toBe('function');
  });

  test('exports compression constants', () => {
    expect(DEFAULT_COMPRESSION).toBe(-1);
    expect(NO_COMPRESSION).toBe(0);
    expect(BEST_SPEED).toBe(1);
    expect(BEST_COMPRESSION).toBe(9);
  });

  describe('zip', () => {
    test('zip resolves with target path', async () => {
      const result = await zip('/source', '/target.zip');
      expect(result).toBe('/mock/path.zip');
      expect(mockRNZipArchive.zipFolder).toHaveBeenCalledWith('/source', '/target.zip', -1);
    });

    test('zip normalizes file:// paths', async () => {
      await zip('file:///source', 'file:///target.zip');
      expect(mockRNZipArchive.zipFolder).toHaveBeenCalledWith('/source', '/target.zip', -1);
    });

    test('zip files array passes normalized paths', async () => {
      await zip(['file:///a', 'file:///b'], '/target.zip');
      expect(mockRNZipArchive.zipFiles).toHaveBeenCalledWith(['/a', '/b'], '/target.zip', -1);
    });

    test('zip with custom compression level', async () => {
      await zip('/source', '/target.zip', BEST_COMPRESSION);
      expect(mockRNZipArchive.zipFolder).toHaveBeenCalledWith('/source', '/target.zip', 9);
    });
  });

  describe('zipWithPassword', () => {
    test('zipWithPassword with folder', async () => {
      await zipWithPassword('/folder', '/out.zip', 'pass', 'AES-256');
      expect(mockRNZipArchive.zipFolderWithPassword).toHaveBeenCalledWith('/folder', '/out.zip', 'pass', 'AES-256', -1);
    });

    test('zipWithPassword with files array', async () => {
      await zipWithPassword(['/a', '/b'], '/out.zip', 'pass');
      expect(mockRNZipArchive.zipFilesWithPassword).toHaveBeenCalledWith(['/a', '/b'], '/out.zip', 'pass', '', -1);
    });

    test('zipWithPassword normalizes file:// paths', async () => {
      await zipWithPassword('file:///folder', 'file:///out.zip', 'pass');
      expect(mockRNZipArchive.zipFolderWithPassword).toHaveBeenCalledWith('/folder', '/out.zip', 'pass', '', -1);
    });
  });

  describe('unzip', () => {
    test('unzip with default charset', async () => {
      await unzip('/source.zip', '/dest');
      expect(mockRNZipArchive.unzip).toHaveBeenCalledWith('/source.zip', '/dest', 'UTF-8');
    });

    test('unzip with custom charset', async () => {
      await unzip('/source.zip', '/dest', 'GBK');
      expect(mockRNZipArchive.unzip).toHaveBeenCalledWith('/source.zip', '/dest', 'GBK');
    });

    test('unzip normalizes file:// paths', async () => {
      await unzip('file:///source.zip', 'file:///dest');
      expect(mockRNZipArchive.unzip).toHaveBeenCalledWith('/source.zip', '/dest', 'UTF-8');
    });
  });

  describe('unzipWithPassword', () => {
    test('unzipWithPassword calls native module', async () => {
      await unzipWithPassword('/source.zip', '/dest', 'password');
      expect(mockRNZipArchive.unzipWithPassword).toHaveBeenCalledWith('/source.zip', '/dest', 'password');
    });

    test('unzipWithPassword normalizes file:// paths', async () => {
      await unzipWithPassword('file:///source.zip', 'file:///dest', 'password');
      expect(mockRNZipArchive.unzipWithPassword).toHaveBeenCalledWith('/source.zip', '/dest', 'password');
    });
  });

  describe('isPasswordProtected', () => {
    test('isPasswordProtected coerces to boolean', async () => {
      mockRNZipArchive.isPasswordProtected.mockResolvedValueOnce(1);
      const result = await isPasswordProtected('/file.zip');
      expect(result).toBe(true);
    });

    test('isPasswordProtected coerces falsy to boolean', async () => {
      mockRNZipArchive.isPasswordProtected.mockResolvedValueOnce(0);
      const result = await isPasswordProtected('/file.zip');
      expect(result).toBe(false);
    });

    test('isPasswordProtected normalizes file:// paths', async () => {
      await isPasswordProtected('file:///file.zip');
      expect(mockRNZipArchive.isPasswordProtected).toHaveBeenCalledWith('/file.zip');
    });
  });

  describe('getUncompressedSize', () => {
    test('getUncompressedSize with default charset', async () => {
      const result = await getUncompressedSize('/file.zip');
      expect(result).toBe(1024);
      expect(mockRNZipArchive.getUncompressedSize).toHaveBeenCalledWith('/file.zip', 'UTF-8');
    });

    test('getUncompressedSize with custom charset', async () => {
      await getUncompressedSize('/file.zip', 'GBK');
      expect(mockRNZipArchive.getUncompressedSize).toHaveBeenCalledWith('/file.zip', 'GBK');
    });

    test('getUncompressedSize normalizes file:// paths', async () => {
      await getUncompressedSize('file:///file.zip');
      expect(mockRNZipArchive.getUncompressedSize).toHaveBeenCalledWith('/file.zip', 'UTF-8');
    });
  });

  describe('unzipAssets', () => {
    test('unzipAssets calls native module', async () => {
      const result = await unzipAssets('/assets/source.zip', '/dest');
      expect(result).toBe('/mock/dest');
      expect(mockRNZipArchive.unzipAssets).toHaveBeenCalledWith('/assets/source.zip', '/dest');
    });

    test('unzipAssets normalizes file:// paths', async () => {
      await unzipAssets('file:///assets/source.zip', 'file:///dest');
      expect(mockRNZipArchive.unzipAssets).toHaveBeenCalledWith('/assets/source.zip', '/dest');
    });

    test('unzipAssets throws when not supported', () => {
      const originalUnzipAssets = mockRNZipArchive.unzipAssets;
      mockRNZipArchive.unzipAssets = undefined;

      expect(() => unzipAssets('/assets/source.zip', '/dest')).toThrow(
        'unzipAssets not supported on this platform'
      );

      mockRNZipArchive.unzipAssets = originalUnzipAssets;
    });
  });

  describe('subscribe', () => {
    test('subscribe returns subscription with remove method', () => {
      const sub = subscribe(() => {});
      expect(typeof sub.remove).toBe('function');
    });
  });
});
