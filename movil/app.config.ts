import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'Vecinos',
  slug: 'vecinos',
  scheme: 'vecinos',
  version: '0.1.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  userInterfaceStyle: 'automatic',
  android: {
    package: 'pe.thelastcommit.vecinos',
    googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? './google-services.json',
    adaptiveIcon: {
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    permissions: [
      'ACCESS_FINE_LOCATION',
      'ACCESS_COARSE_LOCATION',
      'ACCESS_BACKGROUND_LOCATION',
      'FOREGROUND_SERVICE',
      'FOREGROUND_SERVICE_LOCATION',
      'POST_NOTIFICATIONS',
      'USE_FULL_SCREEN_INTENT',
      'VIBRATE',
      'SEND_SMS',
      'RECEIVE_SMS',
    ],
    config: {
      googleMaps: { apiKey: process.env.GOOGLE_MAPS_API_KEY },
    },
  },
    plugins: [
    'expo-router',
    [
      'expo-splash-screen',
      {
        image: './assets/images/splash-icon.png',
        imageWidth: 200,
        resizeMode: 'contain',
        backgroundColor: '#F6F8F5',
      },
    ],
    ['./plugins/withFirebaseBom.js', { bom: '34.19.0' }],
    '@react-native-firebase/app',
    '@react-native-firebase/auth',
    '@react-native-firebase/app-check',
    '@react-native-firebase/crashlytics',
    '@react-native-firebase/messaging',
    '@react-native-google-signin/google-signin',
    'react-native-notify-kit',
    [
      'expo-location',
      {
        locationWhenInUsePermission: 'Vecinos usa tu ubicación para mostrarte necesidades cercanas.',
        locationAlwaysAndWhenInUsePermission:
          'Vecinos comparte tu ubicación con el vecino al que ayudas solo durante el servicio.',
        isAndroidBackgroundLocationEnabled: true,
        isAndroidForegroundServiceEnabled: true,
      },
    ],
    [
      'expo-image-picker',
      {
        photosPermission: 'Vecinos usa tus fotos para tu foto de perfil.',
        cameraPermission: 'Vecinos usa la cámara para tu foto de perfil.',
      },
    ],
    [
      'expo-build-properties',
      {
        android: { usesCleartextTraffic: false },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
};

export default config;