import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/:path*",
        destination: "https://baseball-hopper.vercel.app/hitting-plus",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
