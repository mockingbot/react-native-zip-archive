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
import { useZip } from '../hooks/useZip';
import { FilePicker } from '../components/FilePicker';
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
  const [pickedFiles, setPickedFiles] = useState<string[]>([]);
  const [resultSize, setResultSize] = useState<string>('');

  const handleZipFolder = async () => {
    reset();
    const folder = await createSampleFolder();
    const target = FileSystem.documentDirectory + 'sample-folder.zip';
    try {
      await FileSystem.deleteAsync(target, { idempotent: true });
    } catch {}
    const path = await doZip(folder, target, compressionLevel);
    const size = await getFileSize(path);
    setResultSize(formatBytes(size));
  };

  const handleZipFiles = async () => {
    reset();
    const files = await createSampleFiles();
    const target = FileSystem.documentDirectory + 'sample-files.zip';
    try {
      await FileSystem.deleteAsync(target, { idempotent: true });
    } catch {}
    const path = await doZip(files, target, compressionLevel);
    const size = await getFileSize(path);
    setResultSize(formatBytes(size));
  };

  const handleZipPicked = async () => {
    if (pickedFiles.length === 0) return;
    reset();
    const target = FileSystem.documentDirectory + 'picked-files.zip';
    try {
      await FileSystem.deleteAsync(target, { idempotent: true });
    } catch {}
    const path = await doZip(pickedFiles, target, compressionLevel);
    const size = await getFileSize(path);
    setResultSize(formatBytes(size));
    setPickedFiles([]);
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

      <Text style={styles.section}>Demo: Zip Picked Files</Text>
      <FilePicker
        label="Pick Files"
        multiple
        onPickMultiple={setPickedFiles}
      />
      {pickedFiles.length > 0 && (
        <Text style={styles.meta}>Selected {pickedFiles.length} file(s)</Text>
      )}
      <TouchableOpacity
        style={[styles.actionBtn, { marginTop: 12 }, pickedFiles.length === 0 && styles.disabledBtn]}
        onPress={handleZipPicked}
        disabled={loading || pickedFiles.length === 0}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionText}>Zip Picked Files</Text>}
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
});
