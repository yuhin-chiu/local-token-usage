import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["10.94.20.193"],
  async redirects() {
    return [
      { source: "/", destination: "/dashboard", permanent: false },
    ];
  },
};

export default nextConfig;
