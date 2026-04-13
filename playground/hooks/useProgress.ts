import { useState, useEffect, useCallback } from 'react';
import { subscribe } from 'react-native-zip-archive';
import type { NativeEventSubscription } from 'react-native';

interface ProgressEvent {
  progress: number;
  filePath: string;
}

export function useProgress() {
  const [progress, setProgress] = useState(0);
  const [currentFile, setCurrentFile] = useState<string>('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscription, setSubscription] = useState<NativeEventSubscription | null>(null);

  const startSubscription = useCallback(() => {
    if (subscription) return;

    const sub = subscribe((event: ProgressEvent) => {
      setProgress(event.progress);
      setCurrentFile(event.filePath);
    });

    setSubscription(sub);
    setIsSubscribed(true);
    setProgress(0);
    setCurrentFile('');
  }, [subscription]);

  const stopSubscription = useCallback(() => {
    if (subscription) {
      subscription.remove();
      setSubscription(null);
      setIsSubscribed(false);
      setProgress(0);
      setCurrentFile('');
    }
  }, [subscription]);

  useEffect(() => {
    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, [subscription]);

  return {
    progress,
    currentFile,
    isSubscribed,
    startSubscription,
    stopSubscription,
  };
}
