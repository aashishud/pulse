"use client";

import React from 'react';

interface DecorationProps {
  type: string;
  children: React.ReactNode;
}

export default function AvatarDecoration({ type, children }: DecorationProps) {
  if (type === 'none' || !type) return <>{children}</>;

  return (
    <div className="relative inline-block">
      {children}
      
      {/* GLITCH FRAME */}
      {type === 'glitch' && (
        <>
          <div className="absolute inset-[-4px] rounded-full border-2 border-transparent border-t-red-500 border-b-blue-500 animate-spin-slow opacity-70 pointer-events-none"></div>
          <div className="absolute inset-[-8px] rounded-full border border-white/20 pointer-events-none"></div>
        </>
      )}

      {/* GOLDEN LAUREL (CSS Ring) */}
      {type === 'gold' && (
        <div className="absolute inset-[-6px] rounded-full border-[3px] border-yellow-400/50 shadow-[0_0_15px_rgba(250,204,21,0.4)] pointer-events-none">
           <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-1 w-2 h-2 bg-yellow-200 rounded-full shadow-glow"></div>
        </div>
      )}

      {/* NEON PULSE */}
      {type === 'neon' && (
        <div className="absolute inset-0 rounded-full shadow-[0_0_20px_rgba(99,102,241,0.6)] animate-pulse pointer-events-none border-2 border-indigo-500/50"></div>
      )}

      {/* FIRE RING */}
      {type === 'fire' && (
        <div className="absolute inset-[-4px] rounded-full bg-gradient-to-t from-red-600 via-orange-500 to-yellow-400 opacity-50 blur-md pointer-events-none -z-10 animate-pulse"></div>
      )}
    </div>
  );
}