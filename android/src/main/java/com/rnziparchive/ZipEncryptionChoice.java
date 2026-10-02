package com.rnziparchive;

/**
 * Maps the JS encryption method string onto ZipCrypto or WinZip-AES.
 * Empty and {@code STANDARD} stay ZipCrypto. A bare {@code AES} (no key size) is AES-128.
 * Anything else falls back to ZipCrypto instead of throwing.
 */
public final class ZipEncryptionChoice {

  public enum Kind {
    STANDARD,
    AES_128,
    AES_256
  }

  private ZipEncryptionChoice() {
  }

  public static Kind parse(String encryptionMethod) {
    if (encryptionMethod == null || encryptionMethod.isEmpty() || "STANDARD".equals(encryptionMethod)) {
      return Kind.STANDARD;
    }
    if (encryptionMethod.startsWith("AES")) {
      if (encryptionMethod.endsWith("256")) {
        return Kind.AES_256;
      }
      return Kind.AES_128;
    }
    return Kind.STANDARD;
  }
}
