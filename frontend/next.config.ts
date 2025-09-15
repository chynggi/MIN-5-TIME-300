import type { NextConfig } from "next";

const nextConfig: NextConfig = {
   images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'chynggi.cafe24.com',
        pathname: '/uploads/**',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3001/api/:path*', // 백엔드 서버로 프록시
      },
      {
        source: '/uploads/:path*',
        destination: 'http://localhost:3001/uploads/:path*', // 업로드된 미디어 프록시
      },
    ];
  },
};

export default nextConfig;
