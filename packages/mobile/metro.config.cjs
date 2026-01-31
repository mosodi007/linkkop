const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const MetroSymlinksResolver = require('@rnx-kit/metro-resolver-symlinks');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// pnpm uses symlinks; Metro must watch the monorepo root and resolve symlinks (merge with Expo defaults)
config.watchFolders = [...(config.watchFolders || []), monorepoRoot];
config.resolver.resolveRequest = MetroSymlinksResolver();

config.transformer = {
  ...config.transformer,
  assetRegistryPath: '@react-native/assets-registry/registry',
};

module.exports = config;
