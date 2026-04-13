import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import { useUnzip } from '../hooks/useUnzip';
import { FilePicker } from '../components/FilePicker';
import { ResultCard } from '../components/ResultCard';
import { CodePreview } from '../components/CodePreview';
import { listFiles, ensureDir } from '../utils/fileSystem';
import { zip } from 'react-native-zip-archive';

const CHARSETS = ['UTF-8', 'GBK', 'Big5', 'Shift_JIS'];

const SOURCE_CODE = `import { unzip } from 'react-native-zip-archive';

const targetPath = await unzip(sourceZip, outputFolder, 'UTF-8');
`;

export default function UnzipScreen() {
  const { doUnzip, loading, result, error, reset } = useUnzip();
  const [pickedZip, setPickedZip] = useState<string>('');
  const [charset, setCharset] = useState<string>('UTF-8');
  const [extractedFiles, setExtractedFiles] = useState<string[]>([]);

  const createDemoZip = async () => {
    const dir = FileSystem.documentDirectory + 'demo-unzip/';
    await ensureDir(dir);
    await FileSystem.writeAsStringAsync(dir + 'hello.txt', 'Hello from zip!');
    await FileSystem.writeAsStringAsync(dir + 'readme.md', '# Demo');
    const target = FileSystem.documentDirectory + 'demo-unzip-sample.zip';
    try {
      await FileSystem.deleteAsync(target, { idempotent: true });
    } catch {}
    await zip(dir, target, 0);
    return target;
  };

  const handleUnzip = async (source?: string) => {
    reset();
    setExtractedFiles([]);
    const src = source || pickedZip;
    if (!src) return;
    const out = FileSystem.documentDirectory + 'unzipped/' + Date.now() + '/';
    await ensureDir(out);
    try {
      const path = await doUnzip(src, out, charset);
      const files = await listFiles(out);
      setExtractedFiles(files);
      return path;
    } catch {
      // error handled by hook
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }}>
      <Text style={styles.section}>Charset</Text>
      <View style={styles.row}>
        {CHARSETS.map((c) => (
          <TouchableOpacity
            key={c}
            style={[styles.chip, charset === c && styles.chipActive]}
            onPress={() => setCharset(c)}
          >
            <Text style={charset === c ? styles.chipTextActive : styles.chipText}>{c}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.section}>Demo: Unzip Built-in Sample</Text>
      <TouchableOpacity
        style={styles.actionBtn}
        onPress={async () => {
          const zipPath = await createDemoZip();
          await handleUnzip(zipPath);
        }}
        disabled={loading}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionText}>Create & Unzip Sample</Text>}
      </TouchableOpacity>

      <Text style={styles.section}>Demo: Unzip Picked File</Text>
      <FilePicker label="Pick .zip File" onPick={setPickedZip} />
      {pickedZip ? <Text style={styles.meta}>Picked: {pickedZip}</Text> : null}
      <TouchableOpacity
        style={[styles.actionBtn, { marginTop: 12 }, !pickedZip && styles.disabledBtn]}
        onPress={() => handleUnzip()}
        disabled={loading || !pickedZip}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionText}>Unzip Selected File</Text>}
      </TouchableOpacity>

      {result && (
        <ResultCard title="Extracted To" variant="success">
          <Text style={styles.mono}>{result}</Text>
          {extractedFiles.length > 0 && (
            <>
              <Text style={styles.subHeading}>Files:</Text>
              {extractedFiles.map((f) => (
                <Text key={f} style={styles.fileItem}>
                  • {f}
                </Text>
              ))}
            </>
          )}
        </ResultCard>
      )}

      {error && (
        <ResultCard title="Error" variant="error">
          <Text style={styles.mono}>{error.message}</Text>
        </ResultCard>
      )}

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
  row: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#E5E5EA',
  },
  chipActive: {
    backgroundColor: '#007AFF',
  },
  chipText: {
    color: '#1C1C1E',
    fontSize: 13,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
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
  meta: {
    marginTop: 8,
    fontSize: 13,
    color: '#636366',
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
