import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.walkingchallenge.app',
  appName: 'Walking Challenge',
  webDir: 'out',
  server: {
    // For now, the mobile app will load the production web app
    // This allows us to use all the server-side features
    // Later we can build a standalone static version if needed
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
