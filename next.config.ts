import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Ensure Next resolves from the project workspace, not parent dirs with other lockfiles
  outputFileTracingRoot: path.resolve(__dirname),
  // Helpful defaults
  reactStrictMode: true,
  poweredByHeader: false,
  // Enable static export for Render deployment
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  // Avoid optional deps breaking webpack when not present (WalletConnect logs)
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      // If pino-pretty is missing, don't break the build (optional in browser)
      "pino-pretty": false as unknown as string
    };
    return config;
  }
};

export default nextConfig;
