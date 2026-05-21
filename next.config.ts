import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const isMobile = process.env.BUILD_MODE === 'mobile';

const nextConfig: NextConfig = {
  output: isMobile ? 'export' : undefined,
  images: { unoptimized: isMobile },
  trailingSlash: true,
  async headers() {
    if (isMobile) return [];
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  widenClientFileUpload: true,
  sourcemaps: { disable: true },
});
