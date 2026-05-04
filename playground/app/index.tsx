import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Link } from 'expo-router';

const DEMOS = [
  { href: '/zip' as const, title: 'Zip Operations', desc: 'Zip folders & files with compression levels' },
  { href: '/unzip' as const, title: 'Unzip Operations', desc: 'Extract archives with charset support' },
  { href: '/password' as const, title: 'Password Protection', desc: 'AES & standard encryption demos' },
  { href: '/progress' as const, title: 'Progress Events', desc: 'Real-time zip/unzip progress' },
  { href: '/benchmark' as const, title: 'Benchmarks', desc: 'Compare compression levels & speed' },
  { href: '/assets' as const, title: 'Assets (Android)', desc: 'Unzip bundled assets on Android' },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top + 16 }]}
      contentContainerStyle={{ paddingBottom: 32 }}
    >
      <Text style={styles.heading}>RNZipArchive Playground</Text>
      <Text style={styles.version}>Library version: 8.0.0-rc.1</Text>

      <View style={styles.warning}>
        <Text style={styles.warningTitle}>⚠️ Requires Development Build</Text>
        <Text style={styles.warningText}>
          This playground uses native code and CANNOT run in Expo Go. Use{' '}
          <Text style={styles.mono}>expo-dev-client</Text> or a development build.
        </Text>
      </View>

      <View style={styles.cards}>
        {DEMOS.map((demo) => (
          <Link key={demo.href} href={demo.href} asChild>
            <TouchableOpacity style={styles.card} accessibilityLabel={demo.title}>
              <Text style={styles.cardTitle}>{demo.title}</Text>
              <Text style={styles.cardDesc}>{demo.desc}</Text>
            </TouchableOpacity>
          </Link>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
  },
  heading: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 4,
  },
  version: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 16,
  },
  warning: {
    backgroundColor: '#FFF3CD',
    borderRadius: 10,
    padding: 14,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  warningTitle: {
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 4,
  },
  warningText: {
    color: '#78350F',
    fontSize: 13,
    lineHeight: 18,
  },
  mono: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 2,
    borderRadius: 4,
  },
  cards: {
    gap: 12,
  },
  card: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 16,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 13,
    color: '#636366',
  },
});
