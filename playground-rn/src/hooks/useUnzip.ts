import { useState, useCallback } from 'react';
import { unzip, unzipWithPassword } from 'react-native-zip-archive';

export function useUnzip() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const doUnzip = useCallback(async (
    source: string,
    target: string,
    charset?: string
  ) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const path = await unzip(source, target, charset);
      setResult(path);
      return path;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const doUnzipWithPassword = useCallback(async (
    source: string,
    target: string,
    password: string
  ) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const path = await unzipWithPassword(source, target, password);
      setResult(path);
      return path;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { doUnzip, doUnzipWithPassword, loading, result, error, reset };
}
