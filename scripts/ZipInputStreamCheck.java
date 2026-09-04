import java.io.BufferedInputStream;
import java.io.FileInputStream;
import java.io.IOException;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

/**
 * Extract a zip with stock {@link ZipInputStream} (the #333 / #323 server-side check).
 * Exits 0 if at least one file entry drains; 1 on extract failure; 2 on usage error.
 */
public final class ZipInputStreamCheck {
  private ZipInputStreamCheck() {}

  public static void main(String[] args) throws IOException {
    if (args.length != 1) {
      System.err.println("Usage: ZipInputStreamCheck <file.zip>");
      System.exit(2);
    }

    final String zipPath = args[0];
    int files = 0;
    try (ZipInputStream zis =
        new ZipInputStream(new BufferedInputStream(new FileInputStream(zipPath)))) {
      final byte[] buf = new byte[8192];
      ZipEntry entry;
      while ((entry = zis.getNextEntry()) != null) {
        if (!entry.isDirectory()) {
          while (zis.read(buf) != -1) {
            // drain
          }
          files++;
        }
        zis.closeEntry();
      }
    }

    if (files < 1) {
      System.err.println("Java ZipInputStream: no file entries extracted from " + zipPath);
      System.exit(1);
    }
    System.out.println("OK java ZipInputStream " + zipPath + " files=" + files);
  }
}
