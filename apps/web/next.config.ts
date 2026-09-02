import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@sportarena/types", "@sportarena/utils"],
};

export default nextConfig;
