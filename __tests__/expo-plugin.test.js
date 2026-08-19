const path = require('path');
const fs = require('fs');

const plugin = require('../app.plugin.js');
const pkg = require('../package.json');

describe('Expo config plugin (RNZA-10)', () => {
  test('is a CommonJS function Expo can load without @expo/config-plugins', () => {
    expect(typeof plugin).toBe('function');
  });

  test('package.json points Expo at ./app.plugin.js', () => {
    expect(pkg.expo).toEqual({ plugin: './app.plugin.js' });
    expect(fs.existsSync(path.join(__dirname, '..', 'app.plugin.js'))).toBe(true);
  });

  test('is a no-op: returns the same config object', () => {
    const config = {
      name: 'Demo',
      slug: 'demo',
      plugins: ['expo-router', 'react-native-zip-archive'],
      ios: { bundleIdentifier: 'com.demo' },
      android: { package: 'com.demo' },
    };
    const result = plugin(config);
    expect(result).toBe(config);
    expect(result.plugins).toEqual(['expo-router', 'react-native-zip-archive']);
  });

  test('does not throw on an empty Expo config', () => {
    expect(() => plugin({})).not.toThrow();
    expect(plugin({})).toEqual({});
  });
});
