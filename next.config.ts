import type { NextConfig } from "next";

// We format the CSP as a readable string, then strip the newlines before injecting it
const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net;
    style-src 'self' 'unsafe-inline';
    img-src * blob: data:;
    media-src * blob: data:;
    connect-src *;
    font-src 'self' data:;
    frame-src *;
    object-src 'none'; 
    base-uri 'none';
    frame-ancestors 'none';
    worker-src 'self' blob:;
`;

const nextConfig: NextConfig = {
  // Disables source maps in production to protect your source code (Checklist Item)
  productionBrowserSourceMaps: false,

  // Inject Strict Security Headers to score an A+ on Mozilla Observatory
  async headers() {
    return [
      {
        // Apply these headers to all routes
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Content-Security-Policy',
            value: cspHeader.replace(/\n/g, ''),
          },
        ],
      },
    ];
  },

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