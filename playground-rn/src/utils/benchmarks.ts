import { zip, unzip } from 'react-native-zip-archive';
import RNFS from 'react-native-fs';
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
    const target = RNFS.DocumentDirectoryPath + `/benchmark-level-${level}.zip`;
    try {
      if (await RNFS.exists(target)) {
        await RNFS.unlink(target);
      }
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
