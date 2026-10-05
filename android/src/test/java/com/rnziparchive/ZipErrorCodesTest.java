package com.rnziparchive;

import static org.junit.Assert.assertEquals;

import java.nio.charset.UnsupportedCharsetException;

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

  @Test
  public void mapsMissingZipFileToFileNotFound() {
    assertEquals(
        ZipErrorCodes.FILE_NOT_FOUND,
        ZipErrorCodes.mapException(new ZipException("zip file does not exist"), ZipErrorCodes.UNZIP));
  }

  @Test
  public void mapsUnsupportedCharsetToUnsupported() {
    assertEquals(
        ZipErrorCodes.UNSUPPORTED,
        ZipErrorCodes.mapException(new UnsupportedCharsetException("not-a-charset"), ZipErrorCodes.UNZIP));
  }
}
