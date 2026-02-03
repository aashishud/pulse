import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

// 1. Define your Metadata here
export const metadata: Metadata = {
  title: "Pulse | The Linktree for Gamers",
  description: "Aggregate your achievements, showcase your stats, and build your ultimate gaming portfolio. Connect Steam, Xbox, Discord, and more.",
  
  // 2. Open Graph (Facebook, Discord, LinkedIn)
  openGraph: {
    title: "Pulse | The Linktree for Gamers",
    description: "Showcase your gaming career in one link. Steam, Xbox, Epic, and more.",
    url: "https://pulsegg.vercel.app",
    siteName: "Pulse",
    images: [
      {
        url: "https://pulsegg.vercel.app/og-image.jpg", // We'll handle this image next
        width: 1200,
        height: 630,
        alt: "Pulse Dashboard Preview",
      },
    ],
    locale: "en_US",
    type: "website",
  },

  // 3. Twitter Card
  twitter: {
    card: "summary_large_image",
    title: "Pulse | The Linktree for Gamers",
    description: "Aggregate your achievements, showcase your stats, and build your ultimate gaming portfolio.",
    // images: ["https://pulsegg.vercel.app/og-image.jpg"], // Add your image URL here later
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