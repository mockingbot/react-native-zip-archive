import { useState, useCallback } from 'react';
import { zip } from 'react-native-zip-archive';

export function useZip() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const doZip = useCallback(async (
    source: string | string[],
    target: string,
    compressionLevel: number
  ) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const path = await zip(source, target, compressionLevel);
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

  return { doZip, loading, result, error, reset };
}
