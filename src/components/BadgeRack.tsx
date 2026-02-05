"use client";

import { useState } from 'react';
import { Shield, Zap, Star, Code, Cpu, Globe } from 'lucide-react';

interface BadgeProps {
  type: string;
  label: string;
}

const badges: Record<string, { icon: any, color: string }> = {
  founder: { icon: Star, color: "text-yellow-400" },
  verified: { icon: Shield, color: "text-blue-400" },
  steam: { icon: Cpu, color: "text-slate-300" },
  discord: { icon: Globe, color: "text-indigo-400" },
  developer: { icon: Code, color: "text-green-400" },
  early: { icon: Zap, color: "text-orange-400" },
};

export default function BadgeRack({ badgeList }: { badgeList: string[] }) {
  if (!badgeList || badgeList.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-2 justify-center md:justify-start">
      {badgeList.map((badgeType) => {
        const badge = badges[badgeType];
        if (!badge) return null;
        
        return (
          <div key={badgeType} className="group relative">
            <div className={`p-1.5 rounded-lg bg-white/5 border border-white/10 ${badge.color}`}>
              <badge.icon className="w-3 h-3" />
            </div>
            
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black border border-white/20 rounded text-[10px] font-bold text-white opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap z-50">
              {badgeType.charAt(0).toUpperCase() + badgeType.slice(1)}
            </div>
          </div>
        );
      })}
    </div>
  );
}