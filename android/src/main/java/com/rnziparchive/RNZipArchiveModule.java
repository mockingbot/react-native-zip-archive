package com.rnziparchive;

import android.content.res.AssetFileDescriptor;
import android.util.Log;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import java.io.BufferedOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

public class RNZipArchiveModule extends ReactContextBaseJavaModule {
  private static final String TAG = RNZipArchiveModule.class.getSimpleName();

  private static final int BUFFER_SIZE = 4096;
  private static final String PROGRESS_EVENT_NAME = "zipArchiveProgressEvent";
  private static final String EVENT_KEY_FILENAME = "filename";
  private static final String EVENT_KEY_PROGRESS = "progress";

  public RNZipArchiveModule(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @Override
  public String getName() {
    return "RNZipArchive";
  }

  @ReactMethod
  public void unzip(String zipFilePath, String destDirectory, Callback callback) {
    FileInputStream inputStream;
    File file;
    try {
      inputStream = new FileInputStream(zipFilePath);
      file = new File(zipFilePath);
    } catch (FileNotFoundException | NullPointerException e) {
      callback.invoke(makeErrorPayload("Couldn't open file " + zipFilePath + ". ", e));
      return;
    }
    unzipStream(zipFilePath, destDirectory, inputStream, file.length(), callback);
  }

  @ReactMethod
  public void unzipAssets(String assetsPath, String destDirectory, Callback completionCallback) {
    InputStream assetsInputStream;
    long size;

    try {
      assetsInputStream = getReactApplicationContext().getAssets().open(assetsPath);
      AssetFileDescriptor fileDescriptor = getReactApplicationContext().getAssets().openFd(assetsPath);
      size = fileDescriptor.getLength();
    } catch (IOException e) {
      completionCallback.invoke(makeErrorPayload(String.format("Asset file `%s` could not be opened", assetsPath), e));
      return;
    }

    unzipStream(assetsPath, destDirectory, assetsInputStream, size, completionCallback);
  }

  private void unzipStream(String zipFilePath, String destDirectory, InputStream inputStream, long totalSize, Callback completionCallback) {
    try {
      File destDir = new File(destDirectory);
      if (!destDir.exists()) {
        destDir.mkdir();
      }
      ZipInputStream zipIn = new ZipInputStream(inputStream);
      ZipEntry entry = zipIn.getNextEntry();

      long extractedBytes = 0;

      updateProgress(0, 1, zipFilePath); // force 0%

      // iterates over entries in the zip file
      while (entry != null) {
        String filePath = destDirectory + File.separator + entry.getName();
        if (!entry.isDirectory()) {
          // if the entry is a file, extracts it
          extractFile(zipIn, filePath);
        } else {
          // if the entry is a directory, make the directory
          File dir = new File(filePath);
          dir.mkdir();
        }

        zipIn.closeEntry();

        // Count number of bytes of the ZIP we've processed
        long compressedSize = entry.getCompressedSize();
        if (compressedSize != -1) {
          extractedBytes += compressedSize;
          updateProgress(extractedBytes, totalSize, zipFilePath); // send X% done
        }

        entry = zipIn.getNextEntry();
      }
      updateProgress(1, 1, zipFilePath); // force 100%
      zipIn.close();
      completionCallback.invoke(null, null);
    } catch (Exception ex) {
      ex.printStackTrace();
      updateProgress(0, 1, zipFilePath); // force 0%
      completionCallback.invoke(makeErrorPayload(String.format("Couldn't extract %s", zipFilePath), ex));
    }
  }

  private void updateProgress(long extractedBytes, long totalSize, String zipFilePath) {
    double progress = (double) extractedBytes / (double) totalSize;
    Log.d(TAG, String.format("updateProgress: %.0f%%", progress * 100));

    WritableMap map = Arguments.createMap();
    map.putString(EVENT_KEY_FILENAME, zipFilePath);
    map.putDouble(EVENT_KEY_PROGRESS, progress);
    getReactApplicationContext().getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
            .emit(PROGRESS_EVENT_NAME, map);
  }

  /**
   * Extracts a zip entry (file entry)
   *
   * @param zipIn
   * @param filePath
   * @throws IOException
   * @return number of bytes extracted
   */
  private long extractFile(ZipInputStream zipIn, String filePath) throws IOException {
    BufferedOutputStream bos = new BufferedOutputStream(new FileOutputStream(filePath));
    long size = 0;
    byte[] bytesIn = new byte[BUFFER_SIZE];
    int read;
    while ((read = zipIn.read(bytesIn)) != -1) {
      bos.write(bytesIn, 0, read);
      size += read;
    }
    bos.close();

    return size;
  }

  private WritableMap makeErrorPayload(String message, Exception ex) {
    WritableMap error = Arguments.createMap();
    error.putString("message", String.format("%s (%s)", message, ex.getMessage()));
    return error;
  }
}
