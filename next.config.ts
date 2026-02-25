import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // We remove allowedDevOrigins to let Vercel handle the host headers automatically
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'avatars.akamai.steamstatic.com' },
      { protocol: 'https', hostname: 'steamcdn-a.akamaihd.net' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'shared.akamai.steamstatic.com' },
      { protocol: 'https', hostname: 'media.steampowered.com' },
      { protocol: 'https', hostname: 'upload.wikimedia.org' },
      { protocol: 'https', hostname: '4kwallpapers.com' },
      { protocol: 'https', hostname: 'images.pexels.com' },
      { protocol: 'https', hostname: 'wallpapers.com' },
      { protocol: 'https', hostname: 'i.pinimg.com' },
    ],
  },
};

export default nextConfig;