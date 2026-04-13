import React from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Stack>
        <Stack.Screen name="index" options={{ title: 'Playground' }} />
        <Stack.Screen name="zip" options={{ title: 'Zip Demo' }} />
        <Stack.Screen name="unzip" options={{ title: 'Unzip Demo' }} />
        <Stack.Screen name="password" options={{ title: 'Password Demo' }} />
        <Stack.Screen name="progress" options={{ title: 'Progress Demo' }} />
        <Stack.Screen name="benchmark" options={{ title: 'Benchmark' }} />
        <Stack.Screen name="assets" options={{ title: 'Assets Demo' }} />
      </Stack>
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}
