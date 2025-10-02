import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker optimization
  output: "standalone",

  // Disable telemetry in production
  telemetry: {
    enabled: false,
  },

  // Enable compression
  compress: true,

  // Power optimization
  poweredByHeader: false,

  // Environment variables
  env: {
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
    NEXT_PUBLIC_APP_URL:
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  },

  // API routes
  async rewrites() {
    return [
      {
        source: "/api/backend/:path*",
        destination: `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
        }/:path*`,
      },
    ];
  },

  // Security headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
    ];
  },

  // Image optimization
  images: {
    domains: ["localhost"],
    // Add your domain here for production
    // domains: ['yourdomain.com'],
  },

  // Experimental features for performance
  experimental: {
    optimizeCss: true,
  },
};

export default nextConfig;
