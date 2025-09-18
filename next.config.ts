import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      // Vercel Blob (если уже добавлено — оставьте)
      { protocol: "https", hostname: "**.public.blob.vercel-storage.com" },
      // Статическая обложка альбомов
      { protocol: "https", hostname: "i.ibb.co" },
    ],
  },
};

export default nextConfig;
