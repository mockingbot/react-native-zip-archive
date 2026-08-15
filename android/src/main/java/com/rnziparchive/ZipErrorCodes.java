package com.rnziparchive;

import net.lingala.zip4j.exception.ZipException;

/**
 * Stable promise rejection codes shared with the JS API and iOS implementation.
 */
public final class ZipErrorCodes {
  public static final String FILE_NOT_FOUND = "ERR_FILE_NOT_FOUND";
  public static final String INVALID_PATH = "ERR_INVALID_PATH";
  public static final String INVALID_ARGS = "ERR_INVALID_ARGS";
  public static final String WRONG_PASSWORD = "ERR_WRONG_PASSWORD";
  public static final String NOT_PASSWORD_PROTECTED = "ERR_NOT_PASSWORD_PROTECTED";
  public static final String CORRUPT_ARCHIVE = "ERR_CORRUPT_ARCHIVE";
  public static final String UNSAFE_PATH = "ERR_UNSAFE_PATH";
  public static final String CANCELLED = "ERR_CANCELLED";
  public static final String BUSY = "ERR_BUSY";
  public static final String ZIP = "ERR_ZIP";
  public static final String UNZIP = "ERR_UNZIP";
  public static final String UNSUPPORTED = "ERR_UNSUPPORTED";

  private ZipErrorCodes() {
  }

  public static String mapException(Exception ex, String fallback) {
    if (ex instanceof SecurityException) {
      return UNSAFE_PATH;
    }
    if (ex instanceof ZipException) {
      ZipException zipException = (ZipException) ex;
      if (zipException.getType() == ZipException.Type.WRONG_PASSWORD) {
        return WRONG_PASSWORD;
      }
      String message = zipException.getMessage();
      if (message != null) {
        String lower = message.toLowerCase();
        if (lower.contains("not a zip") || lower.contains("corrupt")
            || lower.contains("invalid") || lower.contains("malformed")) {
          return CORRUPT_ARCHIVE;
        }
        if (lower.contains("password")) {
          return WRONG_PASSWORD;
        }
      }
    }
    if (ex instanceof java.io.FileNotFoundException) {
      return FILE_NOT_FOUND;
    }
    return fallback;
  }
}
