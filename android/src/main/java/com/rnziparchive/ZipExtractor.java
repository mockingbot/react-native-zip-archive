package com.rnziparchive;

import java.io.File;

import net.lingala.zip4j.ZipFile;
import net.lingala.zip4j.model.FileHeader;

/**
 * Shared extract path for full unzip, selective unzip, and tests.
 * Directory entries are created. Symlinks stay off. Paths that leave the destination throw.
 */
public final class ZipExtractor {

  private ZipExtractor() {
  }

  public static void extractAll(ZipFile zipFile, String destDirectory) throws Exception {
    File destDir = new File(destDirectory);
    if (!destDir.exists()) {
      //noinspection ResultOfMethodCallIgnored
      destDir.mkdirs();
    }
    for (FileHeader fileHeader : zipFile.getFileHeaders()) {
      extractEntry(zipFile, destDirectory, fileHeader);
    }
  }

  public static void extractEntry(ZipFile zipFile, String destDirectory, FileHeader fileHeader) throws Exception {
    String entryName = fileHeader.getFileName();
    ZipSecurity.validateExtractPath(destDirectory, entryName);
    File target = new File(destDirectory, entryName);
    String targetCanonical = target.getCanonicalPath();
    String destCanonical = new File(destDirectory).getCanonicalPath();
    // "." and "foo/.." resolve to the destination itself. Do not open that path as a file.
    if (fileHeader.isDirectory() || targetCanonical.equals(destCanonical)) {
      if (!targetCanonical.equals(destCanonical)) {
        //noinspection ResultOfMethodCallIgnored
        target.mkdirs();
      }
      return;
    }
    zipFile.extractFile(fileHeader, destDirectory, ZipSecurity.createExtractParameters());
  }
}
