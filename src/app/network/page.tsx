"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { TrendingUp, Building2, ShieldAlert, ArrowRight, Briefcase, Globe, MapPin, BarChart3, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

// --- Premium Minimalist Logo ---
const PulseNetworkLogo = ({ className = "w-6 h-6" }: any) => (
  <div className="relative inline-flex items-center justify-center">
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M10 28L14 4H22L28 10V14L22 20H16L14.5 28H10Z" fill="currentColor" />
      <path d="M16 9H20L22 11V13L20 15H15L16 9Z" fill="#ffffff" />
    </svg>
    <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
  </div>
);

export default function NetworkLandingPage() {
  const router = useRouter();
  const [ticker, setTicker] = useState(8430291);
  const [user, setUser] = useState<any>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Listen for logged in state
  useEffect(() => {
    return onAuthStateChanged(auth, setUser);
  }, []);

  // --- SUBDOMAIN DIRECT AUTH ---
  const handleSubdomainAuth = () => {
    setIsAuthenticating(true);
    
    // Redirect to the login page ON THE SUBDOMAIN
    // Middleware has been updated to serve the main login page on /login natively
    const dashboardUrl = `${window.location.origin}/dashboard`;
    window.location.href = `/login?redirect=${encodeURIComponent(dashboardUrl)}`;
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setTicker(prev => prev + Math.floor(Math.random() * 100));
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  // --- Linear Flow Feature Card Component ---
  const FeatureCard = ({ title, subtitle, desc, icon: Icon, color, children }: any) => {
    return (
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-6xl mx-auto rounded-[40px] overflow-hidden border border-white/10 shadow-[0_20px_80px_rgba(0,0,0,0.6)] flex flex-col md:flex-row bg-[#0a0a0c] my-16"
      >
        <div className={`absolute top-0 right-0 w-[80vw] md:w-[40vw] h-[80vw] md:h-[40vw] rounded-full blur-[120px] opacity-30 mix-blend-screen pointer-events-none bg-gradient-to-br ${color} translate-x-1/3 -translate-y-1/4`}></div>

        <div className="flex-1 p-8 md:p-16 flex flex-col justify-center relative z-10 w-full">
          <div className="w-16 h-16 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mb-8 backdrop-blur-md shadow-2xl">
            <Icon className="w-8 h-8 text-white opacity-80" />
          </div>
          <h3 className="text-[10px] md:text-xs font-bold uppercase tracking-[0.3em] text-zinc-500 mb-4">{subtitle}</h3>
          <h2 className="text-4xl md:text-6xl font-black tracking-tighter leading-[0.9] text-white mb-6 pr-4">{title}</h2>
          <p className="text-base md:text-lg text-zinc-400 font-medium leading-relaxed max-w-md">{desc}</p>
        </div>

        <div className="flex-1 relative z-10 p-8 md:p-16 flex items-center justify-center w-full h-full">
          {children}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="bg-[#050505] text-white selection:bg-white/20 font-sans relative w-full overflow-x-hidden">

      {/* --- FLOATING NAVIGATION --- */}
      <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex items-center justify-between px-6 py-3 w-[92%] max-w-5xl rounded-full bg-white/[0.02] backdrop-blur-2xl border border-white/[0.05] shadow-2xl transition-all duration-500 hover:bg-white/[0.05]">
        <div className="flex items-center gap-3 font-bold tracking-tight cursor-default">
          <PulseNetworkLogo className="w-5 h-5" />
          <span className="text-white mt-0.5 text-sm md:text-base">Pulse<span className="text-zinc-500 font-normal">Network</span></span>
        </div>
        <div className="hidden md:flex gap-8 text-[11px] font-bold uppercase tracking-widest text-zinc-500">
          <button className="hover:text-white transition-colors duration-300">Marketplace</button>
          <button className="hover:text-white transition-colors duration-300">Leaderboards</button>
        </div>
        <div className="flex items-center gap-4">
          {user ? (
            <button onClick={() => router.push('/dashboard')} className="text-[10px] font-bold uppercase tracking-widest bg-white text-black px-5 py-2.5 rounded-full transition-transform duration-300 hover:scale-105 shadow-[0_0_20px_rgba(255,255,255,0.2)]">
              Go to Dashboard
            </button>
          ) : (
            <>
              <button onClick={handleSubdomainAuth} disabled={isAuthenticating} className="hidden sm:block text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-white transition-colors duration-300 disabled:opacity-50">
                Log in
              </button>
              <button onClick={handleSubdomainAuth} disabled={isAuthenticating} className="text-[10px] font-bold uppercase tracking-widest bg-white text-black px-5 py-2.5 rounded-full transition-transform duration-300 hover:scale-105 flex items-center gap-2 disabled:opacity-50 disabled:hover:scale-100 shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                {isAuthenticating ? <Loader2 className="w-3 h-3 animate-spin" /> : "Begin"}
              </button>
            </>
          )}
        </div>
      </nav>

      {/* --- CINEMATIC HERO SECTION --- */}
      <section className="min-h-screen w-full flex flex-col items-center justify-center relative pt-32 pb-20">

        {/* Abstract Cinematic Video/Image Background */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none border-b border-white/5">
          <div className="absolute inset-0 bg-black/60 z-10" />
          <motion.img
            initial={{ scale: 1.1 }} animate={{ scale: 1 }} transition={{ duration: 10, ease: "easeOut" }}
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
              <button onClick={() => router.push('/dashboard')} className="group relative inline-flex items-center justify-center gap-4 px-10 py-5 bg-white text-black rounded-full overflow-hidden transition-all duration-700 hover:scale-105 hover:shadow-[0_0_60px_rgba(255,255,255,0.3)]">
                <div className="absolute inset-0 bg-gradient-to-r from-zinc-300 via-white to-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <span className="relative z-10 font-bold text-sm tracking-widest uppercase flex items-center gap-3">
                  Access Dashboard
                  <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center group-hover:translate-x-2 transition-transform duration-500">
                    <ArrowRight className="w-4 h-4 text-white" />
                  </div>
                </span>
              </button>
            ) : (
              <button onClick={handleSubdomainAuth} disabled={isAuthenticating} className="group relative inline-flex items-center justify-center gap-4 px-10 py-5 bg-white text-black rounded-full overflow-hidden transition-all duration-700 hover:scale-105 hover:shadow-[0_0_60px_rgba(255,255,255,0.3)] disabled:opacity-50 disabled:hover:scale-100">
                <div className="absolute inset-0 bg-gradient-to-r from-zinc-300 via-white to-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <span className="relative z-10 font-bold text-sm tracking-widest uppercase flex items-center gap-3">
                  {isAuthenticating ? "Authenticating..." : "Initialize Connection"}
                  {!isAuthenticating && <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center group-hover:translate-x-2 transition-transform duration-500"><ArrowRight className="w-4 h-4 text-white" /></div>}
                </span>
              </button>
            )}
          </motion.div>
        </div>
      </section>

      {/* --- STANDARD NON-OVERLAPPING FLOW --- */}
      <section className="w-full px-4 py-32 flex flex-col z-30 relative">

        {/* Card 1 */}
        <FeatureCard
          color="from-emerald-500 to-teal-900" icon={BarChart3}
          subtitle="Phase 01 — Wealth Management" title={<>LIVE<br />TREASURY.</>}
          desc="Deposit funds into high-yield Citadel algorithms or safe Vanguard index funds. Earn compound passive yield while you sleep."
        >
          <div className="w-full h-full max-h-[300px] md:max-h-[400px] bg-black/40 backdrop-blur-md rounded-3xl border border-white/10 p-8 flex flex-col justify-end shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:24px_24px]"></div>
            <div className="relative z-10 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Total Net Worth</p>
                <p className="text-4xl md:text-5xl font-light font-mono text-white tracking-tight">${ticker.toLocaleString('en-US')}</p>
              </div>
              <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-4 py-2 rounded-full border border-emerald-500/20 w-max">
                <TrendingUp className="w-4 h-4" /> <span className="font-bold font-mono text-sm">+12.4%</span>
              </div>
            </div>
          </div>
        </FeatureCard>

        {/* Card 2 */}
        <FeatureCard
          color="from-indigo-500 to-purple-900" icon={ShieldAlert}
          subtitle="Phase 02 — Leverage" title={<>DYNAMIC<br />CREDIT.</>}
          desc="Secure massive multi-million dollar loans to fund hostile takeovers. Your actions dictate your FICO limit."
        >
          <div className="w-full max-w-[320px] aspect-[1.586/1] rounded-2xl flex flex-col justify-between text-white relative shadow-[0_30px_60px_rgba(0,0,0,0.6)] bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#111827] border border-white/20 p-6 md:p-8 transform rotate-y-[-10deg] rotate-x-[5deg] perspective-[1000px]">
            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 pointer-events-none rounded-2xl opacity-50"></div>
            <div className="flex justify-between items-start relative z-10">
              <h3 className="font-bold text-lg tracking-tight">Pulse Black</h3>
              <svg className="w-8 h-8 opacity-70" viewBox="0 0 40 30" fill="none"><rect width="40" height="30" rx="4" fill="url(#paint0_linear)" /><path d="M10 0V30M30 0V30M0 15H40M15 0V15M25 30V15" stroke="#B8860B" strokeWidth="0.5" strokeOpacity="0.5" /><defs><linearGradient id="paint0_linear" x1="0" y1="0" x2="40" y2="30" gradientUnits="userSpaceOnUse"><stop stopColor="#F9D423" /><stop offset="1" stopColor="#B8860B" /></linearGradient></defs></svg>
            </div>
            <div className="relative z-10 mt-auto">
              <p className="font-mono text-xl font-bold tracking-widest mb-4">740 <span className="text-[10px] text-indigo-300 font-sans uppercase tracking-widest ml-2">FICO Score</span></p>
              <div className="flex justify-between items-end opacity-80">
                <p className="text-[10px] uppercase tracking-widest font-bold">Authorized User</p>
                <div className="flex"><div className="w-5 h-5 rounded-full bg-red-500/80 mix-blend-screen"></div><div className="w-5 h-5 rounded-full bg-orange-500/80 mix-blend-screen -ml-2"></div></div>
              </div>
            </div>
          </div>
        </FeatureCard>

        {/* Card 3 */}
        <FeatureCard
          color="from-rose-500 to-red-900" icon={Building2}
          subtitle="Phase 03 — Power" title={<>ENTERPRISE<br />SCALE.</>}
          desc="Pitch to Venture Capitalists, manage employee workload, and build Quantum AI Infrastructure. Dominate your industry."
        >
          <div className="w-full flex flex-col gap-4">
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
        </FeatureCard>

        {/* Card 4 - WITH SPOTIFY REMOVED */}
        <FeatureCard
          color="from-cyan-500 to-blue-900" icon={Globe}
          subtitle="Phase 04 — Conquest" title={<>GLOBAL<br />PRESENCE.</>}
          desc="Relocate to tax havens, buy luxury real estate, and flex your wealth with dynamic Pulse Profile integrations."
        >
          <div className="w-full h-full max-h-[300px] flex flex-col gap-4 justify-center">
            <div className="flex items-center justify-between p-6 rounded-3xl bg-black/60 border border-white/10 shadow-xl backdrop-blur-md">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10"><MapPin className="w-5 h-5 text-white" /></div>
                <span className="text-lg font-bold text-white">Dubai</span>
              </div>
              <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20 uppercase tracking-widest">0% Tax Haven</span>
            </div>

            <div className="flex items-center justify-between p-6 rounded-3xl bg-black/60 border border-white/10 shadow-xl backdrop-blur-md">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10"><Briefcase className="w-5 h-5 text-white" /></div>
                <span className="text-lg font-bold text-white">Zurich</span>
              </div>
              <span className="text-[10px] font-black text-indigo-400 bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-indigo-500/20 uppercase tracking-widest">2x Vault Yield</span>
            </div>
          </div>
        </FeatureCard>

      </section>

      {/* --- MINIMALIST FOOTER --- */}
      <footer className="relative z-40 border-t border-white/10 bg-[#050505] py-12 text-center">
        <PulseNetworkLogo className="w-6 h-6 mx-auto mb-6 opacity-50" />
        <p className="text-[10px] font-bold tracking-widest text-zinc-600 uppercase">Pulse Network Simulator © {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}