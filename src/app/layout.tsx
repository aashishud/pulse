import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_ROOT_DOMAIN
      ? `https://${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`
      : 'https://pulsegg.in'
  ),
  title: "Pulse | The Linktree for Gamers",
  description: "Aggregate your achievements, showcase your stats, and build your ultimate gaming portfolio. Connect Steam, Xbox, Discord, and more.",
  openGraph: {
    title: "Pulse | The Linktree for Gamers",
    description: "Showcase your gaming career in one link. Steam, Xbox, Epic, and more.",
    url: "https://pulsegg.vercel.app",
    siteName: "Pulse",
    images: [
      {
        url: "/og-image.jpg", // Relative path works best
        width: 1200,
        height: 630,
        alt: "Pulse Dashboard Preview",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pulse | The Linktree for Gamers",
    description: "Aggregate your achievements, showcase your stats, and build your ultimate gaming portfolio.",
    images: ["/og-image.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#0a0a0c] text-white antialiased`}>
        {children}
      </body>
    </html>
  );
}