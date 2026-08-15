package com.rnziparchive;

import static org.junit.Assert.assertEquals;

import net.lingala.zip4j.exception.ZipException;

import org.junit.Test;

public class ZipErrorCodesTest {

  @Test
  public void mapsSecurityExceptionToUnsafePath() {
    assertEquals(
        ZipErrorCodes.UNSAFE_PATH,
        ZipErrorCodes.mapException(new SecurityException("traversal"), ZipErrorCodes.UNZIP));
  }

  @Test
  public void mapsWrongPasswordZipException() {
    ZipException ex = new ZipException("bad password", ZipException.Type.WRONG_PASSWORD);
    assertEquals(ZipErrorCodes.WRONG_PASSWORD, ZipErrorCodes.mapException(ex, ZipErrorCodes.UNZIP));
  }

  @Test
  public void mapsUnknownExceptionToFallback() {
    assertEquals(
        ZipErrorCodes.ZIP,
        ZipErrorCodes.mapException(new RuntimeException("boom"), ZipErrorCodes.ZIP));
  }
}
