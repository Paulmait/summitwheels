import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Summit Wheels',
  slug: 'summitwheels',
  owner: 'guampaul',
  version: '1.0.0',
  orientation: 'landscape',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'cover',
    backgroundColor: '#87CEEB',
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.guampaul.summitwheels',
    buildNumber: '1',
    config: {
      usesNonExemptEncryption: false,
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#87CEEB',
    },
    package: 'com.guampaul.summitwheels',
    versionCode: 1,
  },
  web: {
    favicon: './assets/favicon.png',
  },
  extra: {
    eas: {
      projectId: '2a1c38a5-3f1a-40df-90b6-816ff47a377e',
    },
  },
  plugins: [
    'expo-av',
  ],
});
