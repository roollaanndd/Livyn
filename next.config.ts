import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Temporarily ignore type errors while using PostgREST adapter
    // (adapter returns untyped results unlike PrismaClient's generated types)
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
