package com.rnziparchive;

import com.facebook.react.bridge.Promise;

import java.io.BufferedInputStream;
import java.io.BufferedOutputStream;
import java.io.File;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.util.Timer;
import java.util.TimerTask;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

public class ZipTask {
  private final String destFile;
  private final String[] files;
  private final String fromDirectory;
  private final Promise promise;
  private static final int BUFFER_SIZE = 4096;

  private long bytesRead = 0;
  private long totalSize;
  private RNZipArchiveModule cb;
  private String threadError;

  public ZipTask(String[] files, String destFile, String fromDirectory, Promise promise, RNZipArchiveModule cb) {
    this.destFile = destFile;
    this.files = files;
    this.fromDirectory = fromDirectory;
    this.promise = promise;
    this.cb = cb;
  }

  public void zip() {
    Thread.UncaughtExceptionHandler h = new Thread.UncaughtExceptionHandler() {
      public void uncaughtException(Thread th, Throwable ex) {
        promise.reject(null , "Uncaught exception in ZipTask: " + ex);
      }
    };

    Thread t = new Thread(new Runnable() {
      public void run() {
        try {
          if (destFile.contains("/")) {
            File destDir = new File(destFile.substring(0, destFile.lastIndexOf("/")));
            if (!destDir.exists()) {
              //noinspection ResultOfMethodCallIgnored
              destDir.mkdirs();
            }
          }

          if (new File(destFile).exists()) {
            //noinspection ResultOfMethodCallIgnored
            new File(destFile).delete();
          }

          final long totalUncompressedBytes = getUncompressedSize(files);

          BufferedInputStream origin;
          FileOutputStream dest = new FileOutputStream(destFile);

          ZipOutputStream out = new ZipOutputStream(new BufferedOutputStream(dest));

          byte data[] = new byte[BUFFER_SIZE];

          cb.updateProgress(0, 1, destFile); // force 0%
          for (int i = 0; i < files.length; i++) {
            String absoluteFilepath = files[i];

            if (!new File(absoluteFilepath).isDirectory()) {
              FileInputStream fi = new FileInputStream(absoluteFilepath);
              String filename = Paths.get(fromDirectory).relativize(Paths.get(absoluteFilepath)).toString();
              ZipEntry entry = new ZipEntry(filename);
              out.putNextEntry(entry);
              origin = new BufferedInputStream(fi, BUFFER_SIZE);
              int count;

              Timer timer = new Timer();
              timer.scheduleAtFixedRate(new TimerTask() {
                @Override
                public void run() {
                  cb.updateProgress(bytesRead, totalUncompressedBytes, destFile);
                }
              }, 200, 200);

              while ((count = origin.read(data, 0, BUFFER_SIZE)) != -1) {
                out.write(data, 0, count);
                bytesRead += BUFFER_SIZE;
              }
              timer.cancel();
              origin.close();
            }
          }
          cb.updateProgress(1, 1, destFile); // force 100%
          out.close();
        } catch (Exception ex) {
          ex.printStackTrace();
          cb.updateProgress(0, 1, destFile); // force 0%
          promise.reject(null, String.format("Couldn't zip %s", destFile));
        }
        promise.resolve(destFile);
      }
    });

    t.setUncaughtExceptionHandler(h);
    t.start();
  }

    /**
   * Return the uncompressed size of the ZipFile (only works for files on disk, not in assets)
   *
   * @return -1 on failure
   */
  private long getUncompressedSize(String[] files) {
    long totalSize = 0;
    for (int i = 0; i < files.length; i++) {
      File file = new File(files[i]);
      long fileSize = file.length();
      if (fileSize != -1) {
        totalSize += fileSize;
      }
    }
    return totalSize;
  }
}
