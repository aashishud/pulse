"use client";

import { useEffect, useRef, useState } from "react";

interface AnimatedAvatarProps {
  src: string;
  alt?: string;
  className?: string;
}

/**
 * Shows a frozen first-frame of GIF avatars by default.
 * Animates on hover (like Discord). Non-GIF images render normally.
 */
export default function AnimatedAvatar({ src, alt = "", className = "" }: AnimatedAvatarProps) {
  const [staticSrc, setStaticSrc] = useState<string | null>(null);
  const [hovering, setHovering] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const isGif = src?.toLowerCase().includes(".gif");

  useEffect(() => {
    if (!isGif || !src) return;
    setStaticSrc(null); // reset on src change

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        canvas.getContext("2d")?.drawImage(img, 0, 0);
        setStaticSrc(canvas.toDataURL("image/webp", 0.8));
      } catch {
        // CORS or other error — just show animated
        setStaticSrc(null);
      }
    };
    img.onerror = () => setStaticSrc(null);
    img.src = src;
  }, [src, isGif]);

  if (!isGif) {
    return <img src={src} alt={alt} className={className} />;
  }

  return (
    <div
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      className="w-full h-full"
    >
      <canvas ref={canvasRef} className="hidden" />
      <img
        src={hovering || !staticSrc ? src : staticSrc}
        alt={alt}
        className={className}
      />
    </div>
  );
}
