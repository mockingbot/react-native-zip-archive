const { zip, ErrorCodes } = require('../index');
const { mockRNZipArchive } = require('react-native');

/**
 * Public JS API, end to end through zip() → withAbort → the native module.
 * Native zip is mocked; the assertions are about whether this process starts
 * or cancels work.
 */
describe('zip abort end to end', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('signal that aborts while the listener is attached does not start native work', async () => {
    const signal = {
      aborted: false,
      addEventListener() {
        this.aborted = true;
      },
      removeEventListener() {},
    };

    await expect(zip('/source', '/target.zip', { signal })).rejects.toMatchObject({
      name: 'ZipError',
      code: ErrorCodes.CANCELLED,
    });
    expect(mockRNZipArchive.zipFolder).not.toHaveBeenCalled();
    expect(mockRNZipArchive.cancel).not.toHaveBeenCalled();
  });

  test('abort after native work has started cancels that operation', async () => {
    let resolveNative;
    mockRNZipArchive.zipFolder.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveNative = resolve;
      })
    );
    const controller = new AbortController();
    const pending = zip('/source', '/target.zip', { signal: controller.signal });
    await Promise.resolve();

    controller.abort();

    await expect(pending).rejects.toMatchObject({ code: ErrorCodes.CANCELLED });
    expect(mockRNZipArchive.zipFolder).toHaveBeenCalledTimes(1);
    expect(mockRNZipArchive.cancel).toHaveBeenCalledTimes(1);
    resolveNative('/mock/path.zip');
  });
});
