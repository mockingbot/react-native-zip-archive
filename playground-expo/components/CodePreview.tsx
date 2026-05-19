import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

interface CodePreviewProps {
  code: string;
  title?: string;
}

export function CodePreview({ code, title = 'View Source' }: CodePreviewProps) {
  const [visible, setVisible] = useState(false);

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => setVisible((v) => !v)}>
        <Text style={styles.toggle}>{visible ? 'Hide Source' : title}</Text>
      </TouchableOpacity>
      {visible && (
        <ScrollView horizontal style={styles.scroll}>
          <Text style={styles.code}>{code}</Text>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
  },
  toggle: {
    color: '#007AFF',
    fontWeight: '600',
  },
  scroll: {
    backgroundColor: '#1C1C1E',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    maxHeight: 240,
  },
  code: {
    color: '#A1A1AA',
    fontFamily: 'Courier',
    fontSize: 12,
    lineHeight: 18,
  },
});
