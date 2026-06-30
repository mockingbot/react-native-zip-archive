package com.rnziparchive;

import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.TemporaryFolder;

import java.io.File;
import java.io.IOException;

import static org.junit.Assert.assertTrue;
import static org.junit.Assert.fail;

public class ZipSecurityTest {

  @Rule
  public TemporaryFolder temporaryFolder = new TemporaryFolder();

  @Test
  public void validateExtractPath_acceptsSafeNestedEntry() throws IOException {
    File dest = temporaryFolder.newFolder("dest");

    // Should not throw
    ZipSecurity.validateExtractPath(dest.getAbsolutePath(), "folder/file.txt");
  }

  @Test
  public void validateExtractPath_rejectsParentDirectoryTraversal() throws IOException {
    File dest = temporaryFolder.newFolder("dest");

    try {
      ZipSecurity.validateExtractPath(dest.getAbsolutePath(), "../evil.txt");
      fail("Expected SecurityException for traversal entry");
    } catch (SecurityException ex) {
      assertTrue(ex.getMessage().contains("Zip Path Traversal Vulnerability"));
    }
  }

  @Test
  public void validateExtractPath_rejectsDeepTraversal() throws IOException {
    File dest = temporaryFolder.newFolder("dest");

    try {
      ZipSecurity.validateExtractPath(dest.getAbsolutePath(), "a/../../evil.txt");
      fail("Expected SecurityException for deep traversal entry");
    } catch (SecurityException ex) {
      assertTrue(ex.getMessage().contains("Zip Path Traversal Vulnerability"));
    }
  }

  @Test
  public void validateExtractPath_acceptsEntryInSubdirectoryNamedLikeTraversal() throws IOException {
    File dest = temporaryFolder.newFolder("dest");

    // A directory name that contains ".." is not traversal as long as it stays inside dest
    ZipSecurity.validateExtractPath(dest.getAbsolutePath(), "foo..bar/baz.txt");
  }
}
