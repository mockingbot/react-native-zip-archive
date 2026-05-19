import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import RNFS from 'react-native-fs';
import { useZip } from '../hooks/useZip';
import { ResultCard } from '../components/ResultCard';
import { CodePreview } from '../components/CodePreview';
import { createSampleFolder, createSampleFiles, getFileSize, formatBytes } from '../utils/fileSystem';

const COMPRESSION_LEVELS = [-1, 0, 1, 5, 9];

const SOURCE_CODE = `import { zip } from 'react-native-zip-archive';

// Zip a folder
const path = await zip(sourceFolder, targetZip, compressionLevel);

// Zip an array of files
const path = await zip([file1, file2], targetZip, compressionLevel);
`;

export default function ZipScreen() {
  const { doZip, loading, result, error, reset } = useZip();
  const [compressionLevel, setCompressionLevel] = useState<number>(-1);
  const [resultSize, setResultSize] = useState<string>('');

  const handleZipFolder = async () => {
    reset();
    const folder = await createSampleFolder();
    const target = RNFS.DocumentDirectoryPath + '/sample-folder.zip';
    try {
      if (await RNFS.exists(target)) await RNFS.unlink(target);
    } catch {}
    const path = await doZip(folder, target, compressionLevel);
    const size = await getFileSize(path);
    setResultSize(formatBytes(size));
  };

  const handleZipFiles = async () => {
    reset();
    const files = await createSampleFiles();
    const target = RNFS.DocumentDirectoryPath + '/sample-files.zip';
    try {
      if (await RNFS.exists(target)) await RNFS.unlink(target);
    } catch {}
    const path = await doZip(files, target, compressionLevel);
    const size = await getFileSize(path);
    setResultSize(formatBytes(size));
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }}>
      <Text style={styles.section}>Compression Level</Text>
      <View style={styles.levels}>
        {COMPRESSION_LEVELS.map((level) => (
          <TouchableOpacity
            key={level}
            style={[styles.levelBtn, compressionLevel === level && styles.levelBtnActive]}
            onPress={() => setCompressionLevel(level)}
          >
            <Text style={compressionLevel === level ? styles.levelTextActive : styles.levelText}>
              {level}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.section}>Demo: Zip Sample Folder</Text>
      <TouchableOpacity style={styles.actionBtn} onPress={handleZipFolder} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionText}>Zip Sample Folder</Text>}
      </TouchableOpacity>

      <Text style={styles.section}>Demo: Zip Sample Files Array</Text>
      <TouchableOpacity style={styles.actionBtn} onPress={handleZipFiles} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionText}>Zip Sample Files</Text>}
      </TouchableOpacity>

      {result && (
        <ResultCard title="Success" variant="success">
          <Text style={styles.mono}>{result}</Text>
          <Text style={styles.meta}>Size: {resultSize}</Text>
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
  levels: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  levelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#E5E5EA',
  },
  levelBtnActive: {
    backgroundColor: '#007AFF',
  },
  levelText: {
    color: '#1C1C1E',
    fontWeight: '600',
  },
  levelTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  actionBtn: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
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
    marginTop: 8,
    fontSize: 13,
    color: '#636366',
  },
});
