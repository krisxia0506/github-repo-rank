import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  // GitHub Pages 部署配置
  basePath: '/github-repo-rank',
  assetPrefix: '/github-repo-rank',
};

export default nextConfig;
