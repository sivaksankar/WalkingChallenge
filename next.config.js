// next.config.js (JS version to support Netlify build)
require('dotenv').config({ path: '.env.local' });

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: true,
    serverComponentsExternalPackages: ['firebase-admin'],
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
        'pg-native': false,
      };
    }
    return config;
  },
  ...(process.env.NODE_ENV === 'development' && {
    env: {
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
    },
  }),
  transpilePackages: ['@next-auth/firebase-adapter'],
  reactStrictMode: true,
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;
