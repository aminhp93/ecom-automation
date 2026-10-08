import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Market Research đổi route /research -> /market-research; giữ link cũ chạy được.
  async redirects() {
    return [
      { source: "/research", destination: "/market-research", permanent: false },
      { source: "/research/:path*", destination: "/market-research/:path*", permanent: false },
    ];
  },
};

export default nextConfig;
