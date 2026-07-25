package com.rnziparchive;

import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import java.util.Arrays;
import java.util.Collections;

import org.junit.Test;

public class EntryMatchesSelectionTest {

  @Test
  public void matchesExactFile() {
    assertTrue(RNZipArchiveModule.entryMatchesSelection(
        "hello.txt", Collections.singletonList("hello.txt")));
  }

  @Test
  public void matchesExactFileIgnoringTrailingSlashOnWanted() {
    assertTrue(RNZipArchiveModule.entryMatchesSelection(
        "dir", Collections.singletonList("dir/")));
  }

  @Test
  public void matchesDirectoryPrefix() {
    assertTrue(RNZipArchiveModule.entryMatchesSelection(
        "docs/readme.md", Collections.singletonList("docs")));
    assertTrue(RNZipArchiveModule.entryMatchesSelection(
        "docs/readme.md", Collections.singletonList("docs/")));
  }

  @Test
  public void doesNotMatchUnrelatedPrefix() {
    assertFalse(RNZipArchiveModule.entryMatchesSelection(
        "documentation/readme.md", Collections.singletonList("docs")));
  }

  @Test
  public void matchesAnyOfMultipleWantedEntries() {
    assertTrue(RNZipArchiveModule.entryMatchesSelection(
        "b.txt", Arrays.asList("a.txt", "b.txt")));
  }

  @Test
  public void normalizesBackslashes() {
    assertTrue(RNZipArchiveModule.entryMatchesSelection(
        "folder\\file.txt", Collections.singletonList("folder/file.txt")));
  }
}
