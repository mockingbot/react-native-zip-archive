import { zip, unzip } from 'react-native-zip-archive';
import * as FileSystem from 'expo-file-system';
import { createBenchmarkFolder } from './sampleData';
import { getFileSize, formatBytes } from './fileSystem';

export interface BenchmarkResult {
  compressionLevel: number;
  durationMs: number;
  outputSize: number;
  formattedSize: string;
}

export const runCompressionBenchmark = async (
  levels: number[]
): Promise<BenchmarkResult[]> => {
  const results: BenchmarkResult[] = [];
  const sourceDir = await createBenchmarkFolder('test', 20, 1024 * 50);

  for (const level of levels) {
    const target = FileSystem.documentDirectory + `benchmark-level-${level}.zip`;
    // Clean up previous target if exists
    try {
      await FileSystem.deleteAsync(target, { idempotent: true });
    } catch {}

    const start = Date.now();
    await zip(sourceDir, target, level);
    const duration = Date.now() - start;
    const size = await getFileSize(target);

    results.push({
      compressionLevel: level,
      durationMs: duration,
      outputSize: size,
      formattedSize: formatBytes(size),
    });
  }

  return results;
};
