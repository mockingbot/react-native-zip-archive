import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';

interface FilePickerProps {
  onPick: (uri: string) => void;
  label?: string;
  multiple?: boolean;
  onPickMultiple?: (uris: string[]) => void;
}

export function FilePicker({ onPick, label = 'Pick File', multiple, onPickMultiple }: FilePickerProps) {
  const handlePress = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        multiple,
      });

      if (!result.canceled) {
        if (multiple && onPickMultiple) {
          onPickMultiple(result.assets.map((a) => a.uri));
        } else if (!multiple) {
          onPick(result.assets[0].uri);
        }
      }
    } catch (err) {
      console.error('Document pick error:', err);
    }
  };

  return (
    <TouchableOpacity style={styles.button} onPress={handlePress}>
      <Text style={styles.buttonText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
