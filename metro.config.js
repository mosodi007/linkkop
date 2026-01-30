const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const config = getDefaultConfig(__dirname);

config.resolver = {
  ...config.resolver,
  blacklistRE: /(src\/app\/components-web-backup\/.*|web-backup\/.*|src\/main\.tsx|src\/app\/lib\/(auth|supabase|i18n|feed|discover|contacts|notifications)\.(tsx?)|src\/app\/data\/.*|src\/styles\/.*)/,
};

module.exports = withNativeWind(config, { input: './global.css' });
