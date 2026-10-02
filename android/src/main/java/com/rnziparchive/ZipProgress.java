package com.rnziparchive;

import java.io.File;
import java.util.ArrayList;
import java.util.List;

/**
 * Progress math shared by zip and unzip so events stay inside 0–1.
 * Unknown sizes must not rewind the value (ZipInputStream reports compressed size -1).
 */
public final class ZipProgress {

  private ZipProgress() {
  }

  /**
   * @return a progress fraction in {@code [0, 1]}. A non-positive total yields 0
   *         so callers can force 0% / 100% with an explicit {@code (0, 1)} or {@code (1, 1)}.
   */
  public static double fraction(long done, long total) {
    if (total <= 0 || done <= 0) {
      return 0;
    }
    double value = (double) done / (double) total;
    if (value > 1) {
      return 1;
    }
    return value;
  }

  /**
   * Bytes to attribute to one {@code unzipAssets} entry.
   * Prefer the entry compressed size when the local header has it.
   * {@code ZipInputStream} often returns -1 (data descriptor); fall back to bytes copied
   * and never return a negative delta.
   */
  public static long assetEntryDelta(long compressedSize, long bytesCopied) {
    if (compressedSize > 0) {
      return compressedSize;
    }
    if (bytesCopied > 0) {
      return bytesCopied;
    }
    return 0;
  }

  /**
   * Next {@code unzipAssets} byte count. Unknown compressed sizes (-1) contribute the
   * bytes copied, and the running total stays under 99% of the archive until the caller
   * emits the explicit 100% event.
   */
  public static long advanceAssetBytes(long extractedBytes, long archiveSize, long compressedSize, long bytesCopied) {
    long next = extractedBytes + assetEntryDelta(compressedSize, bytesCopied);
    if (next < 0) {
      next = 0;
    }
    if (archiveSize > 0 && next > archiveSize * 0.99) {
      return (long) (archiveSize * 0.99);
    }
    return next;
  }

  /**
   * Progress events {@code processZip} emits for these paths: explicit 0, one tick per
   * work unit, then explicit 1. The total is fixed up front.
   */
  public static List<Double> events(List<String> entries) {
    int totalFiles = countWorkUnits(entries);
    long progressTotal = Math.max(totalFiles, 1);
    List<Double> planned = new ArrayList<>();
    planned.add(fraction(0, progressTotal));
    for (int i = 1; i <= totalFiles; i++) {
      planned.add(fraction(i, progressTotal));
    }
    planned.add(fraction(1, 1));
    return planned;
  }

  /**
   * Work units for a {@code zip} / {@code zipWithPassword} call, counted up front so
   * progress cannot move backwards while the total grows.
   * A file is one unit. A directory is one unit per immediate child (a nested folder
   * is added as a single folder entry, matching {@code processZip}).
   * Missing paths are omitted; the zip loop rejects those itself.
   */
  public static int countWorkUnits(List<String> entries) {
    if (entries == null) {
      return 0;
    }
    int total = 0;
    for (String path : entries) {
      if (path == null) {
        continue;
      }
      File file = new File(path);
      if (!file.exists()) {
        continue;
      }
      if (file.isDirectory()) {
        File[] children = file.listFiles();
        if (children != null) {
          total += children.length;
        }
      } else {
        total += 1;
      }
    }
    return total;
  }
}
