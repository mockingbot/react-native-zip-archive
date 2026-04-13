import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ResultCardProps {
  title: string;
  children: React.ReactNode;
  variant?: 'success' | 'error' | 'info';
}

export function ResultCard({ title, children, variant = 'info' }: ResultCardProps) {
  const borderColor =
    variant === 'success' ? '#34C759' : variant === 'error' ? '#FF3B30' : '#007AFF';

  return (
    <View style={[styles.card, { borderLeftColor: borderColor }]}>
      <Text style={[styles.title, { color: borderColor }]}>{title}</Text>
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
    borderLeftWidth: 4,
  },
  title: {
    fontWeight: '700',
    marginBottom: 4,
  },
  content: {
    marginTop: 4,
  },
});
