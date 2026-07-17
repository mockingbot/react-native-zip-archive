package com.rnziparchive;

import java.io.File;
import java.io.IOException;

/**
 * Validates zip extraction paths to prevent Zip Slip / path traversal attacks.
 */
public final class ZipSecurity {

  private ZipSecurity() {
    // utility class
  }

  /**
   * Ensures that extracting {@code entryName} into {@code destDirectory} would not escape the
   * destination directory (e.g. via {@code ../} or absolute paths).
   *
   * @param destDirectory the target extraction directory
   * @param entryName     the zip entry name
   * @throws IOException          if canonical paths cannot be resolved
   * @throws SecurityException    if the entry would be extracted outside {@code destDirectory}
   */
  public static void validateExtractPath(String destDirectory, String entryName) throws IOException {
    File destDir = new File(destDirectory);
    File fout = new File(destDir, entryName);

    String canonicalPath = fout.getCanonicalPath();
    String destDirCanonicalPath = destDir.getCanonicalPath() + File.separator;

    if (!canonicalPath.startsWith(destDirCanonicalPath)) {
      throw new SecurityException(String.format("Found Zip Path Traversal Vulnerability with %s", canonicalPath));
    }
  }
}
