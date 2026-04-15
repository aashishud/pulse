"use client";

import React, { useState, useEffect, useRef } from 'react';
import { TrendingUp, Building2, ShieldAlert, ArrowRight, Briefcase, Globe, MapPin, ChevronRight, BarChart3 } from 'lucide-react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

// --- Premium Minimalist Logo ---
const PulseNetworkLogo = ({ className = "w-6 h-6" }) => (
  <div className="relative inline-flex items-center justify-center">
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M10 28L14 4H22L28 10V14L22 20H16L14.5 28H10Z" fill="currentColor" />
      <path d="M16 9H20L22 11V13L20 15H15L16 9Z" fill="#000000" />
    </svg>
    <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
  </div>
);

// --- Auth Redirect Helper ---
const handleAuth = (type: 'login' | 'signup') => {
  if (typeof window === 'undefined') return;
  const isLocalhost = window.location.hostname.includes('localhost');
  const mainDomain = isLocalhost ? 'http://localhost:3000' : 'https://pulsegg.in';
  const networkDomain = isLocalhost ? 'http://network.localhost:3000' : 'https://network.pulsegg.in';
  window.location.href = `${mainDomain}/${type}?redirect=${encodeURIComponent(networkDomain + '/dashboard')}`;
};

export default function NetworkLandingPage() {
  const [ticker, setTicker] = useState(8430291);
  const [user, setUser] = useState<any>(null);
  
  useEffect(() => {
    return onAuthStateChanged(auth, setUser);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setTicker(prev => prev + Math.floor(Math.random() * 100));
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-[#050505] text-white selection:bg-white/20 font-sans relative w-full overflow-x-hidden">
      
      {/* --- FLOATING NAVIGATION --- */}
      <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex items-center justify-between px-6 py-3 w-[92%] max-w-5xl rounded-full bg-white/[0.02] backdrop-blur-2xl border border-white/[0.05] shadow-2xl transition-all duration-500 hover:bg-white/[0.05]">
        <div className="flex items-center gap-3 font-bold tracking-tight cursor-default">
          <PulseNetworkLogo className="w-5 h-5 text-white" />
          <span className="text-white mt-0.5 text-sm md:text-base">Pulse<span className="text-zinc-500 font-normal">Network</span></span>
        </div>
        <div className="hidden md:flex gap-8 text-[11px] font-bold uppercase tracking-widest text-zinc-500">
          <button className="hover:text-white transition-colors duration-300">Marketplace</button>
          <button className="hover:text-white transition-colors duration-300">Leaderboards</button>
        </div>
        <div className="flex items-center gap-4">
          {user ? (
            <button 
              onClick={() => window.location.href = '/dashboard'} 
              className="text-[10px] font-bold uppercase tracking-widest bg-white text-black px-5 py-2.5 rounded-full transition-transform duration-300 hover:scale-105"
            >
              Go to Dashboard
            </button>
          ) : (
            <>
              <button onClick={() => handleAuth('login')} className="hidden sm:block text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-white transition-colors duration-300">
                Log in
              </button>
              <button onClick={() => handleAuth('signup')} className="text-[10px] font-bold uppercase tracking-widest bg-white text-black px-5 py-2.5 rounded-full transition-transform duration-300 hover:scale-105">
                Begin
              </button>
            </>
          )}
        </div>
      </nav>

      {/* --- CINEMATIC HERO SECTION --- */}
      <section className="min-h-screen w-full flex flex-col items-center justify-center relative pt-32 pb-20">
        
        {/* Abstract Cinematic Video/Image Background */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none border-b border-white/5">
           <div className="absolute inset-0 bg-black/60 z-10" /> {/* Darken overlay */}
           <motion.img 
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              transition={{ duration: 10, ease: "easeOut" }}
              src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop" 
              alt="Abstract background"
              className="w-full h-full object-cover opacity-30 mix-blend-lighten"
           />
           {/* Deep Ambient Aurora */}
           <motion.div animate={{ rotate: 360 }} transition={{ duration: 150, repeat: Infinity, ease: "linear" }} className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] rounded-full bg-indigo-900/40 blur-[120px] mix-blend-screen z-10" />
           <motion.div animate={{ rotate: -360 }} transition={{ duration: 120, repeat: Infinity, ease: "linear" }} className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-emerald-900/30 blur-[120px] mix-blend-screen z-10" />
           {/* Grain Overlay */}
           <div className="absolute inset-0 z-20 opacity-[0.03] mix-blend-overlay" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>
        </div>
        
        <div className="relative z-30 flex flex-col items-center text-center px-4 w-full">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.03] border border-white/[0.08] mb-12 backdrop-blur-md shadow-2xl">
             <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]"></span>
             <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-300 mt-px">System Architecture v2.4</span>
          </motion.div>

          {/* Massive Hollow & Filled Typography */}
          <div className="flex flex-col items-center justify-center w-full max-w-[1200px] mb-16">
             <motion.h1 
                initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
                className="text-[12vw] md:text-[8rem] font-black tracking-tighter leading-[0.85] text-transparent"
                style={{ WebkitTextStroke: '2px rgba(255,255,255,0.15)' }}
             >
                MASTER THE
             </motion.h1>
             <motion.h1 
                initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                className="text-[14vw] md:text-[9.5rem] font-black tracking-tighter leading-[0.85] text-white drop-shadow-[0_20px_40px_rgba(255,255,255,0.15)]"
             >
                MARKETS.
             </motion.h1>
          </div>

          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}>
            {user ? (
               <button onClick={() => window.location.href = '/dashboard'} className="group relative inline-flex items-center justify-center gap-4 px-10 py-5 bg-white text-black rounded-full overflow-hidden transition-all duration-700 hover:scale-105 hover:shadow-[0_0_60px_rgba(255,255,255,0.3)]">
                 <div className="absolute inset-0 bg-gradient-to-r from-zinc-300 via-white to-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                 <span className="relative z-10 font-bold text-sm tracking-widest uppercase flex items-center gap-3">
                   Access Dashboard
                   <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center group-hover:translate-x-2 transition-transform duration-500">
                     <ArrowRight className="w-4 h-4 text-white" />
                   </div>
                 </span>
               </button>
            ) : (
               <button onClick={() => handleAuth('signup')} className="group relative inline-flex items-center justify-center gap-4 px-10 py-5 bg-white text-black rounded-full overflow-hidden transition-all duration-700 hover:scale-105 hover:shadow-[0_0_60px_rgba(255,255,255,0.3)]">
                 <div className="absolute inset-0 bg-gradient-to-r from-zinc-300 via-white to-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                 <span className="relative z-10 font-bold text-sm tracking-widest uppercase flex items-center gap-3">
                   Initialize Connection 
                   <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center group-hover:translate-x-2 transition-transform duration-500">
                     <ArrowRight className="w-4 h-4 text-white" />
                   </div>
                 </span>
               </button>
            )}
          </motion.div>
        </div>
      </section>

      {/* --- SCROLL REVEAL FEATURE CARDS --- */}
      <section className="w-full max-w-6xl mx-auto px-4 py-32 flex flex-col gap-32">
        
        {/* Feature 1 */}
        <motion.div 
           initial={{ opacity: 0, y: 100 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
           className="relative w-full rounded-[40px] border border-white/10 flex flex-col md:flex-row bg-[#0a0a0c] overflow-hidden"
        >
           <div className="absolute top-0 right-0 w-[60vw] h-[60vw] md:w-[40vw] md:h-[40vw] rounded-full blur-[120px] opacity-20 mix-blend-screen bg-gradient-to-br from-emerald-500 to-teal-900 translate-x-1/3 -translate-y-1/4 pointer-events-none" />
           <div className="flex-1 p-8 md:p-16 flex flex-col justify-center relative z-10">
              <div className="w-16 h-16 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mb-8 backdrop-blur-md">
                <BarChart3 className="w-8 h-8 text-white opacity-80" />
              </div>
              <h3 className="text-[10px] md:text-xs font-bold uppercase tracking-[0.3em] text-zinc-500 mb-4">Phase 01 — Wealth Management</h3>
              <h2 className="text-4xl md:text-6xl font-black tracking-tighter leading-[0.9] text-white mb-6">LIVE<br/>TREASURY.</h2>
              <p className="text-lg text-zinc-400 font-light max-w-md">Deposit funds into high-yield Citadel algorithms or safe Vanguard index funds. Earn compound passive yield while you sleep.</p>
           </div>
           <div className="flex-1 relative z-10 p-8 md:p-16 flex items-center justify-center">
              <div className="w-full bg-black/40 backdrop-blur-md rounded-3xl border border-white/10 p-8 shadow-2xl relative overflow-hidden">
                 <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:24px_24px]"></div>
                 <div className="relative z-10">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Total Net Worth</p>
                    <p className="text-3xl md:text-5xl font-light font-mono text-white tracking-tight mb-4">${ticker.toLocaleString('en-US')}</p>
                    <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-4 py-2 rounded-full border border-emerald-500/20">
                       <TrendingUp className="w-4 h-4" /> <span className="font-bold font-mono text-sm">+12.4%</span>
                    </div>
                 </div>
              </div>
           </div>
        </motion.div>

        {/* Feature 2 */}
        <motion.div 
           initial={{ opacity: 0, y: 100 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
           className="relative w-full rounded-[40px] border border-white/10 flex flex-col md:flex-row bg-[#0a0a0c] overflow-hidden"
        >
           <div className="absolute bottom-0 left-0 w-[60vw] h-[60vw] md:w-[40vw] md:h-[40vw] rounded-full blur-[120px] opacity-20 mix-blend-screen bg-gradient-to-tr from-indigo-500 to-purple-900 -translate-x-1/3 translate-y-1/4 pointer-events-none" />
           <div className="flex-1 relative z-10 p-8 md:p-16 flex items-center justify-center order-2 md:order-1">
              <div className="w-full max-w-[320px] aspect-[1.586/1] rounded-2xl flex flex-col justify-between text-white relative shadow-[0_30px_60px_rgba(0,0,0,0.6)] bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#111827] border border-white/20 p-6 md:p-8 transform rotate-y-[10deg] rotate-x-[5deg] perspective-[1000px]">
                 <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 pointer-events-none rounded-2xl opacity-50"></div>
                 <div className="flex justify-between items-start relative z-10">
                   <h3 className="font-bold text-lg tracking-tight">Pulse Black</h3>
                   <svg className="w-8 h-8 opacity-70" viewBox="0 0 40 30" fill="none"><rect width="40" height="30" rx="4" fill="url(#paint0_linear)"/><path d="M10 0V30M30 0V30M0 15H40M15 0V15M25 30V15" stroke="#B8860B" strokeWidth="0.5" strokeOpacity="0.5"/><defs><linearGradient id="paint0_linear" x1="0" y1="0" x2="40" y2="30" gradientUnits="userSpaceOnUse"><stop stopColor="#F9D423"/><stop offset="1" stopColor="#B8860B"/></linearGradient></defs></svg>
                 </div>
                 <div className="relative z-10 mt-auto">
                   <p className="font-mono text-xl font-bold tracking-widest mb-4">740 <span className="text-[10px] text-indigo-300 font-sans uppercase tracking-widest ml-2">FICO Score</span></p>
                   <div className="flex justify-between items-end opacity-80">
                      <p className="text-[10px] uppercase tracking-widest font-bold">Authorized User</p>
                      <div className="flex"><div className="w-5 h-5 rounded-full bg-red-500/80 mix-blend-screen"></div><div className="w-5 h-5 rounded-full bg-orange-500/80 mix-blend-screen -ml-2"></div></div>
                   </div>
                 </div>
              </div>
           </div>
           <div className="flex-1 p-8 md:p-16 flex flex-col justify-center relative z-10 order-1 md:order-2">
              <div className="w-16 h-16 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mb-8 backdrop-blur-md">
                <ShieldAlert className="w-8 h-8 text-white opacity-80" />
              </div>
              <h3 className="text-[10px] md:text-xs font-bold uppercase tracking-[0.3em] text-zinc-500 mb-4">Phase 02 — Leverage</h3>
              <h2 className="text-4xl md:text-6xl font-black tracking-tighter leading-[0.9] text-white mb-6">DYNAMIC<br/>CREDIT.</h2>
              <p className="text-lg text-zinc-400 font-light max-w-md">Secure massive multi-million dollar loans to fund hostile takeovers. Your actions dictate your FICO limit.</p>
           </div>
        </motion.div>

        {/* Feature 3 */}
        <motion.div 
           initial={{ opacity: 0, y: 100 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
           className="relative w-full rounded-[40px] border border-white/10 flex flex-col md:flex-row bg-[#0a0a0c] overflow-hidden"
        >
           <div className="absolute top-0 right-0 w-[60vw] h-[60vw] md:w-[40vw] md:h-[40vw] rounded-full blur-[120px] opacity-20 mix-blend-screen bg-gradient-to-br from-rose-500 to-red-900 translate-x-1/3 -translate-y-1/4 pointer-events-none" />
           <div className="flex-1 p-8 md:p-16 flex flex-col justify-center relative z-10">
              <div className="w-16 h-16 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mb-8 backdrop-blur-md">
                <Building2 className="w-8 h-8 text-white opacity-80" />
              </div>
              <h3 className="text-[10px] md:text-xs font-bold uppercase tracking-[0.3em] text-zinc-500 mb-4">Phase 03 — Power</h3>
              <h2 className="text-4xl md:text-6xl font-black tracking-tighter leading-[0.9] text-white mb-6">ENTERPRISE<br/>SCALE.</h2>
              <p className="text-lg text-zinc-400 font-light max-w-md">Pitch to Venture Capitalists, manage employee workload, and build Quantum AI Infrastructure. Dominate your industry.</p>
           </div>
           <div className="flex-1 relative z-10 p-8 md:p-16 flex flex-col gap-4 justify-center">
              <div className="bg-black/60 p-6 md:p-8 rounded-3xl border border-white/10 shadow-2xl backdrop-blur-md">
                 <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4">
                    <span>Workload Capacity</span>
                    <span className="text-red-400 font-mono">98% (Crit)</span>
                 </div>
                 <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className="w-[98%] h-full bg-red-500 rounded-full shadow-[0_0_15px_rgba(239,68,68,0.8)] animate-pulse"></div>
                 </div>
              </div>
              <div className="bg-black/60 p-6 md:p-8 rounded-3xl border border-white/10 shadow-2xl backdrop-blur-md">
                 <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4">
                    <span>Corporate Morale</span>
                    <span className="text-emerald-400 font-mono">92%</span>
                 </div>
                 <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className="w-[92%] h-full bg-emerald-400 rounded-full shadow-[0_0_15px_rgba(52,211,153,0.3)]"></div>
                 </div>
              </div>
           </div>
        </motion.div>

      </section>

      {/* --- MINIMALIST FOOTER --- */}
      <footer className="relative z-40 border-t border-white/10 bg-[#050505] py-12 text-center">
         <PulseNetworkLogo className="w-6 h-6 text-white mx-auto mb-6 opacity-50" />
         <p className="text-[10px] font-bold tracking-widest text-zinc-600 uppercase">Pulse Network Simulator © {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}