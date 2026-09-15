import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Treeshake barrel imports (zod) so server bundles stay lean.
    optimizePackageImports: ["zod"],
  },
};

export default nextConfig;
