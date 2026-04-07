"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TrendingUp, Building2, ShieldAlert, ArrowRight, Briefcase, Globe, MapPin, Loader2 } from 'lucide-react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '@/lib/firebase';

// --- Pulse Network Custom Logo ---
const PulseNetworkLogo = ({ className = "w-6 h-6" }) => (
  <div className="relative inline-flex items-center justify-center">
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M10 28L14 4H22L28 10V14L22 20H16L14.5 28H10Z" fill="currentColor" />
      <path d="M16 9H20L22 11V13L20 15H15L16 9Z" fill="#000000" />
    </svg>
    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-[1.5px] border-black animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]"></span>
  </div>
);

// --- Reusable 21st.dev Style Ripple Button ---
const EnterNetworkButton = () => {
  const router = useRouter();
  const [coords, setCoords] = useState({ x: -1, y: -1 });
  const [isRippling, setIsRippling] = useState(false);

  useEffect(() => {
    if (coords.x !== -1 && coords.y !== -1) {
      setIsRippling(true);
      setTimeout(() => setIsRippling(false), 500);
    } else {
      setIsRippling(false);
    }
  }, [coords]);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setCoords({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    
    // Slight delay to let the ripple animation play before navigating
    setTimeout(() => {
      router.push("/dashboard");
    }, 400);
  };

  return (
    <button
      onClick={handleClick}
      className="relative overflow-hidden group bg-white text-black font-bold py-4 px-8 rounded-full flex items-center gap-3 hover:scale-105 transition-all duration-300 shadow-[0_0_40px_rgba(255,255,255,0.3)] w-max cursor-pointer"
    >
      <span className="relative z-10 flex items-center gap-2">
        Initialize Connection <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </span>
      {isRippling && (
        <span
          className="absolute bg-black/10 rounded-full animate-ping pointer-events-none"
          style={{
            left: coords.x,
            top: coords.y,
            width: 20,
            height: 20,
            transform: 'translate(-50%, -50%)',
          }}
        />
      )}
    </button>
  );
};

// --- Main Landing Page ---
export default function NetworkLandingPage() {
  const router = useRouter();
  const [ticker, setTicker] = useState(8430291);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Fake money ticker for the background vibe
  useEffect(() => {
    const interval = setInterval(() => {
      setTicker(prev => prev + Math.floor(Math.random() * 100));
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  // Secure Subdomain Google Authentication
  const handleSubdomainAuth = async () => {
    setIsAuthenticating(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      
      // The token is now safely stored in network.localhost LocalStorage!
      // Route them directly to the game dashboard.
      router.push("/dashboard");
    } catch (error) {
      console.error("Authentication failed:", error);
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-indigo-500/30 font-sans overflow-hidden relative">
      
      {/* --- Lively CSS Animations --- */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes grid-pan {
          0% { background-position: 0 0; }
          100% { background-position: 0 24px; }
        }
        .animate-grid-pan {
          animation: grid-pan 3s linear infinite;
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .animate-float-slow {
          animation: float-slow 6s ease-in-out infinite;
        }
        @keyframes drift {
          0% { transform: rotate(0deg) translateX(20px) rotate(0deg); }
          100% { transform: rotate(360deg) translateX(20px) rotate(-360deg); }
        }
        .animate-drift {
          animation: drift 15s linear infinite;
        }
      `}} />

      {/* --- Background Effects --- */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:24px_24px] animate-grid-pan [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none"></div>
      
      <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none animate-drift"></div>
      <div className="absolute top-[20%] right-[-10%] w-[500px] h-[500px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none animate-drift" style={{ animationDirection: 'reverse', animationDuration: '20s' }}></div>

      {/* --- Navigation --- */}
      <nav className="relative z-50 flex items-center justify-between p-6 max-w-6xl mx-auto backdrop-blur-sm border-b border-white/5 md:border-none md:backdrop-blur-none">
        <div className="flex items-center gap-3 text-xl font-bold tracking-tighter cursor-default">
          <PulseNetworkLogo className="w-6 h-6 text-white" />
          <div className="leading-none mt-1">
            Pulse<span className="text-white/50">Network</span>
          </div>
        </div>
        <div className="hidden md:flex gap-8 text-sm font-medium text-white/60">
          <button className="hover:text-white transition-colors cursor-pointer">Marketplace</button>
          <button className="hover:text-white transition-colors cursor-pointer">Leaderboards</button>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={handleSubdomainAuth} 
            disabled={isAuthenticating}
            className="hidden sm:flex items-center gap-2 text-sm font-medium text-white/60 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
          >
            Sign In
          </button>
          <button 
            onClick={handleSubdomainAuth} 
            disabled={isAuthenticating}
            className="text-sm font-bold bg-white text-black px-5 py-2.5 rounded-full hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:hover:scale-100"
          >
            {isAuthenticating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign Up"}
          </button>
        </div>
      </nav>

      {/* --- Hero Section --- */}
      <main className="relative z-10 max-w-6xl mx-auto px-6 pt-24 pb-32">
        <div className="max-w-3xl animate-in fade-in slide-in-from-bottom-8 duration-700">
          <h1 className="text-6xl md:text-[5.5rem] font-black tracking-tighter leading-[1.05] mb-6 drop-shadow-2xl">
            Wall Street, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-400 via-white to-zinc-500">
              Gamified.
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-zinc-400 mb-10 max-w-xl leading-relaxed font-medium">
            The ultimate economic simulator connected directly to your Pulse profile. Build your net worth, manage startups, and climb the global leaderboards.
          </p>

          <EnterNetworkButton />
        </div>

        {/* --- Bento Grid Features --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-32 relative">
          
          <div className="col-span-1 md:col-span-2 relative group rounded-[32px] bg-[#121214]/60 backdrop-blur-xl border border-white/10 p-8 hover:bg-[#18181b]/80 transition-all duration-500 overflow-hidden shadow-2xl animate-float-slow hover:-translate-y-2">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-30 group-hover:scale-110 transition-all duration-500">
              <TrendingUp className="w-40 h-40 text-emerald-400" />
            </div>
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 mb-6 shadow-inner group-hover:bg-emerald-500/20 group-hover:text-emerald-400 group-hover:border-emerald-500/30 transition-colors">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-black mb-2">The Central Bank</h3>
              <p className="text-zinc-400 max-w-sm mb-8 font-medium">Secure your funds, earn compound interest, and watch your net worth grow in real-time.</p>
              
              <div className="font-mono text-4xl md:text-5xl font-black tracking-tight text-white drop-shadow-md">
                ${ticker.toLocaleString('en-US')}
                <span className="text-sm text-emerald-400 ml-3 animate-pulse inline-flex items-center">▲ +12.4%</span>
              </div>
            </div>
          </div>

          <div className="col-span-1 rounded-[32px] bg-[#121214]/60 backdrop-blur-xl border border-white/10 p-8 hover:bg-[#18181b]/80 transition-all duration-500 flex flex-col justify-between shadow-2xl animate-float-slow hover:-translate-y-2" style={{ animationDelay: '1s' }}>
            <div>
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 mb-6 shadow-inner group-hover:bg-indigo-500/20 group-hover:text-indigo-400 group-hover:border-indigo-500/30 transition-colors">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black mb-2">Credit System</h3>
              <p className="text-zinc-400 text-sm font-medium">Your actions dictate your FICO score. Higher scores unlock luxury assets and better loans.</p>
            </div>
            
            <div className="mt-8 bg-black/40 p-4 rounded-2xl border border-white/5">
              <div className="flex justify-between text-xs mb-2 font-bold uppercase tracking-widest text-zinc-500">
                <span>Score</span>
                <span className="text-indigo-400">740 (Excellent)</span>
              </div>
              <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                <div className="w-[74%] h-full bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.8)]"></div>
              </div>
            </div>
          </div>

          <div className="col-span-1 md:col-span-2 relative group rounded-[32px] bg-[#121214]/60 backdrop-blur-xl border border-white/10 p-8 hover:bg-[#18181b]/80 transition-all duration-500 overflow-hidden shadow-2xl animate-float-slow hover:-translate-y-2" style={{ animationDelay: '1.5s' }}>
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all duration-500">
              <Briefcase className="w-40 h-40 text-orange-400" />
            </div>
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 mb-6 shadow-inner group-hover:bg-orange-500/20 group-hover:text-orange-400 group-hover:border-orange-500/30 transition-colors">
                <Briefcase className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-black mb-2">Startup Tycoon</h3>
              <p className="text-zinc-400 max-w-sm mb-8 font-medium">Take high-risk loans to build your business. Balance employee payroll, manage workloads, and prevent strikes to scale globally.</p>

              <div className="flex flex-col sm:flex-row gap-4 max-w-lg">
                <div className="flex-1 bg-black/40 p-4 rounded-2xl border border-white/5">
                  <div className="flex justify-between text-[10px] mb-2 font-bold uppercase tracking-widest text-zinc-500">
                    <span>Morale</span>
                    <span className="text-emerald-400">92%</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="w-[92%] h-full bg-emerald-400 rounded-full"></div>
                  </div>
                </div>
                <div className="flex-1 bg-red-500/10 p-4 rounded-2xl border border-red-500/20">
                  <div className="flex justify-between text-[10px] mb-2 font-bold uppercase tracking-widest text-red-400">
                    <span>Workload</span>
                    <span>98% (Crit)</span>
                  </div>
                  <div className="w-full h-1.5 bg-red-500/20 rounded-full overflow-hidden">
                    <div className="w-[98%] h-full bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-span-1 rounded-[32px] bg-[#121214]/60 backdrop-blur-xl border border-white/10 p-8 hover:bg-[#18181b]/80 transition-all duration-500 flex flex-col justify-between overflow-hidden relative group shadow-2xl animate-float-slow hover:-translate-y-2" style={{ animationDelay: '0.5s' }}>
            <div className="absolute -bottom-10 -right-10 opacity-10 group-hover:opacity-30 group-hover:rotate-12 transition-all duration-700">
               <Globe className="w-48 h-48 text-cyan-400" />
            </div>
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 mb-6 shadow-inner group-hover:bg-cyan-500/20 group-hover:text-cyan-400 group-hover:border-cyan-500/30 transition-colors">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black mb-2">Global Real Estate</h3>
              <p className="text-zinc-400 text-sm mb-6 font-medium">Migrate across cities to optimize your taxes and living costs. Buy luxury penthouses.</p>

              <div className="space-y-3">
                 <div className="flex items-center justify-between p-3 rounded-xl bg-black/60 border border-white/5 shadow-inner">
                    <span className="text-xs font-bold text-white">Dubai (Tax Haven)</span>
                    <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded uppercase tracking-widest">0% Tax</span>
                 </div>
                 <div className="flex items-center justify-between p-3 rounded-xl bg-black/60 border border-white/5 shadow-inner">
                    <span className="text-xs font-bold text-white">Zurich (The Vault)</span>
                    <span className="text-[10px] font-black text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded uppercase tracking-widest">2x Int</span>
                 </div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}