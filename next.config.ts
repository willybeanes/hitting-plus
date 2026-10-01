import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/((?!data(?:\/|$)).*)",
        destination: "https://baseballhopper.com/hitting-plus",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
