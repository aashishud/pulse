"use client";

import { Player } from '@lottiefiles/react-lottie-player';

interface AvatarLottieProps {
  src: string;
  className?: string;
}

// This component handles the actual rendering of the Lottie JSON
export default function AvatarLottie({ src, className }: AvatarLottieProps) {
  return (
    // Default to centered inset-[-35%] if no class provided
    <div className={`absolute z-20 pointer-events-none flex items-center justify-center ${className || "inset-[-35%]"}`}>
      <Player
        autoplay
        loop
        src={src}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}