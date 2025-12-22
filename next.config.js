/** @type {import('next').NextConfig} */
const nextConfig = {
  // Output configuration for Docker standalone build
  output: 'standalone',

  // Enable React strict mode for better error detection
  reactStrictMode: true,

  // Environment variables exposed to browser
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
  },

  // Image optimization configuration
  images: {
    domains: [
      'trustcheck.co.il',
      'www.trustcheck.co.il',
      // Add Supabase storage domain if using
      'xxxxx.supabase.co',
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Internationalization (Hebrew + English)
  i18n: {
    locales: ['he', 'en'],
    defaultLocale: 'he',
    localeDetection: false,
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },

  // Redirects
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
    ];
  },

  // Rewrites (API proxy if needed)
  async rewrites() {
    return [
      // Example: Proxy CheckID API to avoid CORS
      // {
      //   source: '/api/checkid/:path*',
      //   destination: 'https://api.checkid.co.il/:path*',
      // },
    ];
  },

  // Webpack configuration (if needed)
  webpack: (config, { isServer }) => {
    // Custom webpack config here
    return config;
  },

  // Experimental features
  experimental: {
    // Enable Server Actions (Next.js 14+)
    serverActions: {
      allowedOrigins: ['localhost:3000', 'trustcheck.co.il'],
    },
  },

  // Production optimizations
  swcMinify: true,
  compress: true,
  poweredByHeader: false,

  // TypeScript config
  typescript: {
    // Dangerously allow production builds with type errors
    // Set to false in production!
    ignoreBuildErrors: false,
  },

  // ESLint config
  eslint: {
    // Ignore during builds (run separately in CI)
    ignoreDuringBuilds: false,
  },
};

module.exports = nextConfig;
