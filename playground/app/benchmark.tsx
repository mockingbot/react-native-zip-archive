import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { ResultCard } from '../components/ResultCard';
import { CodePreview } from '../components/CodePreview';
import { runCompressionBenchmark, BenchmarkResult } from '../utils/benchmarks';

const SOURCE_CODE = `import { zip } from 'react-native-zip-archive';

const start = Date.now();
await zip(source, target, compressionLevel);
const duration = Date.now() - start;
`;

export default function BenchmarkScreen() {
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<BenchmarkResult[]>([]);

  const runBenchmark = async () => {
    setRunning(true);
    setResults([]);
    try {
      const data = await runCompressionBenchmark([0, 5, 9]);
      setResults(data);
    } catch (err) {
      console.error(err);
    } finally {
      setRunning(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }}>
      <Text style={styles.section}>Compression Benchmark</Text>
      <Text style={styles.desc}>
        Compare compression levels 0, 5, and 9 on the same set of files. Lower levels are faster but produce larger files.
      </Text>

      <TouchableOpacity style={styles.actionBtn} onPress={runBenchmark} disabled={running}>
        {running ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionText}>Run Benchmark</Text>}
      </TouchableOpacity>

      {results.length > 0 && (
        <ResultCard title="Results" variant="success">
          <View style={styles.table}>
            <View style={styles.rowHeader}>
              <Text style={styles.cellHeader}>Level</Text>
              <Text style={styles.cellHeader}>Time</Text>
              <Text style={styles.cellHeader}>Size</Text>
            </View>
            {results.map((r) => (
              <View key={r.compressionLevel} style={styles.row}>
                <Text style={styles.cell}>{r.compressionLevel}</Text>
                <Text style={styles.cell}>{r.durationMs} ms</Text>
                <Text style={styles.cell}>{r.formattedSize}</Text>
              </View>
            ))}
          </View>

          <View style={styles.chart}>
            <Text style={styles.subHeading}>Size Comparison</Text>
            {results.map((r) => {
              const max = Math.max(...results.map((x) => x.outputSize)) || 1;
              const pct = (r.outputSize / max) * 100;
              return (
                <View key={r.compressionLevel} style={styles.barRow}>
                  <Text style={styles.barLabel}>Level {r.compressionLevel}</Text>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { width: `${pct}%` }]} />
                  </View>
                  <Text style={styles.barValue}>{r.formattedSize}</Text>
                </View>
              );
            })}
          </View>
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
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },
  desc: {
    fontSize: 13,
    color: '#636366',
    marginBottom: 16,
    lineHeight: 18,
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
  table: {
    marginTop: 8,
  },
  rowHeader: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#C7C7CC',
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  cellHeader: {
    flex: 1,
    fontWeight: '700',
    fontSize: 13,
    color: '#636366',
  },
  cell: {
    flex: 1,
    fontSize: 13,
    color: '#1C1C1E',
  },
  chart: {
    marginTop: 16,
  },
  subHeading: {
    fontWeight: '700',
    fontSize: 14,
    marginBottom: 8,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  barLabel: {
    width: 70,
    fontSize: 12,
    color: '#636366',
  },
  barTrack: {
    flex: 1,
    height: 12,
    backgroundColor: '#E5E5EA',
    borderRadius: 6,
    overflow: 'hidden',
    marginHorizontal: 8,
  },
  barFill: {
    height: '100%',
    backgroundColor: '#34C759',
    borderRadius: 6,
  },
  barValue: {
    width: 60,
    fontSize: 12,
    color: '#1C1C1E',
    textAlign: 'right',
  },
});
