import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.walkingchallenge.app',
  appName: 'Walking Challenge',
  webDir: 'out',
  server: {
    // Load the production site inside the native WebView (not the external browser)
    url: 'https://nimble-basbousa-d20a87.netlify.app',
    cleartext: false,
    androidScheme: 'https',
  },
  plugins: {
    CapacitorHealth: {
      // iOS HealthKit permissions
      iosPermissions: [
        'step-count-read',
        'distance-walking-running-read',
        'active-energy-burned-read'
      ]
    }
  }
};

export default config;
