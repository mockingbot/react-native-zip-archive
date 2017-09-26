package com.rnziparchive;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;

import static com.facebook.common.internal.Preconditions.checkNotNull;

public class StreamUtil {
  private static final int BUF_SIZE = 0x1000; // 4K

  public interface ProgressCallback {
    // not the total - the actual number read since last time
    void onCopyProgress(long bytesRead);
  }

  // https://stackoverflow.com/questions/4919690/how-to-read-one-stream-into-another
  public static long copy(InputStream from, OutputStream to, ProgressCallback callback) throws IOException {
    checkNotNull(from);
    checkNotNull(to);
    byte[] buf = new byte[BUF_SIZE];
    long total = 0;
    while (true) {
      int r = from.read(buf);
      if (r == -1) {
        break;
      }
      to.write(buf, 0, r);
      total += r;

      if (callback != null) {
        callback.onCopyProgress(r);
      }
    }
    return total;
  }
}
