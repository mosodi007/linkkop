const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

// Single dynamic config (no app.json) so expo-doctor is satisfied
module.exports = {
  expo: {
    newArchEnabled: true,
    name: 'Linkkop',
    slug: 'linkkop',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './public/android-chrome-192x192.png',
    userInterfaceStyle: 'automatic',
    scheme: 'linkkop',
    splash: {
      image: './public/android-chrome-192x192.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.linkkop.app',
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './public/android-chrome-192x192.png',
        backgroundColor: '#ffffff',
      },
      package: 'com.linkkop.app',
    },
    web: {
      favicon: './public/favicon-32x32.png',
      bundler: 'metro',
    },
    plugins: [
      'expo-router',
      [
        'expo-image-picker',
        {
          photosPermission:
            'Allow Linkkop to access your photos so you can set a profile photo.',
          cameraPermission:
            'Allow Linkkop to access your camera to take a profile photo.',
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      router: { root: 'app' },
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
    },
  },
};
