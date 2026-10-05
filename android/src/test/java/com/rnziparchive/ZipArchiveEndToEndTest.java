package com.rnziparchive;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;
import static org.junit.Assert.fail;

import java.io.File;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import net.lingala.zip4j.ZipFile;
import net.lingala.zip4j.model.ZipParameters;
import net.lingala.zip4j.model.enums.AesKeyStrength;
import net.lingala.zip4j.model.enums.CompressionMethod;
import net.lingala.zip4j.model.enums.EncryptionMethod;

import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.TemporaryFolder;

/**
 * End-to-end coverage of the zip/unzip behavior the native module calls:
 * real files, real zip bytes, then {@link ZipProgress}, {@link ZipExtractor},
 * {@link ZipErrorCodes}, and {@link ZipEncryptionChoice}.
 */
public class ZipArchiveEndToEndTest {

  @Rule
  public TemporaryFolder temporaryFolder = new TemporaryFolder();

  @Test
  public void zipProgress_fileThenFolder_staysMonotonicAndDoesNotFinishEarly() throws Exception {
    File file = temporaryFolder.newFile("a.txt");
    Files.write(file.toPath(), "alpha".getBytes(StandardCharsets.UTF_8));
    File folder = temporaryFolder.newFolder("dir");
    Files.write(new File(folder, "b.txt").toPath(), "bravo".getBytes(StandardCharsets.UTF_8));
    Files.write(new File(folder, "c.txt").toPath(), "charlie".getBytes(StandardCharsets.UTF_8));

    List<Double> events = ZipProgress.events(Arrays.asList(
        file.getAbsolutePath(),
        folder.getAbsolutePath()));

    assertEquals(0, events.get(0), 0);
    assertEquals(1, events.get(events.size() - 1), 0);
    assertTrue("first unit reported 100% while later units were still pending: " + events,
        events.get(1) < 1);
    assertMonotonic(events);
  }

  @Test
  public void unzipAssetsProgress_unknownCompressedSize_doesNotRewind() {
    long archiveSize = 1000;
    long extracted = 0;
    List<Double> events = new ArrayList<>();
    events.add(ZipProgress.fraction(extracted, archiveSize));

    // Second entry matches ZipInputStream, which reports compressed size -1.
    long[] compressedSizes = {200, -1};
    long[] bytesCopied = {800, 50};
    for (int i = 0; i < compressedSizes.length; i++) {
      extracted = ZipProgress.advanceAssetBytes(
          extracted, archiveSize, compressedSizes[i], bytesCopied[i]);
      events.add(ZipProgress.fraction(extracted, archiveSize));
    }
    events.add(1.0);

    assertMonotonic(events);
    assertTrue(events.get(events.size() - 1) <= 1);
  }

  @Test
  public void roundTrip_keepsEmptyDirectoryAndFileBytes() throws Exception {
    File note = temporaryFolder.newFile("note.txt");
    Files.write(note.toPath(), "hello-e2e".getBytes(StandardCharsets.UTF_8));
    File empty = temporaryFolder.newFolder("empty");

    File zipPath = temporaryFolder.newFile("out.zip");
    // newFile creates a zero-byte file; zip4j wants to create it.
    assertTrue(zipPath.delete());
    ZipParameters params = new ZipParameters();
    params.setCompressionMethod(CompressionMethod.DEFLATE);
    try (ZipFile zip = new ZipFile(zipPath)) {
      zip.addFile(note, params);
      zip.addFolder(empty, params);
    }

    File dest = temporaryFolder.newFolder("dest");
    try (ZipFile zip = new ZipFile(zipPath)) {
      ZipExtractor.extractAll(zip, dest.getAbsolutePath());
    }

    File extractedNote = new File(dest, "note.txt");
    File extractedEmpty = new File(dest, "empty");
    assertEquals("hello-e2e", new String(Files.readAllBytes(extractedNote.toPath()), StandardCharsets.UTF_8));
    assertTrue("empty directory was dropped on extract; dest has [" + names(dest) + "]",
        extractedEmpty.isDirectory());
  }

  @Test
  public void roundTrip_rejectsPathTraversalAndWritesNothingOutsideDest() throws Exception {
    File payload = temporaryFolder.newFile("payload.txt");
    Files.write(payload.toPath(), "nope".getBytes(StandardCharsets.UTF_8));
    File zipPath = temporaryFolder.newFile("slip.zip");
    assertTrue(zipPath.delete());

    ZipParameters params = new ZipParameters();
    params.setFileNameInZip("../evil.txt");
    try (ZipFile zip = new ZipFile(zipPath)) {
      zip.addFile(payload, params);
    }

    File dest = temporaryFolder.newFolder("dest");
    try (ZipFile zip = new ZipFile(zipPath)) {
      ZipExtractor.extractAll(zip, dest.getAbsolutePath());
      fail("traversal entry was extracted");
    } catch (SecurityException ex) {
      assertTrue(ex.getMessage().contains("Zip Path Traversal"));
    }
    assertFalse(new File(temporaryFolder.getRoot(), "evil.txt").exists());
    assertFalse(new File(dest, "evil.txt").exists());
  }

  @Test
  public void roundTrip_acceptsEntryNamedDot() throws Exception {
    File payload = temporaryFolder.newFile("payload.txt");
    Files.write(payload.toPath(), "dot".getBytes(StandardCharsets.UTF_8));
    File zipPath = temporaryFolder.newFile("dot.zip");
    assertTrue(zipPath.delete());

    ZipParameters params = new ZipParameters();
    params.setFileNameInZip(".");
    try (ZipFile zip = new ZipFile(zipPath)) {
      zip.addFile(payload, params);
    }

    File dest = temporaryFolder.newFolder("dest");
    try (ZipFile zip = new ZipFile(zipPath)) {
      ZipExtractor.extractAll(zip, dest.getAbsolutePath());
    }
    assertTrue(dest.isDirectory());
  }

  @Test
  public void missingArchive_mapsToFileNotFound() throws Exception {
    File missing = new File(temporaryFolder.getRoot(), "missing.zip");
    try (ZipFile zip = new ZipFile(missing)) {
      zip.getComment();
      fail("missing archive should throw");
    } catch (Exception ex) {
      assertEquals(
          "missing archive was " + ex.getClass().getSimpleName() + ": " + ex.getMessage(),
          ZipErrorCodes.FILE_NOT_FOUND,
          ZipErrorCodes.mapException(ex, ZipErrorCodes.UNZIP));
    }
  }

  @Test
  public void bareAes_roundTripsFileBytes() throws Exception {
    assertEquals(ZipEncryptionChoice.Kind.AES_128, ZipEncryptionChoice.parse("AES"));

    File src = temporaryFolder.newFile("secret.txt");
    Files.write(src.toPath(), "topsecret".getBytes(StandardCharsets.UTF_8));
    File zipPath = temporaryFolder.newFile("aes.zip");
    assertTrue(zipPath.delete());

    ZipParameters parameters = new ZipParameters();
    parameters.setCompressionMethod(CompressionMethod.DEFLATE);
    parameters.setEncryptFiles(true);
    parameters.setEncryptionMethod(EncryptionMethod.AES);
    parameters.setAesKeyStrength(
        ZipEncryptionChoice.parse("AES") == ZipEncryptionChoice.Kind.AES_256
            ? AesKeyStrength.KEY_STRENGTH_256
            : AesKeyStrength.KEY_STRENGTH_128);

    try (ZipFile zip = new ZipFile(zipPath, "pw".toCharArray())) {
      zip.addFile(src, parameters);
    }

    File dest = temporaryFolder.newFolder("aes-out");
    try (ZipFile zip = new ZipFile(zipPath, "pw".toCharArray())) {
      zip.extractAll(dest.getAbsolutePath());
    }
    assertEquals("topsecret",
        new String(Files.readAllBytes(new File(dest, "secret.txt").toPath()), StandardCharsets.UTF_8));
  }

  private static void assertMonotonic(List<Double> events) {
    assertTrue("expected a start and an end event, got " + events, events.size() >= 2);
    for (int i = 1; i < events.size(); i++) {
      assertTrue("progress moved backwards at index " + i + ": " + events,
          events.get(i) + 1e-9 >= events.get(i - 1));
      assertTrue("progress left 0..1 at index " + i + ": " + events,
          events.get(i) >= 0 && events.get(i) <= 1);
    }
  }

  private static String names(File dir) {
    File[] files = dir.listFiles();
    if (files == null) {
      return "(unreadable)";
    }
    StringBuilder builder = new StringBuilder();
    for (File file : files) {
      builder.append(file.getName());
      if (file.isDirectory()) {
        builder.append('/');
      }
      builder.append(' ');
    }
    return builder.toString();
  }
}
