import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Note: Static export (output: 'export') removed to support API routes
  // For deployment, use Vercel or other platforms that support Next.js API routes
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
