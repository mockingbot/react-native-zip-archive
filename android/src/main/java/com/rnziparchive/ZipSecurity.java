package com.rnziparchive;

import java.io.File;
import java.io.IOException;

import net.lingala.zip4j.model.UnzipParameters;

/**
 * Validates zip extraction paths to prevent Zip Slip / path traversal attacks.
 */
public final class ZipSecurity {

  private ZipSecurity() {
    // utility class
  }

  /**
   * Returns extraction parameters with symlink extraction disabled. zip4j enables symlink
   * extraction by default but does not validate that a symlink's resolved target stays inside
   * the destination directory, allowing archives to plant links escaping the extraction root
   * (see issue #357). With symlinks disabled, zip4j skips symlink entries entirely.
   */
  public static UnzipParameters createExtractParameters() {
    UnzipParameters params = new UnzipParameters();
    params.setExtractSymbolicLinks(false);
    return params;
  }

  /**
   * Ensures that extracting {@code entryName} into {@code destDirectory} would not escape the
   * destination directory (e.g. via {@code ../} or absolute paths).
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
