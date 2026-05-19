import RNFS from 'react-native-fs';
import { ensureDir, getDocumentsDir } from './fileSystem';

export const createLargeFile = async (path: string, sizeBytes: number) => {
  const chunk = 'A'.repeat(1024);
  let content = '';
  const chunks = Math.floor(sizeBytes / 1024);
  for (let i = 0; i < chunks; i++) {
    content += chunk;
  }
  content += 'A'.repeat(sizeBytes % 1024);
  await RNFS.writeFile(path, content, 'utf8');
};

export const createBenchmarkFolder = async (name: string, fileCount = 10, fileSize = 1024 * 10) => {
  const dir = getDocumentsDir() + `benchmark-${name}/`;
  await ensureDir(dir);
  for (let i = 0; i < fileCount; i++) {
    await createLargeFile(dir + `file_${i}.txt`, fileSize);
  }
  return dir;
};
