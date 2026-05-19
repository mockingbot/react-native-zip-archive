import RNFS from 'react-native-fs';

export const getDocumentsDir = () => RNFS.DocumentDirectoryPath + '/';

export const ensureDir = async (dir: string) => {
  const exists = await RNFS.exists(dir);
  if (!exists) {
    await RNFS.mkdir(dir);
  }
  return dir;
};

export const createSampleFolder = async () => {
  const dir = getDocumentsDir() + 'sample-folder/';
  await ensureDir(dir);
  await ensureDir(dir + 'nested/');
  await RNFS.writeFile(dir + 'file1.txt', 'Hello World', 'utf8');
  await RNFS.writeFile(dir + 'file2.txt', 'Sample content', 'utf8');
  await RNFS.writeFile(dir + 'nested/file3.txt', 'Nested content', 'utf8');
  return dir;
};

export const createSampleFiles = async () => {
  const dir = getDocumentsDir() + 'sample-files/';
  await ensureDir(dir);
  await RNFS.writeFile(dir + 'alpha.txt', 'Alpha content', 'utf8');
  await RNFS.writeFile(dir + 'beta.txt', 'Beta content', 'utf8');
  await RNFS.writeFile(dir + 'gamma.txt', 'Gamma content', 'utf8');
  return [
    dir + 'alpha.txt',
    dir + 'beta.txt',
    dir + 'gamma.txt',
  ];
};

export const listFiles = async (dir: string) => {
  try {
    const entries = await RNFS.readDir(dir);
    return entries.map((e: any) => e.name);
  } catch {
    return [];
  }
};

export const listFilesRecursive = async (dir: string, prefix = ''): Promise<string[]> => {
  try {
    const entries = await RNFS.readDir(dir);
    const result: string[] = [];
    for (const entry of entries) {
      const path = dir + entry.name;
      if (entry.isDirectory()) {
        const nested = await listFilesRecursive(path + '/', prefix + entry.name + '/');
        result.push(...nested);
      } else {
        result.push(prefix + entry.name);
      }
    }
    return result;
  } catch {
    return [];
  }
};

export const getFileSize = async (path: string) => {
  try {
    const stat = await RNFS.stat(path);
    return stat.size ?? 0;
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
