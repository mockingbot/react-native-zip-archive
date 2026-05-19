const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const path = require('path');
const config = {
  watchFolders: [path.resolve(__dirname, '..')],
  resolver: {
    resolveRequest: (context, moduleName, platform) => {
      if (moduleName === 'react-native') {
        return {
          filePath: path.resolve(__dirname, 'node_modules/react-native/index.js'),
          type: 'sourceFile',
        };
      }
      return context.resolveRequest(context, moduleName, platform);
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
