import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/favicon.ico",
        destination: "/favicon/favicon.ico",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
