import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Включай по желанию
  reactStrictMode: true,

  images: {
    // Разрешаем домены Vercel Blob (важно для <Image/>)
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.public.blob.vercel-storage.com',
      },
    ],
  },
};

export default nextConfig;
