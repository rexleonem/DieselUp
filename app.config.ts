import type { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'DieselUp',
  slug: 'dieselup',
  scheme: 'dieselup',
  version: '1.0.0',
  icon: './assets/icon.png',
  orientation: 'portrait',
  userInterfaceStyle: 'automatic',
  experiments: { typedRoutes: true },
  web: { bundler: 'metro', output: 'static', favicon: './assets/favicon.png' },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.dieselup.app',
    googleServicesFile: process.env.GOOGLE_SERVICES_INFO_PLIST,
    config: { googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY },
    infoPlist: {
      NSLocationWhenInUseUsageDescription: 'DieselUp uses your location to select delivery points and track active deliveries.',
      NSLocationAlwaysAndWhenInUseUsageDescription: 'DieselUp uses driver location during active deliveries.',
      UIBackgroundModes: ['location', 'remote-notification']
    }
  },
  android: {
    package: 'com.dieselup.app',
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-foreground.png',
      monochromeImage: './assets/monochrome-icon.png',
      backgroundColor: '#06142E'
    },
    permissions: ['ACCESS_COARSE_LOCATION', 'ACCESS_FINE_LOCATION', 'ACCESS_BACKGROUND_LOCATION'],
    config: { googleMaps: { apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY } },
    googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? './config/firebase/google-services.json'
  },
  plugins: [
    '@react-native-firebase/app',
    '@react-native-firebase/analytics',
    '@react-native-firebase/app-check',
    '@react-native-firebase/auth',
    '@react-native-firebase/messaging',
    'expo-router',
    'expo-secure-store',
    ['expo-splash-screen', {
      image: './assets/splash.png',
      resizeMode: 'cover',
      backgroundColor: '#020817',
      ios: {
        image: './assets/splash.png',
        resizeMode: 'cover',
        enableFullScreenImage_legacy: true,
        backgroundColor: '#020817',
        tabletImage: './assets/splash.png',
        tabletBackgroundColor: '#020817'
      },
      android: {
        image: './assets/adaptive-foreground.png',
        imageWidth: 220,
        resizeMode: 'contain',
        backgroundColor: '#020817'
      },
      dark: { image: './assets/splash.png', backgroundColor: '#020817' }
    }],
    ['expo-location', { locationAlwaysAndWhenInUsePermission: 'Allow DieselUp to use location during active deliveries.' }],
    ['expo-notifications', { icon: './assets/notification-icon.png', color: '#FF8A00', defaultChannel: 'orders' }],
    ['expo-image-picker', { photosPermission: 'Allow DieselUp to upload verification and delivery documents.' }]
  ],
  extra: {
    eas: { projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID },
    supportEmail: process.env.EXPO_PUBLIC_SUPPORT_EMAIL ?? 'support@dieselup.ng'
  }
});
