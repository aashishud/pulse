"use client";

import React, { useState, useEffect } from 'react';
import IPhoneMockup from '@/components/ui/iphone-mockup';
import {
  MessageCircle, Compass, BarChart3, Wallet, CandlestickChart, Home,
  Gem, Crown, Lock, Search
} from 'lucide-react';

// --- APP DEFINITIONS ---
export interface PhoneApp {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
  colorEnd: string;
  unlocked: boolean;
  badge?: number;
}

interface PulsePhoneProps {
  playerPath: string | null;
  balance: number;
  netWorth: number;
  energy: number;
  maxEnergy: number;
  displayName: string;
  onAppOpen: (appId: string) => void;
  activeApp: string | null;
  messageBadge?: number;
}

// ── CUSTOM ACCURATE IOS STATUS BAR COMPONENT ──
const IOSStatusBar = ({ time }: { time: string }) => (
  <div className="flex items-center justify-between px-7 pt-4 pb-1 z-10 w-full" style={{ fontSize: 13, fontWeight: 600 }}>
    <span className="tracking-tight text-white">{time}</span>
    <div className="flex items-center gap-1.5">
      {/* Signal Bars */}
      <div className="flex items-end gap-[1.5px] h-[10px]">
        <div className="w-[3px] h-[30%] bg-white rounded-[0.5px]" />
        <div className="w-[3px] h-[50%] bg-white rounded-[0.5px]" />
        <div className="w-[3px] h-[80%] bg-white rounded-[0.5px]" />
        <div className="w-[3px] h-[100%] bg-white/40 rounded-[0.5px]" />
      </div>
      <span className="text-[10px] font-bold text-white tracking-tighter">5G</span>
      {/* Wifi Icon (simplified) */}
      <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12.55a11 11 0 0 1 14.08 0" />
        <path d="M9 17.05a7 7 0 0 1 6 0" />
        <path d="M12 20h.01" />
      </svg>
      {/* Battery Icon */}
      <div className="flex items-center gap-[1px]">
        <div className="relative w-[24px] h-[11.5px] rounded-[3px] border-[1px] border-white/40 p-[1.5px] flex items-center">
            <div className="h-full bg-white rounded-[1px]" style={{ width: '64%' }} />
            <span className="absolute inset-0 flex items-center justify-center text-[7px] font-black text-white/90 leading-none">64</span>
        </div>
        <div className="w-[1.5px] h-[4px] bg-white/40 rounded-r-[1px]" />
      </div>
    </div>
  </div>
);

export default function PulsePhone({
  playerPath,
  balance,
  netWorth,
  energy,
  maxEnergy,
  displayName,
  onAppOpen,
  activeApp,
  messageBadge = 0,
}: PulsePhoneProps) {
  const [pressedApp, setPressedApp] = useState<string | null>(null);
  const [time, setTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  const isMarketsUnlocked = playerPath === 'corporate' || playerPath === 'founder' || playerPath === 'cartel_ceo';
  const isRealEstateUnlocked = playerPath === 'founder' || playerPath === 'cartel_ceo';

  const apps: PhoneApp[] = [
    { id: 'messages',    label: 'Messages',    icon: MessageCircle,    color: '#34C759', colorEnd: '#28A745', unlocked: true, badge: messageBadge },
    { id: 'navigator',   label: 'Navigator',   icon: Compass,          color: '#007AFF', colorEnd: '#0056b3', unlocked: true },
    { id: 'overview',    label: 'Business',    icon: BarChart3,        color: '#AF52DE', colorEnd: '#8E44AD', unlocked: true },
    { id: 'banking',     label: 'Vault',       icon: Wallet,           color: '#5AC8FA', colorEnd: '#3498DB', unlocked: true },
    { id: 'markets',     label: 'Markets',     icon: CandlestickChart, color: '#FF9500', colorEnd: '#E67E22', unlocked: isMarketsUnlocked },
    { id: 'real_estate', label: 'Properties',  icon: Home,             color: '#FF2D55', colorEnd: '#C0392B', unlocked: isRealEstateUnlocked },
    { id: 'lifestyle',   label: 'Lifestyle',   icon: Gem,              color: '#FFCC00', colorEnd: '#F1C40F', unlocked: true },
    { id: 'leaderboard', label: 'Ranking',     icon: Crown,            color: '#8E8E93', colorEnd: '#636366', unlocked: true },
  ];

  const dockApps = ['messages', 'navigator', 'overview'];
  const energyPct = Math.round((energy / maxEnergy) * 100);

  return (
    <IPhoneMockup
      model="15-pro"
      color="natural-titanium"
      scale={0.9}
      screenBg="#000"
      safeArea={false}
      style={{ transformOrigin: 'center center' }}
    >
      <div className="w-full h-full flex flex-col text-white select-none overflow-hidden relative" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif' }}>
        
        {/* ── WALLPAPER LAYER ── */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
           <img src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop" className="w-full h-full object-cover" alt="wallpaper" />
           <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60" />
        </div>

        <IOSStatusBar time={time} />

        {/* ── WIDGETS (iOS Style) ── */}
        <div className="px-5 pt-2 pb-1 grid grid-cols-2 gap-3.5 z-10">
          {/* Clock-style Stat Widget */}
          <div className="bg-black/30 backdrop-blur-3xl rounded-[22px] p-4 border border-white/10 shadow-lg aspect-square flex flex-col justify-between">
            <div className="flex justify-between items-start">
               <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">NET WORTH</span>
               <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            </div>
            <div className="flex flex-col">
               <p className="text-[10px] font-medium text-white/30 mb-0.5">Total Combined</p>
               <p className="text-xl font-black text-white leading-none tracking-tight">
                 ${netWorth >= 1000000 ? `${(netWorth / 1000000).toFixed(1)}M` : netWorth >= 1000 ? `${(netWorth / 1000).toFixed(1)}K` : netWorth.toFixed(0)}
               </p>
            </div>
          </div>
          {/* Calendar-style Stat Widget */}
          <div className="bg-black/30 backdrop-blur-3xl rounded-[22px] p-4 border border-white/10 shadow-lg aspect-square flex flex-col justify-between">
            <div className="flex flex-col">
               <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest leading-none mb-1">ENERGY</span>
               <span className="text-2xl font-black text-white leading-none">{Math.floor(energy)}</span>
            </div>
            <div className="flex flex-col gap-1.5">
               <p className="text-[9px] font-bold text-white/40 uppercase tracking-tighter">Status: {playerPath || 'Hustler'}</p>
               <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                 <div className="h-full bg-gradient-to-r from-yellow-500 to-orange-400 rounded-full transition-all duration-500" style={{ width: `${energyPct}%` }} />
               </div>
            </div>
          </div>
        </div>

        {/* ── APP GRID ── */}
        <div className="flex-1 px-5 pt-5 z-10">
          <div className="grid grid-cols-4 gap-x-3 gap-y-6 justify-items-center">
            {apps.map((app) => (
              <button
                key={app.id}
                onClick={() => app.unlocked && onAppOpen(app.id)}
                onMouseDown={() => setPressedApp(app.id)}
                onMouseUp={() => setPressedApp(null)}
                onMouseLeave={() => setPressedApp(null)}
                className="flex flex-col items-center gap-1.5 group outline-none"
                disabled={!app.unlocked}
              >
                <div
                  className="relative w-[58px] h-[58px] rounded-[15px] flex items-center justify-center transition-all duration-150"
                  style={{
                    background: app.unlocked
                      ? `linear-gradient(145deg, ${app.color}, ${app.colorEnd})`
                      : 'rgba(255,255,255,0.06)',
                    transform: pressedApp === app.id ? 'scale(0.85)' : activeApp === app.id ? 'scale(1.08)' : 'scale(1)',
                    boxShadow: activeApp === app.id
                      ? `0 4px 25px ${app.color}70, inset 0 1px 0 rgba(255,255,255,0.4)`
                      : app.unlocked
                        ? `0 2px 10px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.25)`
                        : 'none',
                    border: activeApp === app.id ? '2.5px solid rgba(255,255,255,0.4)' : 'none',
                  }}
                >
                  {app.unlocked ? (
                    <app.icon className="w-7 h-7 text-white drop-shadow-md" strokeWidth={2} />
                  ) : (
                    <Lock className="w-5 h-5 text-white/25" />
                  )}

                  {app.badge != null && app.badge > 0 && (
                    <div className="absolute -top-1.5 -right-1.5 min-w-[22px] h-[22px] bg-[#FF3B30] rounded-full flex items-center justify-center px-1 shadow-lg shadow-red-500/40 border-[1.5px] border-black/10">
                      <span className="text-[11px] font-bold text-white leading-none">{app.badge > 99 ? '99+' : app.badge}</span>
                    </div>
                  )}
                </div>
                <span className="text-[11px] font-medium text-white/90 leading-tight text-center truncate w-full drop-shadow-sm">
                  {app.unlocked ? app.label : '???'}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ── SEARCH BAR (iOS 16+ Style) ── */}
        <div className="px-6 py-4 z-10 flex justify-center">
          <div className="bg-black/20 backdrop-blur-3xl rounded-full py-1.5 px-3.5 flex items-center gap-1.5 border border-white/5 shadow-lg">
            <Search className="w-3 h-3 text-white/60" strokeWidth={3} />
            <span className="text-[12px] text-white/80 font-bold tracking-tight">Search</span>
          </div>
        </div>

        {/* ── DOCK ── */}
        <div className="px-4 pb-3 z-10">
          <div className="bg-white/20 backdrop-blur-3xl rounded-[30px] border border-white/10 p-3 flex justify-around items-center shadow-2xl">
            {dockApps.map((dockId) => {
              const app = apps.find(a => a.id === dockId);
              if (!app) return null;
              return (
                <button
                  key={app.id}
                  onClick={() => onAppOpen(app.id)}
                  onMouseDown={() => setPressedApp(`dock-${app.id}`)}
                  onMouseUp={() => setPressedApp(null)}
                  onMouseLeave={() => setPressedApp(null)}
                  className="relative outline-none"
                >
                  <div
                    className="w-[58px] h-[58px] rounded-[15px] flex items-center justify-center transition-all duration-150"
                    style={{
                      background: `linear-gradient(145deg, ${app.color}, ${app.colorEnd})`,
                      transform: pressedApp === `dock-${app.id}` ? 'scale(0.85)' : 'scale(1)',
                      boxShadow: `0 4px 15px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.3)`,
                    }}
                  >
                    <app.icon className="w-7 h-7 text-white drop-shadow-md" strokeWidth={2} />
                  </div>
                  {app.badge != null && app.badge > 0 && (
                    <div className="absolute -top-1.5 -right-1.5 min-w-[22px] h-[22px] bg-[#FF3B30] rounded-full flex items-center justify-center px-1 shadow-lg shadow-red-500/40 border-[1.5px] border-black/10">
                      <span className="text-[11px] font-bold text-white leading-none">{app.badge > 99 ? '99+' : app.badge}</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </IPhoneMockup>
  );
}
