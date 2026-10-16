import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@sportarena/types", "@sportarena/utils"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "upload.wikimedia.org" },
      { protocol: "https", hostname: "assets.adidas.com" },
      { protocol: "https", hostname: "static.nike.com" },
    ],
  },
};

export default nextConfig;
