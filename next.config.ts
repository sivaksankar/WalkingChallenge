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
    }
    return config;
  },
  ...(process.env.NODE_ENV === 'development' && {
    env: {
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
    },
  }),
  reactStrictMode: true,
  output: 'standalone',
};

export default nextConfig as unknown as NextConfig;