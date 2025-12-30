// next.config.ts
import type { NextConfig } from "next";
require('dotenv').config({ path: '.env.local' });

const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  webpack: (config: any, { isServer }: { isServer: boolean }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...(config.resolve?.fallback || {}),
        fs: false,
        net: false,
        tls: false,
        dns: false,
        child_process: false,
        tty: false,
      };
      // Mark Capacitor as external for client-side builds to avoid bundling issues
      config.externals = config.externals || [];
      config.externals.push({
        '@capacitor/core': '@capacitor/core',
        '@capgo/capacitor-health': '@capgo/capacitor-health'
      });
    }
    return config;
  },
  ...(process.env.NODE_ENV === 'development' && {
    env: {
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
    },
  }),
  // Note: For mobile build, we'll use a separate config that exports static files
  // and points API calls to the production Netlify backend
  images: {
    unoptimized: true,
  },
  reactStrictMode: true,
  output: 'standalone',
};

export default nextConfig as unknown as NextConfig;