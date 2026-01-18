// next.config.js - Optimized for Firebase Hosting with Cloud Run
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Experimental features
  experimental: {
    serverActions: true,
    serverComponentsExternalPackages: ['firebase-admin'],
  },
  
  // Webpack configuration for Firebase Admin compatibility
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't bundle these server-side packages in client bundle
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
  
  // Transpile packages that need it
  transpilePackages: ['@next-auth/firebase-adapter'],
  
  // React strict mode
  reactStrictMode: true,
  // Ensure Next produces a standalone server build for functions
  output: 'standalone',
  
  // Images configuration for Firebase Hosting
  images: {
    // Firebase Hosting doesn't support Next.js Image Optimization
    // Use unoptimized images or a third-party service
    unoptimized: true,
  },
  
  // Ignore ESLint errors during build
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Ignore TypeScript errors during build
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Headers for security and caching
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
        ],
      },
    ];
  },
  
  // Redirects if needed
  async redirects() {
    return [
      // Example: redirect old login page to new one
      // {
      //   source: '/login',
      //   destination: '/auth/signin',
      //   permanent: true,
      // },
    ];
  },
};

module.exports = nextConfig;