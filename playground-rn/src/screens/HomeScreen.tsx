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
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';

type RootStackParamList = {
  Home: undefined;
  Zip: undefined;
  Unzip: undefined;
  Password: undefined;
  Progress: undefined;
  Benchmark: undefined;
  Assets: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const DEMOS = [
  { screen: 'Zip' as const, title: 'Zip Operations', desc: 'Zip folders & files with compression levels' },
  { screen: 'Unzip' as const, title: 'Unzip Operations', desc: 'Extract archives with charset support' },
  { screen: 'Password' as const, title: 'Password Protection', desc: 'AES & standard encryption demos' },
  { screen: 'Progress' as const, title: 'Progress Events', desc: 'Real-time zip/unzip progress' },
  { screen: 'Benchmark' as const, title: 'Benchmarks', desc: 'Compare compression levels & speed' },
  { screen: 'Assets' as const, title: 'Assets (Android)', desc: 'Unzip bundled assets on Android' },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top + 16 }]}
      contentContainerStyle={{ paddingBottom: 32 }}
    >
      <Text style={styles.heading}>RNZipArchive Playground</Text>
      <Text style={styles.version}>Library version: {require('react-native-zip-archive/package.json').version}</Text>

      <View style={styles.warning}>
        <Text style={styles.warningTitle}>⚠️ Bare React Native App</Text>
        <Text style={styles.warningText}>
          This playground uses native code and runs on React Native 0.83.9 with the New Architecture.
        </Text>
      </View>

      <View style={styles.cards}>
        {DEMOS.map((demo) => (
          <TouchableOpacity
            key={demo.screen}
            style={styles.card}
            accessibilityLabel={demo.title}
            onPress={() => navigation.navigate(demo.screen as any)}
          >
            <Text style={styles.cardTitle}>{demo.title}</Text>
            <Text style={styles.cardDesc}>{demo.desc}</Text>
          </TouchableOpacity>
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
