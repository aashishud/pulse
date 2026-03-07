import { Metadata } from 'next';
import LandingPageClient from '@/components/LandingPageClient';

const isDev = process.env.NODE_ENV === 'development';
const protocol = isDev ? 'http' : 'https';
const domain = isDev ? 'localhost:3000' : (process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'pulsegg.in');
const ogImageUrl = `${protocol}://${domain}/api/og/home`;

export const metadata: Metadata = {
  title: 'Pulse | The Linktree for Gamers',
  description: 'Showcase your gaming career in one link. Steam, Xbox, Epic, and more.',
  openGraph: {
    title: 'Pulse | The Linktree for Gamers',
    description: 'Showcase your gaming career in one link. Steam, Xbox, Epic, and more.',
    url: `${protocol}://${domain}`,
    images: [
      {
        url: ogImageUrl,
        width: 1200,
        height: 630,
        alt: 'Pulse Logo',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pulse | The Linktree for Gamers',
    description: 'Showcase your gaming career in one link.',
    images: [ogImageUrl],
  },
};

export default function Page() {
  return <LandingPageClient />;
}