import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/favicon.ico",
        destination: "/favicon/favicon.ico",
        permanent: true,
      },
      // Legacy JobBox / Laravel job-board URLs → current routes
      { source: "/member/login", destination: "/login", permanent: true },
      { source: "/member/register", destination: "/register", permanent: true },
      { source: "/member/:path*", destination: "/login", permanent: true },
      { source: "/companies", destination: "/jobs", permanent: true },
      { source: "/browse-companies", destination: "/jobs", permanent: true },
      { source: "/company/:path*", destination: "/jobs", permanent: true },
      { source: "/news", destination: "/", permanent: true },
      { source: "/news/:path*", destination: "/", permanent: true },
      { source: "/posts/:path*", destination: "/", permanent: true },
      { source: "/job-box", destination: "/", permanent: true },
      { source: "/jobbox", destination: "/", permanent: true },
      { source: "/jobs-list", destination: "/jobs", permanent: true },
      { source: "/find-jobs", destination: "/jobs", permanent: true },
      { source: "/candidate/login", destination: "/login", permanent: true },
      { source: "/candidate/register", destination: "/register", permanent: true },
    ];
  },
};

export default nextConfig;
