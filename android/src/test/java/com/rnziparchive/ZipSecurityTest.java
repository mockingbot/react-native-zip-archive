package com.rnziparchive;

import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.TemporaryFolder;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Base64;

import net.lingala.zip4j.ZipFile;
import net.lingala.zip4j.model.FileHeader;

import static org.junit.Assert.assertFalse;
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

  // Zip archive containing a single symlink entry: link_to_outside -> ../outside_target.txt
  // (generated with `zip -y`, stored base64-encoded to keep the test hermetic)
  private static final String SYMLINK_ZIP_BASE64 =
      "UEsDBAoAAAAAAF1A9ly9NpyqFQAAABUAAAAPABwAbGlua190b19vdXRzaWRlVVQJAAOyCGBqsghganV4"
      + "CwABBPUBAAAEFAAAAC4uL291dHNpZGVfdGFyZ2V0LnR4dFBLAQIeAwoAAAAAAF1A9ly9NpyqFQAAABUA"
      + "AAAPABgAAAAAAAAAAADtoQAAAABsaW5rX3RvX291dHNpZGVVVAUAA7IIYGp1eAsAAQT1AQAABBQAAABQ"
      + "SwUGAAAAAAEAAQBVAAAAXgAAAAAA";

  private File writeSymlinkFixture() throws IOException {
    File zip = temporaryFolder.newFile("symlink.zip");
    Files.write(zip.toPath(), Base64.getDecoder().decode(SYMLINK_ZIP_BASE64));
    return zip;
  }

  @Test
  public void createExtractParameters_disablesSymlinkExtraction() {
    assertFalse(ZipSecurity.createExtractParameters().isExtractSymbolicLinks());
  }

  @Test
  public void extractWithZipSecurityParams_doesNotCreateSymlink() throws Exception {
    File zip = writeSymlinkFixture();
    File dest = temporaryFolder.newFolder("dest");

    try (ZipFile zipFile = new ZipFile(zip)) {
      for (FileHeader header : zipFile.getFileHeaders()) {
        ZipSecurity.validateExtractPath(dest.getAbsolutePath(), header.getFileName());
        zipFile.extractFile(header, dest.getAbsolutePath(), ZipSecurity.createExtractParameters());
      }
    }

    Path link = dest.toPath().resolve("link_to_outside");
    assertFalse("symlink entry must not be materialized (#357)",
        Files.exists(link, java.nio.file.LinkOption.NOFOLLOW_LINKS));
    assertFalse("nothing may appear outside dest",
        Files.exists(dest.toPath().resolve("../outside_target.txt")));
  }

  @Test
  public void extractWithDefaultParams_createsEscapingSymlink() throws Exception {
    // Control test: proves the fixture exercises the vulnerable zip4j default path,
    // i.e. the params from createExtractParameters() are what close the hole.
    File zip = writeSymlinkFixture();
    File dest = temporaryFolder.newFolder("dest");
    // The symlink target must exist for toRealPath() resolution below
    Files.write(temporaryFolder.getRoot().toPath().resolve("outside_target.txt"), new byte[0]);

    try (ZipFile zipFile = new ZipFile(zip)) {
      FileHeader header = zipFile.getFileHeaders().get(0);
      zipFile.extractFile(header, dest.getAbsolutePath());
    }

    Path link = dest.toPath().resolve("link_to_outside");
    assertTrue("control: zip4j defaults should create a symlink", Files.isSymbolicLink(link));
    assertFalse("control: the default-created symlink escapes dest",
        link.toRealPath().startsWith(dest.toPath().toRealPath()));
  }
}
