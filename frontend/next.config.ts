import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // v0.2.0 までの URL を v0.3.0 の画面へ転送する
  async redirects() {
    return [
      { source: "/phase1", destination: "/phases", permanent: false },
      { source: "/phase1/:path*", destination: "/phases", permanent: false },
      { source: "/test", destination: "/phases", permanent: false },
    ];
  },
};

export default nextConfig;
