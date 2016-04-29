package com.rnziparchive;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;

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

  private static final int BUFFER_SIZE = 4096;

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
    try {
      inputStream = new FileInputStream(zipFilePath);
    } catch (FileNotFoundException e) {
      callback.invoke(makeErrorPayload(e));
      return;
    }
    unzipStream(destDirectory, callback, inputStream);
  }

  @ReactMethod
  public void unzipAssets(String assetsPath, String destDirectory, Callback callback) {
    InputStream assetsInputStream;
    try {
      assetsInputStream = getReactApplicationContext().getAssets().open(assetsPath);
    } catch (IOException e) {
      callback.invoke(makeErrorPayload(e));
      return;
    }

    unzipStream(destDirectory, callback, assetsInputStream);
  }

  private void unzipStream(String destDirectory, Callback callback, InputStream inputStream) {
    try {
      File destDir = new File(destDirectory);
      if (!destDir.exists()) {
        destDir.mkdir();
      }
      ZipInputStream zipIn = new ZipInputStream(inputStream);
      ZipEntry entry = zipIn.getNextEntry();
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
        entry = zipIn.getNextEntry();
      }
      zipIn.close();
      callback.invoke(null, null);
    } catch (Exception ex) {
      ex.printStackTrace();
      callback.invoke(makeErrorPayload(ex));
    }
  }

  /**
   * Extracts a zip entry (file entry)
   * @param zipIn
   * @param filePath
   * @throws IOException
   */
  private void extractFile(ZipInputStream zipIn, String filePath) throws IOException {
    BufferedOutputStream bos = new BufferedOutputStream(new FileOutputStream(filePath));
    byte[] bytesIn = new byte[BUFFER_SIZE];
    int read = 0;
    while ((read = zipIn.read(bytesIn)) != -1) {
      bos.write(bytesIn, 0, read);
    }
    bos.close();
  }

  private WritableMap makeErrorPayload(Exception ex) {
    WritableMap error = Arguments.createMap();
    error.putString("message", ex.getMessage());
    return error;
  }
}
