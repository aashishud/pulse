"use client";

import React, { useState, useEffect } from 'react';
import { Activity, ArrowRight, TrendingUp, Building, Car, Briefcase, LineChart, Gem } from 'lucide-react';
import { Inter, Space_Grotesk } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], display: 'swap' });
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], display: 'swap' });

// --- CUSTOM RIPPLE BUTTON COMPONENT ---
const RippleButton = ({ children, className, onClick }: { children: React.ReactNode, className?: string, onClick?: () => void }) => {
  const [ripples, setRipples] = useState<{x: number, y: number, size: number, id: number}[]>([]);

  const addRipple = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    
    setRipples(prev => [...prev, { x, y, size, id: Date.now() }]);
    if (onClick) onClick();
  };

  useEffect(() => {
    if (ripples.length > 0) {
       const timeout = setTimeout(() => setRipples([]), 600);
       return () => clearTimeout(timeout);
    }
  }, [ripples]);

  return (
    <button onMouseDown={addRipple} className={`relative overflow-hidden transform-gpu ${className}`}>
       {children}
       {ripples.map((r) => (
         <span
           key={r.id}
           className="absolute rounded-full bg-white/20 pointer-events-none"
           style={{
             left: r.x, top: r.y, width: r.size, height: r.size,
             animation: 'ripple-anim 600ms cubic-bezier(0.4, 0, 0.2, 1)'
           }}
         />
       ))}
    </button>
  );
};

export default function NetworkLandingPage() {
  const [balance, setBalance] = useState(1420500.00);

  // Simulate passive income ticker
  useEffect(() => {
    const interval = setInterval(() => {
      setBalance(prev => prev + (Math.random() * 2.5) + 0.1);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`min-h-screen bg-[#050505] text-white overflow-x-hidden ${inter.className} selection:bg-indigo-500/30`}>
      
      {/* Required CSS for Animations */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes ripple-anim {
            0% { transform: scale(0); opacity: 1; }
            100% { transform: scale(4); opacity: 0; }
        }
        @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-15px); }
        }
        .animate-float {
            animation: float 6s ease-in-out infinite;
        }
        .glass-card {
            background: rgba(18, 18, 20, 0.6);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border: 1px solid rgba(255, 255, 255, 0.05);
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }
      `}} />

      {/* Ambient Glows */}
      <div className="absolute top-[-200px] left-[-200px] w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[10%] right-[-100px] w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none z-0"></div>

      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 glass-card border-b border-white/5 py-4 px-6 md:px-12 flex justify-between items-center">
          <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.4)]">
                  <Activity className="w-4 h-4 text-white" />
              </div>
              <span className={`font-black tracking-tighter text-xl ${spaceGrotesk.className}`}>Pulse Network</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-bold text-zinc-400">
              <a href="#" className="hover:text-white transition">Markets</a>
              <a href="#" className="hover:text-white transition">Real Estate</a>
              <a href="#" className="hover:text-white transition">Leaderboard</a>
          </div>
          <RippleButton className="px-5 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl transition border border-white/10">
              Connect Pulse
          </RippleButton>
      </nav>

      {/* Hero Section */}
      <main className="relative min-h-screen flex flex-col items-center justify-center px-4 pt-32 pb-20">
          
          <div className="text-center max-w-4xl mx-auto z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-widest mb-8">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Markets are open
              </div>
              
              <h1 className={`text-5xl md:text-7xl font-black tracking-tight leading-tight mb-6 ${spaceGrotesk.className}`}>
                  Gamified Wall Street. <br/>
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-emerald-400">
                      The Ultimate Life Economy.
                  </span>
              </h1>
              
              <p className="text-lg text-zinc-400 font-medium max-w-2xl mx-auto mb-12 leading-relaxed">
                  Hustle for cash, build your credit, trade live stocks, and buy exotic cars. Flex your net worth directly on your Pulse profile.
              </p>

              <RippleButton className="group inline-flex items-center justify-center gap-3 px-10 py-5 bg-white text-black rounded-full font-black text-lg tracking-widest transition-transform hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(255,255,255,0.2)]">
                  <span className={`text-xl opacity-80 ${spaceGrotesk.className}`}>(o_o)</span> 
                  <span>CLICK TO ENTER</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </RippleButton>
          </div>

          {/* Floating Dashboard Mockup */}
          <div className="mt-20 w-full max-w-5xl glass-card rounded-[32px] p-6 md:p-10 animate-float relative z-10">
              
              {/* Decorative Mock Browser dots */}
              <div className="flex gap-2 mb-8">
                  <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Live Net Worth */}
                  <div className="md:col-span-2 bg-black/40 border border-white/5 rounded-2xl p-8 shadow-inner flex flex-col justify-between">
                      <div>
                        <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Total Net Worth</p>
                        <div className="flex flex-col sm:flex-row sm:items-end gap-2 sm:gap-4 mb-8">
                            <h2 className={`text-4xl md:text-6xl font-black text-white font-mono tracking-tight ${spaceGrotesk.className}`}>
                                ${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </h2>
                            <span className="text-emerald-400 font-bold sm:mb-2 flex items-center gap-1 text-sm sm:text-base">
                                <TrendingUp className="w-5 h-5" /> +$450.00/hr
                            </span>
                        </div>
                      </div>
                      
                      {/* Fake Glowing Chart */}
                      <div className="w-full h-32 relative flex items-end">
                          <svg viewBox="0 0 100 30" className="w-full h-full overflow-visible">
                              <defs>
                                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="0%" stopColor="#34d399" stopOpacity="0.3"/>
                                      <stop offset="100%" stopColor="#34d399" stopOpacity="0"/>
                                  </linearGradient>
                              </defs>
                              <path d="M0,30 L0,20 Q10,15 20,22 T40,15 T60,5 T80,10 T100,0 L100,30 Z" fill="url(#chartGradient)"/>
                              <path d="M0,20 Q10,15 20,22 T40,15 T60,5 T80,10 T100,0" fill="none" stroke="#34d399" strokeWidth="1" className="drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]"/>
                          </svg>
                      </div>
                  </div>

                  {/* Active Assets Sidebar */}
                  <div className="flex flex-col gap-4">
                      <div className="bg-black/40 border border-white/5 rounded-2xl p-5 shadow-inner">
                          <div className="flex items-center justify-between mb-4">
                              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                                  <Building className="w-5 h-5" />
                              </div>
                              <span className="text-xs font-bold text-zinc-500">Real Estate</span>
                          </div>
                          <p className="font-bold text-white text-lg">Neon Penthouse</p>
                          <p className="text-xs text-emerald-400 font-mono mt-1">Value: $850,000</p>
                      </div>

                      <div className="bg-black/40 border border-white/5 rounded-2xl p-5 shadow-inner">
                          <div className="flex items-center justify-between mb-4">
                              <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                                  <Car className="w-5 h-5" />
                              </div>
                              <span className="text-xs font-bold text-zinc-500">Garage</span>
                          </div>
                          <p className="font-bold text-white text-lg">2024 V12 Spyder</p>
                          <p className="text-xs text-emerald-400 font-mono mt-1">Value: $320,000</p>
                      </div>

                      <RippleButton className="mt-auto w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl font-bold text-sm transition">
                          View Full Portfolio
                      </RippleButton>
                  </div>
              </div>
          </div>
      </main>

      {/* Features Grid */}
      <section className="max-w-6xl mx-auto px-6 pb-32 grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
          <div className="glass-card p-8 rounded-3xl group">
              <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-6 group-hover:scale-110 transition-transform">
                  <Briefcase className="w-6 h-6" />
              </div>
              <h3 className={`text-xl font-black text-white mb-3 ${spaceGrotesk.className}`}>The Hustle</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">Start from the bottom. Complete active jobs, level up your career path, and buy passive businesses to generate cash while you sleep.</p>
          </div>

          <div className="glass-card p-8 rounded-3xl group">
              <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-6 group-hover:scale-110 transition-transform">
                  <LineChart className="w-6 h-6" />
              </div>
              <h3 className={`text-xl font-black text-white mb-3 ${spaceGrotesk.className}`}>The Markets</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">Open a bank account, build your FICO credit score to unlock loans, and trade stocks in a highly volatile, live player economy.</p>
          </div>

          <div className="glass-card p-8 rounded-3xl group">
              <div className="w-14 h-14 bg-purple-500/10 rounded-2xl border border-purple-500/20 flex items-center justify-center text-purple-400 mb-6 group-hover:scale-110 transition-transform">
                  <Gem className="w-6 h-6" />
              </div>
              <h3 className={`text-xl font-black text-white mb-3 ${spaceGrotesk.className}`}>The Flex</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">Buy and trade exotic cars, penthouses, and private islands. Show off your top assets instantly on your connected Pulse.gg profile.</p>
          </div>
      </section>
    </div>
  );
}