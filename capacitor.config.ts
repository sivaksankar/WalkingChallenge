// capacitor.config.ts
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.walkingchallenge.app',
  appName: 'Walking Challenge',
  webDir: 'out',
  server: {
    url: 'https://nextjs-app-409798850238.us-central1.run.app',
    cleartext: false,
    androidScheme: 'https',
  },
  plugins: {
    CapacitorHealth: {
      iosPermissions: [
        'step-count-read',
        'distance-walking-running-read',
        'active-energy-burned-read'
      ]
    },
    // ✅ ADDED: Browser plugin configuration for OAuth
    CapacitorBrowser: {
      enabled: true,
    },
  },
};

export default config;