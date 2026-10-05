package com.rnziparchive;

import static org.junit.Assert.assertEquals;

import java.io.File;
import java.nio.file.Files;
import java.util.Arrays;
import java.util.Collections;

import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.TemporaryFolder;

public class ZipProgressTest {

  @Rule
  public TemporaryFolder temporaryFolder = new TemporaryFolder();

  @Test
  public void fraction_staysInsideZeroToOne() {
    assertEquals(0, ZipProgress.fraction(-5, 10), 0);
    assertEquals(0, ZipProgress.fraction(0, 10), 0);
    assertEquals(0, ZipProgress.fraction(1, 0), 0);
    assertEquals(0.5, ZipProgress.fraction(1, 2), 0);
    assertEquals(1, ZipProgress.fraction(5, 2), 0);
  }

  @Test
  public void assetEntryDelta_neverNegative() {
    assertEquals(0, ZipProgress.assetEntryDelta(-1, -1));
    assertEquals(12, ZipProgress.assetEntryDelta(-1, 12));
    assertEquals(8, ZipProgress.assetEntryDelta(8, 100));
    assertEquals(0, ZipProgress.assetEntryDelta(0, 0));
  }

  @Test
  public void countWorkUnits_isStableForMixedFilesAndFolders() throws Exception {
    File root = temporaryFolder.getRoot();
    File file = new File(root, "a.txt");
    Files.write(file.toPath(), new byte[] {'h', 'i'});
    File folder = new File(root, "dir");
    assertEquals(true, folder.mkdir());
    assertEquals(true, new File(folder, "b.txt").createNewFile());
    assertEquals(true, new File(folder, "c.txt").createNewFile());
    File nested = new File(folder, "nested");
    assertEquals(true, nested.mkdir());
    assertEquals(true, new File(nested, "d.txt").createNewFile());

    // One file, plus three immediate children of dir (b, c, nested). Nested contents
    // are one folder unit, matching processZip's addFolder call.
    int total = ZipProgress.countWorkUnits(Arrays.asList(
        file.getAbsolutePath(),
        folder.getAbsolutePath()));
    assertEquals(4, total);

    // The same total is used for every tick, so progress cannot move backwards
    // the way a running total did after the first file already reported 100%.
    double afterFirstFile = ZipProgress.fraction(1, total);
    double afterNext = ZipProgress.fraction(2, total);
    assertEquals(0.25, afterFirstFile, 0);
    assertEquals(0.5, afterNext, 0);
  }

  @Test
  public void countWorkUnits_skipsMissingPaths() {
    assertEquals(0, ZipProgress.countWorkUnits(Collections.singletonList("/no/such/file")));
    assertEquals(0, ZipProgress.countWorkUnits(null));
  }
}
