import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { unzipAssets } from 'react-native-zip-archive';
import { ResultCard } from '../components/ResultCard';
import { CodePreview } from '../components/CodePreview';
import { ensureDir, listFilesRecursive } from '../utils/fileSystem';

const SOURCE_CODE = `import { unzipAssets } from 'react-native-zip-archive';

const outputPath = await unzipAssets('sample.zip', targetFolder);
`;

export default function AssetsScreen() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [files, setFiles] = useState<string[]>([]);
  const [error, setError] = useState<Error | null>(null);

  const handleUnzipAssets = async () => {
    setLoading(true);
    setResult(null);
    setError(null);
    setFiles([]);
    const out = FileSystem.documentDirectory + 'assets-extracted/' + Date.now() + '/';
    await ensureDir(out);
    try {
      const path = await unzipAssets('sample.zip', out);
      setResult(path);
      const entries = await listFilesRecursive(out);
      setFiles(entries);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  if (Platform.OS !== 'android') {
    return (
      <View style={styles.container}>
        <ResultCard title="Not Supported" variant="error">
          <Text style={styles.desc}>
            unzipAssets is only available on Android. iOS apps should use the main bundle or other asset mechanisms.
          </Text>
        </ResultCard>
        <CodePreview code={SOURCE_CODE} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }}>
      <Text style={styles.section}>Android Assets Demo</Text>
      <Text style={styles.desc}>
        Unzip a pre-bundled asset file (<Text style={styles.mono}>sample.zip</Text>) from the Android assets folder.
        Make sure <Text style={styles.mono}>sample.zip</Text> exists in{' '}
        <Text style={styles.mono}>android/app/src/main/assets/</Text>.
      </Text>

      <TouchableOpacity style={styles.actionBtn} onPress={handleUnzipAssets} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionText}>Unzip Assets</Text>}
      </TouchableOpacity>

      {result && (
        <ResultCard title="Extracted To" variant="success">
          <Text style={styles.mono}>{result}</Text>
          {files.length > 0 && (
            <>
              <Text style={styles.subHeading}>Files:</Text>
              {files.map((f) => (
                <Text key={f} style={styles.fileItem}>- {f}</Text>
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
  desc: {
    fontSize: 13,
    color: '#636366',
    lineHeight: 18,
  },
  mono: {
    fontFamily: 'Courier',
    fontSize: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 2,
    borderRadius: 4,
  },
  actionBtn: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  actionText: {
    color: '#fff',
    fontWeight: '700',
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
    marginTop: 2,
  },
});
