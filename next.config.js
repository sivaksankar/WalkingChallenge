// next.config.js (JS version to support Netlify build)
require('dotenv').config({ path: '.env.local' });

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  webpack: (config, { isServer }) => {
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

module.exports = nextConfig;
