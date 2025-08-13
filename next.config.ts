
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },

  async headers() {
    return [
      {
        source: '/favicon.ico',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  experimental: {
    // This is required to allow the Next.js dev server to accept requests from the
    // App Prototyper, which is served on a different port.
    allowedDevOrigins: [
      'http://localhost:9000',
      'https://*.google.com',
      'https://*.cloud.google.com',
      'https://*.cloud.goog',
      'https://*.dev',
    ],
  },
};

export default nextConfig;
