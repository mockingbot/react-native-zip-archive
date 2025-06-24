package com.rnziparchive;

import android.content.res.AssetFileDescriptor;
import android.net.Uri;
import android.os.Build;
import android.util.Log;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import java.io.BufferedInputStream;
import java.io.BufferedOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.PrintWriter;
import java.io.StringWriter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.Enumeration;
import java.util.List;
import java.util.zip.ZipEntry;
//import java.util.zip.ZipFile;
import java.util.zip.ZipInputStream;

import net.lingala.zip4j.exception.ZipException;
import net.lingala.zip4j.model.FileHeader;
import net.lingala.zip4j.model.ZipParameters;
import net.lingala.zip4j.model.enums.CompressionMethod;
import net.lingala.zip4j.model.enums.CompressionLevel;
import net.lingala.zip4j.model.enums.EncryptionMethod;
import net.lingala.zip4j.model.enums.AesKeyStrength;
import net.lingala.zip4j.progress.ProgressMonitor;

import java.nio.charset.Charset;

public class RNZipArchiveModule extends ReactContextBaseJavaModule {
  private static final String TAG = RNZipArchiveModule.class.getSimpleName();

  private static final String PROGRESS_EVENT_NAME = "zipArchiveProgressEvent";
  private static final String EVENT_KEY_FILENAME = "filePath";
  private static final String EVENT_KEY_PROGRESS = "progress";

  public RNZipArchiveModule(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @Override
  public String getName() {
    return "RNZipArchive";
  }

  @ReactMethod
  public void isPasswordProtected(final String zipFilePath, final Promise promise) {
    try {
      net.lingala.zip4j.ZipFile zipFile = new net.lingala.zip4j.ZipFile(zipFilePath);
      promise.resolve(zipFile.isEncrypted());
    } catch (ZipException ex) {
      promise.reject(null, String.format("Unable to check for encryption due to: %s", getStackTrace(ex)));
    }
  }

  @ReactMethod
  public void unzipWithPassword(final String zipFilePath, final String destDirectory,
                                final String password, final Promise promise) {
    new Thread(new Runnable() {
      @Override
      public void run() {
        try {
          net.lingala.zip4j.ZipFile zipFile = new net.lingala.zip4j.ZipFile(zipFilePath);
          if (zipFile.isEncrypted()) {
            zipFile.setPassword(password.toCharArray());
          } else {
            promise.reject(null, String.format("Zip file: %s is not password protected", zipFilePath));
          }

          List fileHeaderList = zipFile.getFileHeaders();
          List extractedFileNames = new ArrayList<>();
          int totalFiles = fileHeaderList.size();

          updateProgress(0, 1, zipFilePath); // force 0%
          for (int i = 0; i < totalFiles; i++) {
            FileHeader fileHeader = (FileHeader) fileHeaderList.get(i);

            File fout = new File(destDirectory, fileHeader.getFileName());
            String canonicalPath = fout.getCanonicalPath();
            String destDirCanonicalPath = (new File(destDirectory).getCanonicalPath()) + File.separator;

            if (!canonicalPath.startsWith(destDirCanonicalPath)) {
              throw new SecurityException(String.format("Found Zip Path Traversal Vulnerability with %s", canonicalPath));
            }

            if (!fileHeader.isDirectory()) {
              zipFile.extractFile(fileHeader, destDirectory);
              extractedFileNames.add(fileHeader.getFileName());
            }
            updateProgress(i + 1, totalFiles, zipFilePath);
          }
          promise.resolve(Arguments.fromList(extractedFileNames));
        } catch (Exception ex) {
          updateProgress(0, 1, zipFilePath); // force 0%
          promise.reject(null, String.format("Failed to unzip file, due to: %s", getStackTrace(ex)));
        }
      }
    }).start();
  }

  @ReactMethod
  public void unzip(final String zipFilePath, final String destDirectory, final String charset, final Promise promise) {
    new Thread(new Runnable() {
      @Override
      public void run() {
        // Check the file exists
        try {
          new File(zipFilePath);
        } catch (NullPointerException e) {
          promise.reject(null, "Couldn't open file " + zipFilePath + ". ");
          return;
        }

        try {
          // Find the total uncompressed size of every file in the zip, so we can
          // get an accurate progress measurement
          final long totalUncompressedBytes = getUncompressedSize(zipFilePath, charset);

          File destDir = new File(destDirectory);
          if (!destDir.exists()) {
            //noinspection ResultOfMethodCallIgnored
            destDir.mkdirs();
          }

          updateProgress(0, 1, zipFilePath); // force 0%

          // We use arrays here so we can update values
          // from inside the callback
          final long[] extractedBytes = {0};
          final int[] lastPercentage = {0};

          net.lingala.zip4j.ZipFile zipFile = null;
          if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            zipFile = new net.lingala.zip4j.ZipFile(zipFilePath);
            zipFile.setCharset(Charset.forName(charset));
          } else {
            zipFile = new net.lingala.zip4j.ZipFile(zipFilePath);
          }

          ProgressMonitor progressMonitor = zipFile.getProgressMonitor();

          zipFile.setRunInThread(true);
          zipFile.extractAll(destDirectory);

          while (!progressMonitor.getState().equals(ProgressMonitor.State.READY)) {
            updateProgress(progressMonitor.getWorkCompleted(), progressMonitor.getTotalWork(), zipFilePath);

            Thread.sleep(100);
          }

          if (progressMonitor.getResult().equals(ProgressMonitor.Result.SUCCESS)) {
            zipFile.close();
            updateProgress(1, 1, zipFilePath); // force 100%
            promise.resolve(destDirectory);
          } else if (progressMonitor.getResult().equals(ProgressMonitor.Result.ERROR)) {
            throw new Exception("Error occurred. Error message: " + progressMonitor.getException().getMessage());
          } else if (progressMonitor.getResult().equals(ProgressMonitor.Result.CANCELLED)) {
            throw new Exception("Task cancelled");
          }
        } catch (Exception ex) {
          updateProgress(0, 1, zipFilePath); // force 0%
          promise.reject(null, "Failed to extract file " + ex.getLocalizedMessage());
        }
      }
    }).start();
  }

  /**
   * Extract a zip held in the assets directory.
   * <p>
   * Note that the progress value isn't as accurate as when unzipping
   * from a file. When reading a zip from a stream, we can't
   * get accurate uncompressed sizes for files (ZipEntry#getCompressedSize() returns -1).
   * <p>
   * Instead, we compare the number of bytes extracted to the size of the compressed zip file.
   * In most cases this means the progress 'stays on' 100% for a little bit (compressedSize < uncompressed size)
   */
  @ReactMethod
  public void unzipAssets(final String assetsPath, final String destDirectory, final Promise promise) {
    new Thread(new Runnable() {
      @Override
      public void run() {
        InputStream assetsInputStream;
        final long compressedSize;

        try {
          if(assetsPath.startsWith("content://")) {
            var assetUri = Uri.parse(assetsPath);
            var contentResolver = getReactApplicationContext().getContentResolver();

            assetsInputStream = contentResolver.openInputStream(assetUri);
            var fileDescriptor = contentResolver.openFileDescriptor(assetUri, "r");
            compressedSize = fileDescriptor.getStatSize();
          } else {
            assetsInputStream = getReactApplicationContext().getAssets().open(assetsPath);
            AssetFileDescriptor fileDescriptor = getReactApplicationContext().getAssets().openFd(assetsPath);
            compressedSize = fileDescriptor.getLength();
          }
        } catch (IOException e) {
          promise.reject(null, String.format("Asset file `%s` could not be opened", assetsPath));
          return;
        }

        try {
          try {
            File destDir = new File(destDirectory);
            if (!destDir.exists()) {
              //noinspection ResultOfMethodCallIgnored
              destDir.mkdirs();
            }
            ZipInputStream zipIn = new ZipInputStream(assetsInputStream);
            BufferedInputStream bin = new BufferedInputStream(zipIn);

            ZipEntry entry;

            long extractedBytes = 0;
            updateProgress(extractedBytes, compressedSize, assetsPath); // force 0%

            File fout;
            while ((entry = zipIn.getNextEntry()) != null) {
              if (entry.isDirectory()) continue;

              Log.i("rnziparchive", "Extracting: " + entry.getName());

              fout = new File(destDirectory, entry.getName());
              String canonicalPath = fout.getCanonicalPath();
              String destDirCanonicalPath = (new File(destDirectory).getCanonicalPath()) + File.separator;

              if (!canonicalPath.startsWith(destDirCanonicalPath)) {
                throw new SecurityException(String.format("Found Zip Path Traversal Vulnerability with %s", canonicalPath));
              }

              if (!fout.exists()) {
                //noinspection ResultOfMethodCallIgnored
                (new File(fout.getParent())).mkdirs();
              }

              FileOutputStream out = new FileOutputStream(fout);
              BufferedOutputStream Bout = new BufferedOutputStream(out);
              StreamUtil.copy(bin, Bout, null);
              Bout.close();
              out.close();

              extractedBytes += entry.getCompressedSize();

              // do not let the percentage go over 99% because we want it to hit 100% only when we are sure it's finished
              if(extractedBytes > compressedSize*0.99) extractedBytes = (long) (compressedSize*0.99);

              updateProgress(extractedBytes, compressedSize, entry.getName());
            }

            updateProgress(compressedSize, compressedSize, assetsPath); // force 100%

            bin.close();
            zipIn.close();
          } catch (Exception ex) {
            ex.printStackTrace();
            updateProgress(0, 1, assetsPath); // force 0%
            throw new Exception(String.format("Couldn't extract %s", assetsPath));
          }
        } catch (Exception ex) {
          promise.reject(null, ex.getMessage());
          return;
        }
        promise.resolve(destDirectory);
      }
    }).start();
  }

  @ReactMethod
  public void zipFiles(final ReadableArray files, final String destDirectory, final double compressionLevel, final Promise promise) {
    zip(files.toArrayList(), destDirectory, compressionLevel, promise);
  }

  @ReactMethod
  public void zipFolder(final String folder, final String destFile, final double compressionLevel, final Promise promise) {
    ArrayList<Object> folderAsArrayList = new ArrayList<>();
    folderAsArrayList.add(folder);
    zip(folderAsArrayList, destFile, compressionLevel, promise);
  }

  @ReactMethod
  public void zipFilesWithPassword(final ReadableArray files, final String destFile, final String password,
                                   String encryptionMethod, final double compressionLevel, Promise promise) {
    zipWithPassword(files.toArrayList(), destFile, password, encryptionMethod, compressionLevel, promise);
  }

  @ReactMethod
  public void zipFolderWithPassword(final String folder, final String destFile, final String password,
                                    String encryptionMethod, final double compressionLevel, Promise promise) {
    ArrayList<Object> folderAsArrayList = new ArrayList<>();
    folderAsArrayList.add(folder);
    zipWithPassword(folderAsArrayList, destFile, password, encryptionMethod, compressionLevel, promise);
  }

  private void zipWithPassword(final ArrayList<Object> filesOrDirectory, final String destFile, final String password,
                               String encryptionMethod, final double compressionLevel, Promise promise) {
    try{
      ZipParameters parameters = new ZipParameters();
      parameters.setCompressionMethod(CompressionMethod.DEFLATE);
      parameters.setCompressionLevel(getCompressionLevel(compressionLevel));

      String encParts[] = encryptionMethod.split("-");

      if (password != null && !password.isEmpty()) {
        parameters.setEncryptFiles(true);
        if (encParts[0].equals("AES")) {
          parameters.setEncryptionMethod(EncryptionMethod.AES);
          if (encParts[1].equals("128")) {
            parameters.setAesKeyStrength(AesKeyStrength.KEY_STRENGTH_128);
          } else if (encParts[1].equals("256")) {
            parameters.setAesKeyStrength(AesKeyStrength.KEY_STRENGTH_256);
          } else {
            parameters.setAesKeyStrength(AesKeyStrength.KEY_STRENGTH_128);
          }
        } else if (encryptionMethod.equals("STANDARD")) {
          parameters.setEncryptionMethod(EncryptionMethod.ZIP_STANDARD_VARIANT_STRONG);
          Log.d(TAG, "Standard Encryption");
        } else {
          parameters.setEncryptionMethod(EncryptionMethod.ZIP_STANDARD);
          Log.d(TAG, "Encryption type not supported default to Standard Encryption");
        }
      } else {
        promise.reject(null, "Password is empty");
      }

      processZip(filesOrDirectory, destFile, parameters, promise, password.toCharArray());

    } catch (Exception ex) {
      promise.reject(null, ex.getMessage());
      return;
    }
  }

  private void zip(final ArrayList<Object> filesOrDirectory, final String destFile, final double compressionLevel, final Promise promise) {
    try{
      ZipParameters parameters = new ZipParameters();
      parameters.setCompressionMethod(CompressionMethod.DEFLATE);
      parameters.setCompressionLevel(getCompressionLevel(compressionLevel));

      processZip(filesOrDirectory, destFile, parameters, promise, null);

    } catch (Exception ex) {
      promise.reject(null, ex.getMessage());
      return;
    }
  }

  private void processZip(final ArrayList<Object> entries, final String destFile, final ZipParameters parameters, final Promise promise, final char[] password) {
    new Thread(new Runnable() {
      @Override
      public void run() {
        try {
          net.lingala.zip4j.ZipFile zipFile;
          if (password != null) {
            zipFile = new net.lingala.zip4j.ZipFile(destFile, password);
          } else {
            zipFile = new net.lingala.zip4j.ZipFile(destFile);
          }

          updateProgress(0, 100, destFile);

          int totalFiles = 0;
          int fileCounter = 0;

          for (int i = 0; i < entries.size(); i++) {
            File f = new File(entries.get(i).toString());

            if (f.exists()) {
              if (f.isDirectory()) {

                List<File> files = Arrays.asList(f.listFiles());

                totalFiles += files.size();
                for (int j = 0; j < files.size(); j++) {
                  if (files.get(j).isDirectory()) {
                    zipFile.addFolder(files.get(j), parameters);
                  }
                  else {
                    zipFile.addFile(files.get(j), parameters);
                  }
                  fileCounter += 1;
                  updateProgress(fileCounter, totalFiles, destFile);
                }

              } else {
                totalFiles += 1;
                zipFile.addFile(f, parameters);
                fileCounter += 1;
                updateProgress(fileCounter, totalFiles, destFile);
              }
            }
            else {
              promise.reject(null, "File or folder does not exist");
            }

            updateProgress(1, 1, destFile); // force 100%
          }
          promise.resolve(destFile);
        } catch (Exception ex) {
          promise.reject(null, ex.getMessage());
          return;
        }
      }
    }).start();
  }

  protected void updateProgress(long extractedBytes, long totalSize, String zipFilePath) {
    // Ensure progress can't overflow 1
    double progress = Math.min((double) extractedBytes / (double) totalSize, 1);
    Log.d(TAG, String.format("updateProgress: %.0f%%", progress * 100));

    WritableMap map = Arguments.createMap();
    map.putString(EVENT_KEY_FILENAME, zipFilePath);
    map.putDouble(EVENT_KEY_PROGRESS, progress);
    getReactApplicationContext().getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
            .emit(PROGRESS_EVENT_NAME, map);
  }

  @ReactMethod
  public void getUncompressedSize(String zipFilePath, String charset, final Promise promise) {
    long totalSize = getUncompressedSize(zipFilePath, charset);
    promise.resolve((double) totalSize);
  }

  /**
   * Return the uncompressed size of the ZipFile (only works for files on disk, not in assets)
   *
   * @return -1 on failure
   */
  private long getUncompressedSize(String zipFilePath, String charset) {
    long totalSize = 0;
    try {
      net.lingala.zip4j.ZipFile zipFile = null;
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
        zipFile = new net.lingala.zip4j.ZipFile(zipFilePath);
        zipFile.setCharset(Charset.forName(charset));
      } else {
        zipFile = new net.lingala.zip4j.ZipFile(zipFilePath);
      }

      final List <FileHeader> files = zipFile.getFileHeaders();
      for(FileHeader it : files) {
        long size = it.getUncompressedSize();
        if (size != -1) {
          totalSize += size;
        }
      }

      zipFile.close();
    } catch (IOException ignored) {
      return -1;
    }
    return totalSize;
  }

  private static CompressionLevel getCompressionLevel(double compressionLevel) {
    switch (compressionLevel) {
      case -1:
        return CompressionLevel.NORMAL;
      case 0:
        return CompressionLevel.NO_COMPRESSION;
      case 1:
        return CompressionLevel.FASTEST;
      case 2:
        return CompressionLevel.FASTER;
      case 3:
        return CompressionLevel.FAST;
      case 4:
        return CompressionLevel.MEDIUM_FAST;
      case 5:
        return CompressionLevel.NORMAL;
      case 6:
        return CompressionLevel.HIGHER;
      case 7:
        return CompressionLevel.MAXIMUM;
      case 8:
        return CompressionLevel.PRE_ULTRA;
      case 9:
        return CompressionLevel.ULTRA;
      default:
        Log.w(TAG, "Unsupported compression level: " + level + ", defaulting to NORMAL (5)");
        return CompressionLevel.NORMAL;
    }
  }

  /**
   * Returns the exception stack trace as a string
   */
  private String getStackTrace(Exception e) {
    StringWriter sw = new StringWriter();
    PrintWriter pw = new PrintWriter(sw);
    e.printStackTrace(pw);
    return sw.toString();
  }

  @ReactMethod
  public void addListener(String eventName) {
    // Keep: Required for RN built in Event Emitter Calls.
  }

  @ReactMethod
  public void removeListeners(Integer count) {
    // Keep: Required for RN built in Event Emitter Calls.
  }
}
