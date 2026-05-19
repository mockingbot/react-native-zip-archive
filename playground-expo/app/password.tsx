import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { zipWithPassword, isPasswordProtected } from 'react-native-zip-archive';
import { useUnzip } from '../hooks/useUnzip';
import { ResultCard } from '../components/ResultCard';
import { CodePreview } from '../components/CodePreview';
import { ensureDir, listFiles } from '../utils/fileSystem';

const ENCRYPTIONS = ['STANDARD', 'AES-128', 'AES-256'];

const SOURCE_CODE = `import { zipWithPassword, unzipWithPassword, isPasswordProtected } from 'react-native-zip-archive';

const zipPath = await zipWithPassword(source, target, 'secret', 'AES-256');
const protected = await isPasswordProtected(zipPath);
const output = await unzipWithPassword(zipPath, folder, 'secret');
`;

export default function PasswordScreen() {
  const [password, setPassword] = useState('secret123');
  const [encryption, setEncryption] = useState<string>('AES-256');
  const [zipPath, setZipPath] = useState<string>('');
  const [protectedStatus, setProtectedStatus] = useState<boolean | null>(null);
  const [creating, setCreating] = useState(false);
  const [extractedFiles, setExtractedFiles] = useState<string[]>([]);
  const { doUnzipWithPassword, loading, result, error, reset } = useUnzip();

  const createPasswordZip = async () => {
    setCreating(true);
    reset();
    setProtectedStatus(null);
    setExtractedFiles([]);
    const dir = FileSystem.documentDirectory + 'password-demo/';
    await ensureDir(dir);
    await FileSystem.writeAsStringAsync(dir + 'private.txt', 'This is secret content');
    const target = FileSystem.documentDirectory + 'password-demo.zip';
    try {
      await FileSystem.deleteAsync(target, { idempotent: true });
    } catch {}
    try {
      const path = await zipWithPassword(dir, target, password, encryption);
      setZipPath(path);
      const status = await isPasswordProtected(path);
      setProtectedStatus(status);
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const handleUnzip = async () => {
    if (!zipPath) return;
    reset();
    setExtractedFiles([]);
    const out = FileSystem.documentDirectory + 'password-unzipped/' + Date.now() + '/';
    await ensureDir(out);
    try {
      const path = await doUnzipWithPassword(zipPath, out, password);
      const files = await listFiles(out);
      setExtractedFiles(files);
      return path;
    } catch {
      // error handled by hook
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }}>
      <Text style={styles.section}>Password</Text>
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        placeholder="Enter password"
        autoCapitalize="none"
        secureTextEntry
      />

      <Text style={styles.section}>Encryption Method</Text>
      <View style={styles.row}>
        {ENCRYPTIONS.map((enc) => (
          <TouchableOpacity
            key={enc}
            style={[styles.chip, encryption === enc && styles.chipActive]}
            onPress={() => setEncryption(enc)}
          >
            <Text style={encryption === enc ? styles.chipTextActive : styles.chipText}>{enc}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.actionBtn} onPress={createPasswordZip} disabled={creating}>
        {creating ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionText}>Create Password Zip</Text>}
      </TouchableOpacity>

      {zipPath && (
        <ResultCard title="Zip Created" variant="info">
          <Text style={styles.mono}>{zipPath}</Text>
          <Text style={styles.meta}>Password Protected: {protectedStatus == null ? '—' : protectedStatus ? 'Yes' : 'No'}</Text>
        </ResultCard>
      )}

      <TouchableOpacity
        style={[styles.actionBtn, !zipPath && styles.disabledBtn]}
        onPress={handleUnzip}
        disabled={loading || !zipPath}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionText}>Unzip with Password</Text>}
      </TouchableOpacity>

      {result && (
        <ResultCard title="Extracted" variant="success">
          <Text style={styles.mono}>{result}</Text>
          {extractedFiles.map((f) => (
            <Text key={f} style={styles.fileItem}>• {f}</Text>
          ))}
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
  input: {
    borderWidth: 1,
    borderColor: '#C7C7CC',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
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
    marginTop: 16,
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
  meta: {
    marginTop: 6,
    fontSize: 13,
    color: '#636366',
  },
  fileItem: {
    fontSize: 13,
    color: '#3A3A3C',
    marginLeft: 4,
    marginTop: 2,
  },
});
