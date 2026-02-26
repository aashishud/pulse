"use client";

import React from 'react';
import dynamic from 'next/dynamic';

// Dynamically import Lottie to avoid SSR issues
const AvatarLottie = dynamic(() => import('./AvatarLottie'), { 
  ssr: false,
  loading: () => null 
});

interface DecorationProps {
  type: string;
  children: React.ReactNode;
}

// ASSET LINKS - Pointing to your local files in /public
const GOD_TIER_ASSETS: Record<string, string> = {
  // Make sure these files exist in your 'public' folder!
  'fire_god': '/fire.json', 
  'electric_god': '/lighting.json', // Check spelling: is it lighting.json or lightning.json?
  'crown_god': '/crown.json', 
};

export default function AvatarDecoration({ type, children }: DecorationProps) {
  if (type === 'none' || !type) return <>{children}</>;

  // Check if it's a God Tier Lottie
  const lottieSrc = GOD_TIER_ASSETS[type];

  // Determine positioning class based on type
  let positionClass = "inset-[-35%]"; // Default centered frame (Fire/Electric)
  
  if (type === 'crown_god') {
    // Shift Crown UPWARDS so it sits on the head, not the face
    positionClass = "inset-x-[-50%] -top-[85%] bottom-[15%]"; 
  }

  return (
    <div className="relative inline-block">
      {/* Lottie Layer (Top) */}
      {lottieSrc && <AvatarLottie src={lottieSrc} className={positionClass} />}

      {/* Avatar Layer (Middle) */}
      <div className="relative z-10">
        {children}
      </div>
      
      {/* CSS Effects Layer (Bottom/Overlay) */}
      {type === 'glitch' && (
        <>
          <div className="absolute inset-[-4px] rounded-full border-2 border-transparent border-t-red-500 border-b-blue-500 animate-spin-slow opacity-70 pointer-events-none z-20"></div>
          <div className="absolute inset-[-8px] rounded-full border border-white/20 pointer-events-none z-0"></div>
        </>
      )}

      {type === 'gold' && (
        <div className="absolute inset-[-6px] rounded-full border-[3px] border-yellow-400/50 shadow-[0_0_15px_rgba(250,204,21,0.4)] pointer-events-none z-20">
           <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-1 w-2 h-2 bg-yellow-200 rounded-full shadow-glow"></div>
        </div>
      )}

      {type === 'neon' && (
        <div className="absolute inset-0 rounded-full shadow-[0_0_20px_rgba(99,102,241,0.6)] animate-pulse pointer-events-none border-2 border-indigo-500/50 z-20"></div>
      )}

      {type === 'fire' && (
        <div className="absolute inset-[-4px] rounded-full bg-gradient-to-t from-red-600 via-orange-500 to-yellow-400 opacity-50 blur-md pointer-events-none -z-10 animate-pulse"></div>
      )}
    </div>
  );
}