package com.rnziparchive;

import static org.junit.Assert.assertEquals;

import org.junit.Test;

public class ZipEncryptionChoiceTest {

  @Test
  public void emptyAndStandardStayZipCrypto() {
    assertEquals(ZipEncryptionChoice.Kind.STANDARD, ZipEncryptionChoice.parse(null));
    assertEquals(ZipEncryptionChoice.Kind.STANDARD, ZipEncryptionChoice.parse(""));
    assertEquals(ZipEncryptionChoice.Kind.STANDARD, ZipEncryptionChoice.parse("STANDARD"));
  }

  @Test
  public void aesKeySizes() {
    assertEquals(ZipEncryptionChoice.Kind.AES_128, ZipEncryptionChoice.parse("AES-128"));
    assertEquals(ZipEncryptionChoice.Kind.AES_256, ZipEncryptionChoice.parse("AES-256"));
    assertEquals(ZipEncryptionChoice.Kind.AES_128, ZipEncryptionChoice.parse("AES"));
  }

  @Test
  public void unknownMethodFallsBackToStandard() {
    assertEquals(ZipEncryptionChoice.Kind.STANDARD, ZipEncryptionChoice.parse("PKWARE"));
  }
}
