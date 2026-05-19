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
import { zip } from 'react-native-zip-archive';
import { useProgress } from '../hooks/useProgress';
import { ProgressBar } from '../components/ProgressBar';
import { ResultCard } from '../components/ResultCard';
import { CodePreview } from '../components/CodePreview';
import { createBenchmarkFolder } from '../utils/sampleData';

const SOURCE_CODE = `import { subscribe } from 'react-native-zip-archive';

const subscription = subscribe(({ progress, filePath }) => {
  console.log(progress, filePath);
});

// Later
subscription.remove();
`;

export default function ProgressScreen() {
  const { progress, currentFile, isSubscribed, startSubscription, stopSubscription } = useProgress();
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);

  const runLargeZip = async () => {
    startSubscription();
    setRunning(true);
    setDone(false);
    try {
      const folder = await createBenchmarkFolder('progress', 50, 1024 * 20);
      const target = RNFS.DocumentDirectoryPath + '/progress-benchmark.zip';
      try {
        if (await RNFS.exists(target)) await RNFS.unlink(target);
      } catch {}
      await zip(folder, target, 5);
      setDone(true);
    } catch (err) {
      console.error(err);
    } finally {
      setRunning(false);
      stopSubscription();
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }}>
      <Text style={styles.section}>Progress Subscription</Text>
      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlBtn} onPress={startSubscription} disabled={isSubscribed}>
          <Text style={styles.controlText}>Subscribe</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlBtn} onPress={stopSubscription} disabled={!isSubscribed}>
          <Text style={styles.controlText}>Unsubscribe</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.meta}>Status: {isSubscribed ? 'Subscribed' : 'Not subscribed'}</Text>

      <Text style={styles.section}>Demo: Large Zip Operation</Text>
      <TouchableOpacity style={styles.actionBtn} onPress={runLargeZip} disabled={running}>
        {running ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionText}>Run Large Zip</Text>}
      </TouchableOpacity>

      <View style={styles.progressSection}>
        <ProgressBar progress={progress} />
        <Text style={styles.progressText}>{Math.round(progress * 100)}%</Text>
      </View>

      {currentFile ? (
        <View style={styles.fileBox}>
          <Text style={styles.fileLabel}>Current File</Text>
          <Text style={styles.mono} numberOfLines={2}>
            {currentFile}
          </Text>
        </View>
      ) : null}

      {done && (
        <ResultCard title="Completed" variant="success">
          <Text>Large zip operation finished.</Text>
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
  controls: {
    flexDirection: 'row',
    gap: 12,
  },
  controlBtn: {
    flex: 1,
    backgroundColor: '#5856D6',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  controlText: {
    color: '#fff',
    fontWeight: '700',
  },
  meta: {
    marginTop: 8,
    fontSize: 13,
    color: '#636366',
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
  progressSection: {
    marginTop: 20,
  },
  progressText: {
    marginTop: 6,
    textAlign: 'right',
    fontSize: 13,
    color: '#636366',
  },
  fileBox: {
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  fileLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#636366',
    marginBottom: 4,
  },
  mono: {
    fontFamily: 'Courier',
    fontSize: 12,
    color: '#1C1C1E',
  },
});
