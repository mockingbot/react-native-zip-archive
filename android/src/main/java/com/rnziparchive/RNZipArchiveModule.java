package com.rnziparchive;

import android.content.res.AssetFileDescriptor;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableType;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
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
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

import net.lingala.zip4j.model.FileHeader;
import net.lingala.zip4j.model.ZipParameters;
import net.lingala.zip4j.model.enums.CompressionMethod;
import net.lingala.zip4j.model.enums.CompressionLevel;
import net.lingala.zip4j.model.enums.EncryptionMethod;
import net.lingala.zip4j.model.enums.AesKeyStrength;

import java.nio.charset.Charset;

public class RNZipArchiveModule extends NativeZipArchiveSpec {
  public static final String NAME = "RNZipArchive";
  private static final String TAG = RNZipArchiveModule.class.getSimpleName();

  private static final String PROGRESS_EVENT_NAME = "zipArchiveProgressEvent";
  private static final String EVENT_KEY_FILENAME = "filePath";
  private static final String EVENT_KEY_PROGRESS = "progress";

  private final ExecutorService executor = Executors.newSingleThreadExecutor(
      r -> new Thread(r, "RNZipArchiveWorker")
  );
  private final Handler mainHandler = new Handler(Looper.getMainLooper());
  private final AtomicBoolean cancelled = new AtomicBoolean(false);

  public RNZipArchiveModule(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @Override
  public String getName() {
    return NAME;
  }

  @Override
  public void invalidate() {
    executor.shutdownNow();
    super.invalidate();
  }

  @Deprecated
  @SuppressWarnings({"deprecation", "removal"})
  public void onCatalystInstanceDestroy() {
    invalidate();
  }


  private void beginOperation() {
    cancelled.set(false);
  }

  private void submitWork(Runnable work) {
    beginOperation();
    executor.submit(work);
  }

  private boolean rejectIfCancelled(Promise promise) {
    if (cancelled.get()) {
      promise.reject(ZipErrorCodes.CANCELLED, "Operation cancelled");
      return true;
    }
    return false;
  }

  private void rejectMapped(Promise promise, Exception ex, String fallback) {
    if (cancelled.get()) {
      promise.reject(ZipErrorCodes.CANCELLED, "Operation cancelled");
      return;
    }
    String message = ex.getMessage() != null ? ex.getMessage() : fallback;
    promise.reject(ZipErrorCodes.mapException(ex, fallback), message);
  }

  @Override
  public void cancel(final Promise promise) {
    cancelled.set(true);
    promise.resolve(null);
  }

  @Override
  public void isPasswordProtected(final String zipFilePath, final Promise promise) {
    submitWork(() -> {
      try (net.lingala.zip4j.ZipFile zipFile = new net.lingala.zip4j.ZipFile(zipFilePath)) {
        promise.resolve(zipFile.isEncrypted());
      } catch (Exception ex) {
        rejectMapped(promise, ex, ZipErrorCodes.UNZIP);
      }
    });
  }

  @Override
  public void unzipWithPassword(final String zipFilePath, final String destDirectory,
                                final String password, final ReadableArray entries,
                                final Promise promise) {
    final List<String> entryList = optionalEntriesList(entries, promise);
    if (entryList == REJECTED_ENTRIES) {
      return;
    }
    if (entryList != null) {
      extractSelectedEntries(zipFilePath, destDirectory, entryList, "UTF-8", password, promise);
      return;
    }
    submitWork(() -> {
      try (net.lingala.zip4j.ZipFile zipFile = new net.lingala.zip4j.ZipFile(zipFilePath)) {
        if (zipFile.isEncrypted()) {
          zipFile.setPassword(password.toCharArray());
        } else {
          promise.reject(ZipErrorCodes.NOT_PASSWORD_PROTECTED, String.format("Zip file: %s is not password protected", zipFilePath));
          return;
        }

        List<FileHeader> fileHeaderList = zipFile.getFileHeaders();
        long totalBytes = Math.max(totalUncompressedSize(fileHeaderList), 1);
        long extractedBytes = 0;

        updateProgress(0, 1, zipFilePath); // force 0%
        for (FileHeader fileHeader : fileHeaderList) {
          if (rejectIfCancelled(promise)) {
            return;
          }
          ZipSecurity.validateExtractPath(destDirectory, fileHeader.getFileName());

          if (!fileHeader.isDirectory()) {
            zipFile.extractFile(fileHeader, destDirectory, ZipSecurity.createExtractParameters());
            extractedBytes += Math.max(fileHeader.getUncompressedSize(), 0);
          }
          updateProgress(extractedBytes, totalBytes, zipFilePath);
        }
        updateProgress(1, 1, zipFilePath); // force 100%
        promise.resolve(destDirectory);
      } catch (Exception ex) {
        updateProgress(0, 1, zipFilePath); // force 0%
        rejectMapped(promise, ex, ZipErrorCodes.UNZIP);
      }
    });
  }

  @Override
  public void unzip(final String zipFilePath, final String destDirectory, final String charset,
                    final ReadableArray entries, final Promise promise) {
    final List<String> entryList = optionalEntriesList(entries, promise);
    if (entryList == REJECTED_ENTRIES) {
      return;
    }
    if (entryList != null) {
      extractSelectedEntries(zipFilePath, destDirectory, entryList, charset, null, promise);
      return;
    }
    submitWork(() -> {
      if (zipFilePath == null) {
        promise.reject(ZipErrorCodes.INVALID_PATH, "Couldn't open file null.");
        return;
      }
      File zipFileRef = new File(zipFilePath);
      if (!zipFileRef.exists()) {
        promise.reject(ZipErrorCodes.FILE_NOT_FOUND, "Couldn't open file " + zipFilePath + ".");
        return;
      }

      try (net.lingala.zip4j.ZipFile zipFile = openZipFile(zipFilePath, charset)) {
        File destDir = new File(destDirectory);
        if (!destDir.exists()) {
          //noinspection ResultOfMethodCallIgnored
          destDir.mkdirs();
        }

        List<FileHeader> fileHeaderList = zipFile.getFileHeaders();
        long totalBytes = Math.max(totalUncompressedSize(fileHeaderList), 1);
        long extractedBytes = 0;

        updateProgress(0, 1, zipFilePath); // force 0%
        for (FileHeader fileHeader : fileHeaderList) {
          if (rejectIfCancelled(promise)) {
            return;
          }
          ZipSecurity.validateExtractPath(destDirectory, fileHeader.getFileName());

          if (!fileHeader.isDirectory()) {
            zipFile.extractFile(fileHeader, destDirectory, ZipSecurity.createExtractParameters());
            extractedBytes += Math.max(fileHeader.getUncompressedSize(), 0);
          }
          updateProgress(extractedBytes, totalBytes, zipFilePath);
        }

        updateProgress(1, 1, zipFilePath); // force 100%
        promise.resolve(destDirectory);
      } catch (Exception ex) {
        updateProgress(0, 1, zipFilePath); // force 0%
        rejectMapped(promise, ex, ZipErrorCodes.UNZIP);
      }
    });
  }

  /**
   * Sentinel meaning {@link #optionalEntriesList} already rejected the promise.
   * Distinct from {@code null} (full extract) and a non-empty list (selective).
   */
  private static final List<String> REJECTED_ENTRIES = new ArrayList<>();

  /**
   * @return {@code null} for full extract, a non-empty list for selective extract,
   *         or {@link #REJECTED_ENTRIES} when the promise was already rejected.
   */
  private List<String> optionalEntriesList(ReadableArray entries, Promise promise) {
    if (entries == null || entries.size() == 0) {
      return null;
    }
    try {
      List<String> entryList = readableArrayToStringList(entries);
      if (entryList.isEmpty()) {
        promise.reject(ZipErrorCodes.INVALID_ARGS, "entries must be a non-empty array");
        return REJECTED_ENTRIES;
      }
      return entryList;
    } catch (IllegalArgumentException ex) {
      promise.reject(ZipErrorCodes.INVALID_ARGS, "Invalid entries array: " + ex.getMessage());
      return REJECTED_ENTRIES;
    }
  }

  @Override
  public void listContents(final String zipFilePath, final String charset, final Promise promise) {
    submitWork(() -> {
      if (zipFilePath == null) {
        promise.reject(ZipErrorCodes.INVALID_PATH, "Couldn't open file null.");
        return;
      }
      File zipFileRef = new File(zipFilePath);
      if (!zipFileRef.exists()) {
        promise.reject(ZipErrorCodes.FILE_NOT_FOUND, "Couldn't open file " + zipFilePath + ".");
        return;
      }

      try (net.lingala.zip4j.ZipFile zipFile = openZipFile(zipFilePath, charset)) {
        WritableArray entries = Arguments.createArray();
        for (FileHeader fileHeader : zipFile.getFileHeaders()) {
          WritableMap entry = Arguments.createMap();
          entry.putString("path", fileHeader.getFileName());
          entry.putDouble("size", Math.max(fileHeader.getUncompressedSize(), 0));
          entry.putDouble("compressedSize", Math.max(fileHeader.getCompressedSize(), 0));
          entry.putBoolean("isDirectory", fileHeader.isDirectory());
          entry.putBoolean("isEncrypted", fileHeader.isEncrypted());
          entries.pushMap(entry);
        }
        promise.resolve(entries);
      } catch (Exception ex) {
        rejectMapped(promise, ex, ZipErrorCodes.UNZIP);
      }
    });
  }

  private void extractSelectedEntries(final String zipFilePath, final String destDirectory,
                                      final List<String> wantedEntries, final String charset,
                                      final String password, final Promise promise) {
    submitWork(() -> {
      if (zipFilePath == null) {
        promise.reject(ZipErrorCodes.INVALID_PATH, "Couldn't open file null.");
        return;
      }
      File zipFileRef = new File(zipFilePath);
      if (!zipFileRef.exists()) {
        promise.reject(ZipErrorCodes.FILE_NOT_FOUND, "Couldn't open file " + zipFilePath + ".");
        return;
      }
      if (wantedEntries == null || wantedEntries.isEmpty()) {
        promise.reject(ZipErrorCodes.INVALID_ARGS, "entries must be a non-empty array");
        return;
      }

      try (net.lingala.zip4j.ZipFile zipFile = openZipFile(zipFilePath, charset)) {
        if (password != null) {
          if (!zipFile.isEncrypted()) {
            promise.reject(ZipErrorCodes.NOT_PASSWORD_PROTECTED,
                String.format("Zip file: %s is not password protected", zipFilePath));
            return;
          }
          zipFile.setPassword(password.toCharArray());
        }

        File destDir = new File(destDirectory);
        if (!destDir.exists()) {
          //noinspection ResultOfMethodCallIgnored
          destDir.mkdirs();
        }

        List<FileHeader> selected = new ArrayList<>();
        for (FileHeader fileHeader : zipFile.getFileHeaders()) {
          if (entryMatchesSelection(fileHeader.getFileName(), wantedEntries)) {
            selected.add(fileHeader);
          }
        }

        if (selected.isEmpty()) {
          promise.reject(ZipErrorCodes.INVALID_ARGS, "None of the requested entries were found in the archive");
          return;
        }

        long totalBytes = Math.max(totalUncompressedSize(selected), 1);
        long extractedBytes = 0;

        updateProgress(0, 1, zipFilePath);
        for (FileHeader fileHeader : selected) {
          if (rejectIfCancelled(promise)) {
            return;
          }
          ZipSecurity.validateExtractPath(destDirectory, fileHeader.getFileName());

          if (!fileHeader.isDirectory()) {
            zipFile.extractFile(fileHeader, destDirectory, ZipSecurity.createExtractParameters());
            extractedBytes += Math.max(fileHeader.getUncompressedSize(), 0);
          } else {
            File dir = new File(destDirectory, fileHeader.getFileName());
            //noinspection ResultOfMethodCallIgnored
            dir.mkdirs();
          }
          updateProgress(extractedBytes, totalBytes, zipFilePath);
        }

        updateProgress(1, 1, zipFilePath);
        promise.resolve(destDirectory);
      } catch (Exception ex) {
        updateProgress(0, 1, zipFilePath);
        rejectMapped(promise, ex, ZipErrorCodes.UNZIP);
      }
    });
  }

  /**
   * Returns true when {@code entryName} should be extracted for the given selection list.
   * Matches exact paths, directory prefixes ({@code foo/} or {@code foo}), and strips a
   * trailing slash from either side before comparing.
   */
  static boolean entryMatchesSelection(String entryName, List<String> wantedEntries) {
    if (entryName == null || wantedEntries == null) {
      return false;
    }
    String normalizedEntry = stripTrailingSlash(entryName.replace('\\', '/'));
    for (String wanted : wantedEntries) {
      if (wanted == null || wanted.isEmpty()) {
        continue;
      }
      String normalizedWanted = stripTrailingSlash(wanted.replace('\\', '/'));
      if (normalizedEntry.equals(normalizedWanted)) {
        return true;
      }
      if (normalizedEntry.startsWith(normalizedWanted + "/")) {
        return true;
      }
    }
    return false;
  }

  private static String stripTrailingSlash(String path) {
    if (path == null || path.isEmpty()) {
      return path;
    }
    int end = path.length();
    while (end > 0 && path.charAt(end - 1) == '/') {
      end--;
    }
    return path.substring(0, end);
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
  @Override
  public void unzipAssets(final String assetsPath, final String destDirectory, final Promise promise) {
    submitWork(() -> {
      InputStream assetsInputStream = null;
      AssetFileDescriptor fileDescriptor = null;
      long compressedSize;

      try {
        if (assetsPath.startsWith("content://")) {
          Uri assetUri = Uri.parse(assetsPath);
          android.content.ContentResolver contentResolver = getReactApplicationContext().getContentResolver();

          assetsInputStream = contentResolver.openInputStream(assetUri);
          fileDescriptor = contentResolver.openAssetFileDescriptor(assetUri, "r");
          compressedSize = fileDescriptor != null ? fileDescriptor.getLength() : 0;
          if (compressedSize <= 0) {
            compressedSize = 1; // avoid division by zero in progress math
          }
        } else {
          assetsInputStream = getReactApplicationContext().getAssets().open(assetsPath);
          try {
            fileDescriptor = getReactApplicationContext().getAssets().openFd(assetsPath);
            compressedSize = fileDescriptor.getLength();
          } catch (IOException fdEx) {
            // Asset is compressed in the APK; openFd() doesn't work for compressed assets.
            // Fall back to available() as a size estimate.
            compressedSize = assetsInputStream.available();
            if (compressedSize <= 0) {
              compressedSize = 1; // avoid division by zero in progress math
            }
          }
        }

        if (assetsInputStream == null) {
          promise.reject(ZipErrorCodes.FILE_NOT_FOUND, String.format("Asset file `%s` could not be opened", assetsPath));
          return;
        }

        File destDir = new File(destDirectory);
        if (!destDir.exists()) {
          //noinspection ResultOfMethodCallIgnored
          destDir.mkdirs();
        }

        try (ZipInputStream zipIn = new ZipInputStream(assetsInputStream);
             BufferedInputStream bin = new BufferedInputStream(zipIn)) {

          ZipEntry entry;
          long extractedBytes = 0;
          updateProgress(extractedBytes, compressedSize, assetsPath); // force 0%

          while ((entry = zipIn.getNextEntry()) != null) {
            if (rejectIfCancelled(promise)) {
              return;
            }
            if (entry.isDirectory()) continue;

            Log.i("rnziparchive", "Extracting: " + entry.getName());

            ZipSecurity.validateExtractPath(destDirectory, entry.getName());

            File fout = new File(destDirectory, entry.getName());
            File parentDir = fout.getParentFile();
            if (parentDir != null && !parentDir.exists()) {
              //noinspection ResultOfMethodCallIgnored
              parentDir.mkdirs();
            }

            try (FileOutputStream out = new FileOutputStream(fout);
                 BufferedOutputStream bout = new BufferedOutputStream(out)) {
              StreamUtil.copy(bin, bout, null);
            }

            extractedBytes += entry.getCompressedSize();

            // do not let the percentage go over 99% because we want it to hit 100% only when we are sure it's finished
            if (extractedBytes > compressedSize * 0.99) extractedBytes = (long) (compressedSize * 0.99);

            updateProgress(extractedBytes, compressedSize, entry.getName());
          }

          updateProgress(compressedSize, compressedSize, assetsPath); // force 100%
        }

        promise.resolve(destDirectory);
      } catch (Exception ex) {
        Log.e(TAG, "Failed to extract asset: " + assetsPath, ex);
        updateProgress(0, 1, assetsPath); // force 0%
        rejectMapped(promise, ex, ZipErrorCodes.UNZIP);
      } finally {
        if (fileDescriptor != null) {
          try {
            fileDescriptor.close();
          } catch (IOException ignored) {
          }
        }
        if (assetsInputStream != null) {
          try {
            assetsInputStream.close();
          } catch (IOException ignored) {
          }
        }
      }
    });
  }

  @Override
  public void zipFiles(final ReadableArray files, final String destDirectory, final double compressionLevel, final Promise promise) {
    final List<String> fileList;
    try {
      fileList = readableArrayToStringList(files);
    } catch (IllegalArgumentException ex) {
      promise.reject(ZipErrorCodes.INVALID_ARGS, "Invalid files array: " + ex.getMessage());
      return;
    }
    zip(fileList, destDirectory, compressionLevel, promise);
  }

  @Override
  public void zipFolder(final String folder, final String destFile, final double compressionLevel, final Promise promise) {
    List<String> folderAsList = new ArrayList<>();
    folderAsList.add(folder);
    zip(folderAsList, destFile, compressionLevel, promise);
  }

  @Override
  public void zipFilesWithPassword(final ReadableArray files, final String destFile, final String password,
                                   String encryptionMethod, final double compressionLevel, Promise promise) {
    final List<String> fileList;
    try {
      fileList = readableArrayToStringList(files);
    } catch (IllegalArgumentException ex) {
      promise.reject(ZipErrorCodes.INVALID_ARGS, "Invalid files array: " + ex.getMessage());
      return;
    }
    zipWithPassword(fileList, destFile, password, encryptionMethod, compressionLevel, promise);
  }

  @Override
  public void zipFolderWithPassword(final String folder, final String destFile, final String password,
                                    String encryptionMethod, final double compressionLevel, Promise promise) {
    List<String> folderAsList = new ArrayList<>();
    folderAsList.add(folder);
    zipWithPassword(folderAsList, destFile, password, encryptionMethod, compressionLevel, promise);
  }

  private void zipWithPassword(final List<String> filesOrDirectory, final String destFile, final String password,
                               String encryptionMethod, final double compressionLevel, Promise promise) {
    try {
      ZipParameters parameters = buildZipParameters(compressionLevel);

      if (password == null || password.isEmpty()) {
        promise.reject(ZipErrorCodes.INVALID_ARGS, "Password is empty");
        return;
      }

      parameters.setEncryptFiles(true);
      String[] encParts = encryptionMethod.split("-");

      if (encParts[0].equals("AES")) {
        parameters.setEncryptionMethod(EncryptionMethod.AES);
        if (encParts[1].equals("128")) {
          parameters.setAesKeyStrength(AesKeyStrength.KEY_STRENGTH_128);
        } else if (encParts[1].equals("256")) {
          parameters.setAesKeyStrength(AesKeyStrength.KEY_STRENGTH_256);
        } else {
          parameters.setAesKeyStrength(AesKeyStrength.KEY_STRENGTH_128);
        }
      } else if ("STANDARD".equals(encryptionMethod)) {
        // ZipCrypto (ZIP_STANDARD). ZIP_STANDARD_VARIANT_STRONG is write-only in zip4j
        // and fails extract with "encryption method is not supported".
        parameters.setEncryptionMethod(EncryptionMethod.ZIP_STANDARD);
        Log.d(TAG, "Standard Encryption");
      } else {
        parameters.setEncryptionMethod(EncryptionMethod.ZIP_STANDARD);
        Log.d(TAG, "Encryption type not supported default to Standard Encryption");
      }

      processZip(filesOrDirectory, destFile, parameters, promise, password.toCharArray());
    } catch (Exception ex) {
      rejectMapped(promise, ex, ZipErrorCodes.ZIP);
    }
  }

  private void zip(final List<String> filesOrDirectory, final String destFile, final double compressionLevel, final Promise promise) {
    try {
      ZipParameters parameters = buildZipParameters(compressionLevel);
      processZip(filesOrDirectory, destFile, parameters, promise, null);
    } catch (Exception ex) {
      rejectMapped(promise, ex, ZipErrorCodes.ZIP);
    }
  }

  private void processZip(final List<String> entries, final String destFile, final ZipParameters parameters, final Promise promise, final char[] password) {
    submitWork(() -> {
      try (net.lingala.zip4j.ZipFile zipFile = password != null
          ? new net.lingala.zip4j.ZipFile(destFile, password)
          : new net.lingala.zip4j.ZipFile(destFile)) {

        updateProgress(0, 100, destFile);

        int totalFiles = 0;
        int fileCounter = 0;

        for (int i = 0; i < entries.size(); i++) {
          if (rejectIfCancelled(promise)) {
            return;
          }
          File f = new File(entries.get(i));

          if (f.exists()) {
            if (f.isDirectory()) {
              File[] listFiles = f.listFiles();
              List<File> files = listFiles != null ? Arrays.asList(listFiles) : new ArrayList<File>();

              totalFiles += files.size();
              for (int j = 0; j < files.size(); j++) {
                if (rejectIfCancelled(promise)) {
                  return;
                }
                if (files.get(j).isDirectory()) {
                  zipFile.addFolder(files.get(j), parameters);
                } else {
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
          } else {
            promise.reject(ZipErrorCodes.FILE_NOT_FOUND, "File or folder does not exist");
            return;
          }
        }
      } catch (Exception ex) {
        rejectMapped(promise, ex, ZipErrorCodes.ZIP);
        return;
      }
      updateProgress(1, 1, destFile); // force 100%
      promise.resolve(destFile);
    });
  }

  @Override
  public void getUncompressedSize(String zipFilePath, String charset, final Promise promise) {
    submitWork(() -> {
      try {
        long totalSize = getUncompressedSize(zipFilePath, charset);
        if (totalSize == -1) {
          promise.reject(ZipErrorCodes.CORRUPT_ARCHIVE, "Failed to get uncompressed size");
        } else {
          promise.resolve((double) totalSize);
        }
      } catch (Exception e) {
        rejectMapped(promise, e, ZipErrorCodes.UNZIP);
      }
    });
  }

  /**
   * Return the uncompressed size of the ZipFile (only works for files on disk, not in assets)
   *
   * @return -1 on failure
   */
  private long getUncompressedSize(String zipFilePath, String charset) {
    try (net.lingala.zip4j.ZipFile zipFile = openZipFile(zipFilePath, charset)) {
      return totalUncompressedSize(zipFile.getFileHeaders());
    } catch (Exception ignored) {
      return -1;
    }
  }

  /**
   * Sum the uncompressed sizes of the given entries, skipping entries whose size is unknown (-1).
   */
  private static long totalUncompressedSize(List<FileHeader> fileHeaders) {
    long totalSize = 0;
    for (FileHeader fileHeader : fileHeaders) {
      long size = fileHeader.getUncompressedSize();
      if (size > 0) {
        totalSize += size;
      }
    }
    return totalSize;
  }

  private net.lingala.zip4j.ZipFile openZipFile(String zipFilePath, String charset) {
    net.lingala.zip4j.ZipFile zipFile = new net.lingala.zip4j.ZipFile(zipFilePath);
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N && charset != null) {
      zipFile.setCharset(Charset.forName(charset));
    }
    return zipFile;
  }

  private ZipParameters buildZipParameters(double compressionLevel) {
    ZipParameters parameters = new ZipParameters();
    parameters.setCompressionMethod(CompressionMethod.DEFLATE);
    parameters.setCompressionLevel(getCompressionLevel(compressionLevel));
    return parameters;
  }

  private static CompressionLevel getCompressionLevel(double compressionLevel) {
    if (compressionLevel == -1) {
      return CompressionLevel.NORMAL;
    } else if (compressionLevel == 0) {
      return CompressionLevel.NO_COMPRESSION;
    } else if (compressionLevel == 1) {
      return CompressionLevel.FASTEST;
    } else if (compressionLevel == 2) {
      return CompressionLevel.FASTER;
    } else if (compressionLevel == 3) {
      return CompressionLevel.FAST;
    } else if (compressionLevel == 4) {
      return CompressionLevel.MEDIUM_FAST;
    } else if (compressionLevel == 5) {
      return CompressionLevel.NORMAL;
    } else if (compressionLevel == 6) {
      return CompressionLevel.HIGHER;
    } else if (compressionLevel == 7) {
      return CompressionLevel.MAXIMUM;
    } else if (compressionLevel == 8) {
      return CompressionLevel.PRE_ULTRA;
    } else if (compressionLevel == 9) {
      return CompressionLevel.ULTRA;
    } else {
      Log.w(TAG, "Unsupported compression level: " + compressionLevel + ", defaulting to NORMAL (5)");
      return CompressionLevel.NORMAL;
    }
  }

  /**
   * Convert a JS string array to a Java list, rejecting non-string elements instead of
   * crashing the caller with an unchecked native type exception.
   *
   * @throws IllegalArgumentException if an element is not a string
   */
  static List<String> readableArrayToStringList(ReadableArray array) {
    List<String> result = new ArrayList<>();
    for (int i = 0; i < array.size(); i++) {
      if (array.getType(i) != ReadableType.String) {
        throw new IllegalArgumentException(
            "expected string at index " + i + " but got " + array.getType(i));
      }
      result.add(array.getString(i));
    }
    return result;
  }

  protected void updateProgress(long extractedBytes, long totalSize, String zipFilePath) {
    // Ensure progress can't overflow 1
    final double progress = Math.min((double) extractedBytes / (double) totalSize, 1);
    Log.d(TAG, String.format("updateProgress: %.0f%%", progress * 100));

    final WritableMap map = Arguments.createMap();
    map.putString(EVENT_KEY_FILENAME, zipFilePath);
    map.putDouble(EVENT_KEY_PROGRESS, progress);

    mainHandler.post(() -> {
      ReactApplicationContext context = getReactApplicationContext();
      if (context != null && context.hasActiveCatalystInstance()) {
        context.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
            .emit(PROGRESS_EVENT_NAME, map);
      }
    });
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

  @Override
  public void addListener(String eventName) {
    // Keep: Required for RN built in Event Emitter Calls.
  }

  @Override
  public void removeListeners(double count) {
    // Keep: Required for RN built in Event Emitter Calls.
  }
}
