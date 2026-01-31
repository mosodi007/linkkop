const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.transformer = {
  ...config.transformer,
  assetRegistryPath: '@react-native/assets-registry/registry',
};

module.exports = config;
