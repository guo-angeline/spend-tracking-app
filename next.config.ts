import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: process.env.BUILD_MODE === 'mobile' ? 'export' : undefined,
  images: { unoptimized: true },
  trailingSlash: true,
  /* other config options here */
};

export default nextConfig;
