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
    // Allow navigation to Google OAuth URLs within the WebView
    // This prevents the app from opening external browser for OAuth
    allowNavigation: [
      'accounts.google.com',
      '*.google.com',
      '*.googleapis.com',
      'nextjs-app-409798850238.us-central1.run.app',
    ],
  },
  plugins: {
    CapacitorHealth: {
      iosPermissions: [
        'step-count-read',
        'distance-walking-running-read',
        'active-energy-burned-read'
      ]
    },
    // Browser plugin for OAuth fallback
    CapacitorBrowser: {
      enabled: true,
    },
  },
  // iOS-specific configuration
  ios: {
    // Allow mixed content for OAuth redirects
    allowsLinkPreview: false,
    // Scroll behavior
    scrollEnabled: true,
  },
};

export default config;