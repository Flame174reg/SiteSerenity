// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      // Обложка альбомов (твоя статическая картинка)
      { protocol: "https", hostname: "i.ibb.co" },

      // Хранилище Vercel Blob (твои фото/альбомы)
      { protocol: "https", hostname: "**.public.blob.vercel-storage.com" },

      // Частые источники аватарок (AdminClient и пр.)
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "cdn.discordapp.com" },
    ],
  },
};

export default nextConfig;
