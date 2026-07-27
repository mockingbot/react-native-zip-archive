import React, { useState } from 'react';
import {
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import RNFS from 'react-native-fs';
import { ResultCard } from '../components/ResultCard';
import { CodePreview } from '../components/CodePreview';
import { ensureDir, listFilesRecursive } from '../utils/fileSystem';
import {
  zip,
  zipWithPassword,
  listContents,
  unzip,
  unzipWithPassword,
  type ZipEntry,
} from 'react-native-zip-archive';

const SOURCE_CODE = `import { listContents, unzip, unzipWithPassword } from 'react-native-zip-archive';

const entries = await listContents(sourceZip);
await unzip(sourceZip, outputFolder, ['readme.md', 'docs']);
await unzipWithPassword(sourceZip, outputFolder, 'secret', ['readme.md']);
`;

export default function ListContentsScreen() {
  const [loading, setLoading] = useState(false);
  const [entries, setEntries] = useState<ZipEntry[]>([]);
  const [extractedFiles, setExtractedFiles] = useState<string[]>([]);
  const [resultTitle, setResultTitle] = useState('Result');
  const [result, setResult] = useState<string>('');
  const [notExtracted, setNotExtracted] = useState<string[]>([]);
  const [error, setError] = useState<string>('');
  const [zipPath, setZipPath] = useState<string>('');

  const createPlainDemoZip = async () => {
    const dir = RNFS.DocumentDirectoryPath + '/demo-list/';
    await ensureDir(dir);
    await ensureDir(dir + 'docs/');
    await RNFS.writeFile(dir + 'hello.txt', 'Hello from zip!', 'utf8');
    await RNFS.writeFile(dir + 'readme.md', '# Demo', 'utf8');
    await RNFS.writeFile(dir + 'docs/guide.md', '# Guide', 'utf8');
    const target = RNFS.DocumentDirectoryPath + '/demo-list-sample.zip';
    try {
      if (await RNFS.exists(target)) await RNFS.unlink(target);
    } catch {}
    await zip(dir, target, 0);
    return target;
  };

  const createPasswordDemoZip = async () => {
    const dir = RNFS.DocumentDirectoryPath + '/demo-list-pw/';
    await ensureDir(dir);
    await ensureDir(dir + 'docs/');
    await RNFS.writeFile(dir + 'hello.txt', 'Hello from zip!', 'utf8');
    await RNFS.writeFile(dir + 'readme.md', '# Demo', 'utf8');
    await RNFS.writeFile(dir + 'docs/guide.md', '# Guide', 'utf8');
    const target = RNFS.DocumentDirectoryPath + '/demo-list-password.zip';
    try {
      if (await RNFS.exists(target)) await RNFS.unlink(target);
    } catch {}
    await zipWithPassword(dir, target, 'secret', 'STANDARD', 0);
    return target;
  };

  const summarizeExtraction = (files: string[]) => {
    const normalized = files.map((f) => f.replace(/\\/g, '/'));
    const missing = ['hello.txt'].filter(
      (name) => !normalized.some((f) => f === name || f.endsWith('/' + name))
    );
    return { files: normalized, missing };
  };

  const handleList = async () => {
    setLoading(true);
    setError('');
    setEntries([]);
    setExtractedFiles([]);
    setNotExtracted([]);
    setResult('');
    try {
      const path = await createPlainDemoZip();
      setZipPath(path);
      const listed = await listContents(path);
      setEntries(listed);
      setResultTitle('Listed Entries');
      setResult(`Listed ${listed.length} entries`);
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  const handleSelective = async () => {
    if (!zipPath) return;
    setLoading(true);
    setError('');
    setExtractedFiles([]);
    setNotExtracted([]);
    try {
      const out = RNFS.DocumentDirectoryPath + '/selective/' + Date.now() + '/';
      await ensureDir(out);
      const path = await unzip(zipPath, out, ['readme.md', 'docs']);
      const { files, missing } = summarizeExtraction(await listFilesRecursive(out));
      setExtractedFiles(files);
      setNotExtracted(missing);
      setResultTitle('Selective Extract');
      setResult(`Selective extract to ${path}`);
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSelective = async () => {
    setLoading(true);
    setError('');
    setEntries([]);
    setExtractedFiles([]);
    setNotExtracted([]);
    setResult('');
    try {
      const source = await createPasswordDemoZip();
      const out = RNFS.DocumentDirectoryPath + '/selective-pw/' + Date.now() + '/';
      await ensureDir(out);
      const path = await unzipWithPassword(source, out, 'secret', ['readme.md']);
      const { files, missing } = summarizeExtraction(await listFilesRecursive(out));
      setExtractedFiles(files);
      setNotExtracted(missing);
      setResultTitle('Password Selective Extract');
      setResult(`Password selective extract to ${path}`);
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }}>
      <Text style={styles.section}>Demo: List Contents</Text>
      <TouchableOpacity
        style={styles.actionBtn}
        onPress={handleList}
        disabled={loading}
        accessibilityLabel="Create Zip and List Contents"
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.actionText}>Create Zip & List Contents</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.section}>Demo: Selective Extract</Text>
      <TouchableOpacity
        style={[styles.actionBtn, !zipPath && styles.disabledBtn]}
        onPress={handleSelective}
        disabled={loading || !zipPath}
        accessibilityLabel="Extract Selected Entries"
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.actionText}>Extract readme.md + docs/</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.section}>Demo: Password Selective Extract</Text>
      <TouchableOpacity
        style={styles.actionBtn}
        onPress={handlePasswordSelective}
        disabled={loading}
        accessibilityLabel="Password Selective Extract"
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.actionText}>Extract readme.md with Password</Text>
        )}
      </TouchableOpacity>

      {result ? (
        <ResultCard title={resultTitle} variant="success">
          <Text style={styles.mono}>{result}</Text>
          {entries.length > 0 && (
            <>
              <Text style={styles.subHeading}>Entries:</Text>
              {entries.map((entry) => (
                <Text key={entry.path} style={styles.fileItem}>
                  • {entry.path}
                  {entry.isDirectory ? '/' : ''} ({entry.size} B)
                </Text>
              ))}
            </>
          )}
          {extractedFiles.length > 0 && (
            <>
              <Text style={styles.subHeading}>Extracted:</Text>
              {extractedFiles.map((f) => (
                <Text key={f} style={styles.fileItem}>
                  • {f}
                </Text>
              ))}
            </>
          )}
          {notExtracted.length > 0 && (
            <>
              <Text style={styles.subHeading}>Not extracted:</Text>
              {notExtracted.map((f) => (
                <Text key={f} style={styles.fileItem} accessibilityLabel={`Not extracted ${f}`}>
                  • {f}
                </Text>
              ))}
            </>
          )}
        </ResultCard>
      ) : null}

      {error ? (
        <ResultCard title="Error" variant="error">
          <Text style={styles.mono}>{error}</Text>
        </ResultCard>
      ) : null}

      <CodePreview code={SOURCE_CODE} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  section: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  actionBtn: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  disabledBtn: {
    backgroundColor: '#A1A1AA',
  },
  actionText: {
    color: '#fff',
    fontWeight: '700',
  },
  mono: {
    fontFamily: 'Courier',
    fontSize: 12,
    color: '#1C1C1E',
  },
  subHeading: {
    marginTop: 8,
    fontWeight: '700',
    fontSize: 13,
  },
  fileItem: {
    fontSize: 13,
    color: '#3A3A3C',
    marginLeft: 4,
  },
});
