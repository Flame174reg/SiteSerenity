// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Vercel Blob (публичные URL)
      { protocol: "https", hostname: "**.public.blob.vercel-storage.com" },
      // Discord аватары (на будущее, если переведёшь админку на <Image />)
      { protocol: "https", hostname: "cdn.discordapp.com" },
      { protocol: "https", hostname: "media.discordapp.net" },
    ],
  },
};

export default nextConfig;
