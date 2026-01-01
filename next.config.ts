import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Advierte pero permite que el build termine exitosamente
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3333',
        pathname: '**',
      },
    ],
  },
  /* config options here */
};

export default nextConfig;
