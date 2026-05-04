import * as FileSystem from 'expo-file-system';

export const getDocumentsDir = () => FileSystem.documentDirectory;

export const ensureDir = async (dir: string) => {
  const info = await FileSystem.getInfoAsync(dir);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  }
  return dir;
};

export const createSampleFolder = async () => {
  const dir = FileSystem.documentDirectory + 'sample-folder/';
  await ensureDir(dir);
  await ensureDir(dir + 'nested/');
  await FileSystem.writeAsStringAsync(dir + 'file1.txt', 'Hello World');
  await FileSystem.writeAsStringAsync(dir + 'file2.txt', 'Sample content');
  await FileSystem.writeAsStringAsync(
    dir + 'nested/file3.txt',
    'Nested content'
  );
  return dir;
};

export const createSampleFiles = async () => {
  const dir = FileSystem.documentDirectory + 'sample-files/';
  await ensureDir(dir);
  await FileSystem.writeAsStringAsync(dir + 'alpha.txt', 'Alpha content');
  await FileSystem.writeAsStringAsync(dir + 'beta.txt', 'Beta content');
  await FileSystem.writeAsStringAsync(dir + 'gamma.txt', 'Gamma content');
  return [
    dir + 'alpha.txt',
    dir + 'beta.txt',
    dir + 'gamma.txt',
  ];
};

export const listFiles = async (dir: string) => {
  try {
    const entries = await FileSystem.readDirectoryAsync(dir);
    return entries;
  } catch {
    return [];
  }
};

export const getFileSize = async (path: string) => {
  try {
    const info = await FileSystem.getInfoAsync(path);
    return info.exists ? (info as FileSystem.FileInfo).size ?? 0 : 0;
  } catch {
    return 0;
  }
};

export const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
};
