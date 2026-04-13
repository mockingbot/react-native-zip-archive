import * as FileSystem from 'expo-file-system';

export const createLargeFile = async (path: string, sizeBytes: number) => {
  const chunk = 'A'.repeat(1024);
  let content = '';
  const chunks = Math.floor(sizeBytes / 1024);
  for (let i = 0; i < chunks; i++) {
    content += chunk;
  }
  content += 'A'.repeat(sizeBytes % 1024);
  await FileSystem.writeAsStringAsync(path, content);
};

export const createBenchmarkFolder = async (name: string, fileCount = 10, fileSize = 1024 * 10) => {
  const dir = FileSystem.documentDirectory + `benchmark-${name}/`;
  await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  for (let i = 0; i < fileCount; i++) {
    await createLargeFile(dir + `file_${i}.txt`, fileSize);
  }
  return dir;
};
