"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Sparkles, Gamepad2, Palette, Share2, Music, Users, Cpu, Flame, ChevronRight, Monitor, Keyboard, Mouse, LayoutDashboard, BadgeCheck, Diamond, Crown } from "lucide-react";
import Image from "next/image";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import AvatarDecoration from "@/components/AvatarDecoration";
import PulseLogo from "@/components/PulseLogo";
import BackgroundShader from "@/components/BackgroundShader"; // Brought the shaders to the landing page!

export default function LandingPageClient() {
  const [username, setUsername] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleClaim = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.length > 2) {
      router.push(`/signup?handle=${username.toLowerCase()}`);
    }
  };

  const exampleProfiles = [
    {
      handle: "sour",
      name: "Sour",
      color: "bg-indigo-600",
      banner: "https://images.unsplash.com/photo-1618336753974-aae8e04506aa?q=80&w=800&auto=format&fit=crop", 
      avatar: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=200&auto=format&fit=crop", 
      badges: ["Level 42", "Pro"],
      games: "142 Games"
    },
    {
      handle: "milky",
      name: "Milky",
      color: "bg-blue-500",
      banner: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=800&auto=format&fit=crop", 
      avatar: "https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?q=80&w=200&auto=format&fit=crop", 
      badges: ["Streamer", "Partner"],
      games: "312 Games"
    },
    {
      handle: "glitch",
      name: "Glitch",
      color: "bg-emerald-500",
      banner: "https://images.unsplash.com/photo-1614624532983-4ce03382d63d?q=80&w=800&auto=format&fit=crop", 
      avatar: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=200&auto=format&fit=crop", 
      badges: ["Dev", "Verified"],
      games: "89 Games"
    },
    {
      handle: "kream",
      name: "Kream",
      color: "bg-pink-500",
      banner: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=800&auto=format&fit=crop", 
      avatar: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=200&auto=format&fit=crop", 
      badges: ["Artist"],
      games: "24 Games"
    }
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white selection:bg-indigo-500/30 font-sans flex flex-col overflow-x-hidden">
      
      {/* --- MAGIC CSS ELEMENTS --- */}
      <style jsx global>{`
        @keyframes scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .animate-scroll { animation: scroll 40s linear infinite; }
        .animate-scroll:hover { animation-play-state: paused; }
        
        @keyframes shimmer { 0% { background-position: 200% center; } 100% { background-position: -200% center; } }
        .animate-shimmer { background-size: 200% auto; animation: shimmer 4s linear infinite; }

        @keyframes spin-slow { 100% { transform: rotate(360deg); } }
        .animate-spin-slow { animation: spin-slow 4s linear infinite; }

        @keyframes word-slide {
          0%, 20% { transform: translateY(0%); }
          25%, 45% { transform: translateY(-25%); }
          50%, 70% { transform: translateY(-50%); }
          75%, 95% { transform: translateY(-75%); }
          100% { transform: translateY(0%); }
        }
        .animate-word-slide { animation: word-slide 8s cubic-bezier(0.87, 0, 0.13, 1) infinite; }

        .bg-dot-pattern {
          background-image: radial-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px);
          background-size: 24px 24px;
        }

        /* Float animation for the mockup */
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
          100% { transform: translateY(0px); }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
      `}</style>

      {/* --- BACKGROUND AMBIENCE (AURORA + DOTS) --- */}
      <div className="fixed inset-0 z-0 pointer-events-none">
         <BackgroundShader type="aurora" />
         <div className="absolute inset-0 bg-dot-pattern opacity-40" style={{ maskImage: 'radial-gradient(ellipse at center, black 20%, transparent 80%)', WebkitMaskImage: 'radial-gradient(ellipse at center, black 20%, transparent 80%)' }}></div>
         <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a0a0c]/80 to-[#0a0a0c]"></div>
      </div>

      {/* --- NAVBAR --- */}
      <nav className="w-full max-w-7xl mx-auto px-6 py-6 flex justify-between items-center z-50 relative">
        <div className="text-xl font-bold tracking-tighter flex items-center gap-2 group hover:opacity-80 transition cursor-pointer drop-shadow-md">
           <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.4)]">
              <PulseLogo className="w-4 h-4 text-white" />
           </div>
          <span className="text-white">Pulse</span>
        </div>
        
        <div className={`flex gap-4 items-center transition-opacity duration-300 ${authLoading ? 'opacity-0' : 'opacity-100'}`}>
          {currentUser ? (
            <Link href="/dashboard" className="text-sm font-bold bg-white text-black px-5 py-2.5 rounded-full hover:bg-zinc-200 hover:scale-105 transition shadow-[0_0_20px_rgba(255,255,255,0.1)] flex items-center gap-2">
              <LayoutDashboard className="w-4 h-4" /> Dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium text-zinc-400 hover:text-white transition">
                Login
              </Link>
              <Link href="/signup" className="relative group text-sm font-bold bg-white text-black px-5 py-2.5 rounded-full hover:scale-105 transition">
                <span className="absolute inset-0 bg-white rounded-full blur-[10px] opacity-20 group-hover:opacity-50 transition"></span>
                <span className="relative z-10">Sign Up</span>
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 flex flex-col items-center z-10 relative pt-12 md:pt-20">
        
        {/* HERO SECTION */}
        <div className="text-center px-4 max-w-5xl mx-auto mb-32 relative">
          
          {/* Animated Pill Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 text-xs font-bold mb-8 shadow-2xl relative overflow-hidden group hover:border-white/20 transition">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-indigo-500/20 to-indigo-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-zinc-300 relative z-10"><span className="text-white">Pulse Premium</span> is now available.</span>
          </div>

          {/* FLIP WORD HEADLINE */}
          <h1 className="text-5xl sm:text-7xl md:text-[5.5rem] font-black tracking-tight mb-8 leading-[1.1] drop-shadow-2xl">
            The Ultimate Identity <br />
            <div className="h-[1.2em] overflow-hidden block w-full mt-2">
               <div className="animate-word-slide flex flex-col items-center">
                  <span className="h-[1.2em] flex items-center justify-center gap-3 md:gap-4 w-full">
                     <span className="text-white">For</span>
                     <span className="animate-shimmer text-transparent bg-clip-text bg-[linear-gradient(110deg,#a855f7,45%,#fff,55%,#3b82f6)] drop-shadow-sm">Gamers.</span>
                  </span>
                  <span className="h-[1.2em] flex items-center justify-center gap-3 md:gap-4 w-full">
                     <span className="text-white">For</span>
                     <span className="animate-shimmer text-transparent bg-clip-text bg-[linear-gradient(110deg,#a855f7,45%,#fff,55%,#3b82f6)] drop-shadow-sm">Streamers.</span>
                  </span>
                  <span className="h-[1.2em] flex items-center justify-center gap-3 md:gap-4 w-full">
                     <span className="text-white">For</span>
                     <span className="animate-shimmer text-transparent bg-clip-text bg-[linear-gradient(110deg,#a855f7,45%,#fff,55%,#3b82f6)] drop-shadow-sm">Esports.</span>
                  </span>
                  <span className="h-[1.2em] flex items-center justify-center gap-3 md:gap-4 w-full">
                     <span className="text-white">For</span>
                     <span className="animate-shimmer text-transparent bg-clip-text bg-[linear-gradient(110deg,#a855f7,45%,#fff,55%,#3b82f6)] drop-shadow-sm">Creators.</span>
                  </span>
               </div>
            </div>
          </h1>
          
          <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-12 leading-relaxed">
            Aggregate your Steam library, showcase your hardware, sync your live music, and build your gaming legacy in one stunning, WebGL-powered link.
          </p>

          {/* MAGIC INPUT (Glassmorphism) */}
          <div className={`w-full max-w-lg mx-auto transition-opacity duration-500 relative z-20 ${authLoading ? 'opacity-0' : 'opacity-100'}`}>
            {currentUser ? (
              <div className="relative p-[1px] overflow-hidden rounded-2xl group hover:scale-[1.02] transition-transform duration-300 shadow-2xl shadow-indigo-500/20 cursor-pointer" onClick={() => router.push('/dashboard')}>
                 <span className="absolute inset-[-1000%] animate-spin-slow bg-[conic-gradient(from_90deg_at_50%_50%,#0a0a0c_0%,#4f46e5_50%,#0a0a0c_100%)] opacity-50 group-hover:opacity-100 transition duration-500" />
                 <div className="relative bg-black/60 backdrop-blur-xl rounded-2xl flex items-center justify-center p-4 text-white font-bold gap-3 z-10 h-full w-full border border-white/10">
                    Go to your Dashboard <ArrowRight className="w-5 h-5 text-indigo-400 group-hover:translate-x-1 transition-transform" />
                 </div>
              </div>
            ) : (
              <form onSubmit={handleClaim} className="relative p-[1px] overflow-hidden rounded-2xl group shadow-[0_0_40px_rgba(168,85,247,0.15)]">
                <span className="absolute inset-[-1000%] animate-spin-slow bg-[conic-gradient(from_90deg_at_50%_50%,#0a0a0c_0%,#a855f7_50%,#0a0a0c_100%)] opacity-20 group-hover:opacity-100 transition duration-500" />
                <div className="relative bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center p-2 pl-5 z-10 w-full">
                  <span className="text-white font-bold text-lg select-none hidden sm:block">pulsegg.in/</span>
                  <span className="text-white font-bold text-lg select-none sm:hidden">/</span>
                  <input 
                    type="text" 
                    placeholder="username"
                    className="flex-1 bg-transparent border-none outline-none text-indigo-400 placeholder-zinc-600 font-bold text-lg p-2 w-full min-w-0"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9-_]/g, ''))} 
                  />
                  <button 
                    type="submit"
                    disabled={username.length < 3}
                    className="bg-white text-black px-6 py-4 rounded-xl font-bold hover:bg-zinc-200 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                  >
                    Claim <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* --- SPOTLIGHT BENTO BOX GRID --- */}
        <div className="max-w-6xl mx-auto px-6 w-full mb-32 relative z-20">
           <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-black mb-4 tracking-tight">Everything in one place.</h2>
              <p className="text-zinc-400 text-lg">Powerful, auto-syncing widgets designed to show off who you are.</p>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[280px]">
              
              {/* Box 1: Music Sync */}
              <div className="md:col-span-2 bg-black/40 backdrop-blur-xl border border-white/10 rounded-[32px] overflow-hidden relative group p-8 flex flex-col justify-between shadow-2xl transition duration-500">
                 <div className="absolute inset-0 bg-gradient-to-br from-[#1DB954]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                 
                 <div className="relative z-10">
                    <div className="w-12 h-12 bg-[#1DB954]/10 rounded-2xl flex items-center justify-center text-[#1DB954] mb-6 shadow-[0_0_15px_rgba(29,185,84,0.2)]">
                       <Music className="w-6 h-6" />
                    </div>
                    <h3 className="text-2xl font-black mb-2">Live Music Sync</h3>
                    <p className="text-zinc-400 text-sm max-w-sm">Connect Spotify to display exactly what you are listening to in real-time, completely automatically.</p>
                 </div>
                 
                 {/* TRUE TO APP: Spotify Pill Mockup */}
                 <div className="relative z-10 bg-black/60 border border-[#1DB954]/30 rounded-2xl p-3 flex items-center gap-3 w-full max-w-md transform group-hover:translate-x-2 transition duration-500 shadow-lg">
                    <div className="absolute inset-0 bg-gradient-to-r from-[#1DB954]/5 to-transparent opacity-100 rounded-2xl pointer-events-none"></div>
                    <div className="w-12 h-12 bg-zinc-800 rounded-xl overflow-hidden shrink-0 shadow-lg relative border border-white/5">
                       <Image src="https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=200&auto=format&fit=crop" alt="Album" fill className="object-cover" unoptimized />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                       <p className="text-[10px] text-[#1DB954] font-bold uppercase tracking-wider mb-0.5 flex items-center gap-1.5"><Music className="w-3 h-3"/> Listening on Spotify</p>
                       <p className="text-sm font-bold truncate text-white leading-tight">STARWALK</p>
                       <p className="text-xs text-zinc-400 truncate mt-0.5">Odetari</p>
                    </div>
                    <div className="flex items-end gap-1 h-4 px-2 shrink-0">
                       <span className="w-1 bg-[#1DB954] rounded-full animate-pulse h-full"></span>
                       <span className="w-1 bg-[#1DB954] rounded-full animate-pulse h-2/3" style={{ animationDelay: '200ms' }}></span>
                       <span className="w-1 bg-[#1DB954] rounded-full animate-pulse h-4/5" style={{ animationDelay: '400ms' }}></span>
                    </div>
                 </div>
              </div>

              {/* Box 2: Communities */}
              <div className="md:col-span-1 bg-black/40 backdrop-blur-xl border border-white/10 rounded-[32px] overflow-hidden relative group p-8 flex flex-col justify-between shadow-2xl transition duration-500">
                 <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                 
                 <div className="relative z-10 text-center flex flex-col items-center">
                    <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 mb-6 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                       <Users className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-black mb-2">Squad Up</h3>
                    <p className="text-zinc-400 text-sm">Create a shared hub for your clan, esports team, or friend group.</p>
                 </div>
                 
                 {/* TRUE TO APP: Community Pill Mockup */}
                 <div className="relative z-10 flex justify-center mt-6 group-hover:-translate-y-2 transition duration-500">
                     <div className="inline-flex items-center gap-3 px-4 py-2.5 bg-black/60 border border-white/10 rounded-2xl shadow-inner">
                         <div className="w-8 h-8 rounded-xl bg-zinc-800 overflow-hidden flex items-center justify-center shrink-0 border border-white/10">
                            <Image src="https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=100&auto=format&fit=crop" width={32} height={32} alt="Logo" className="w-full h-full object-cover" unoptimized/>
                         </div>
                         <div className="text-left flex flex-col justify-center leading-none">
                             <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Squad</span>
                             <span className="text-sm font-bold text-white">SOUR GANG</span>
                         </div>
                     </div>
                 </div>
              </div>

              {/* Box 3: Hardware (Flickering Grid) */}
              <div className="md:col-span-1 bg-black/40 backdrop-blur-xl border border-white/10 rounded-[32px] overflow-hidden relative group p-8 flex flex-col justify-between shadow-2xl transition duration-500">
                 {/* Flickering Grid Background */}
                 <div className="absolute inset-0 bg-dot-pattern animate-flicker pointer-events-none opacity-50"></div>
                 <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>

                 <div className="relative z-10">
                    <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-white mb-6 backdrop-blur-md border border-white/10">
                       <Cpu className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-black mb-2">Flex Your Rig</h3>
                    <p className="text-zinc-400 text-sm">Show off your exact PC specs and gaming peripherals.</p>
                 </div>
                 
                 <div className="relative z-10 space-y-2 mt-4 opacity-80 group-hover:opacity-100 transition">
                    <div className="bg-black/60 border border-white/10 rounded-xl p-3 flex items-center gap-3">
                       <Monitor className="w-4 h-4 text-zinc-400 shrink-0" />
                       <div className="min-w-0 flex-1"><p className="text-[9px] text-zinc-500 font-bold uppercase leading-none mb-1">Monitor</p><p className="text-xs font-bold text-zinc-200 truncate">AW3423DW OLED</p></div>
                    </div>
                 </div>
              </div>

              {/* Box 4: Aesthetics (Border Beam + Actual Mockups) */}
              <div className="md:col-span-2 bg-black/40 backdrop-blur-xl border border-white/10 rounded-[32px] overflow-hidden relative group p-8 flex flex-col sm:flex-row items-center justify-between gap-8 shadow-2xl transition duration-500">
                 
                 {/* Border Beam Animation */}
                 <span className="absolute inset-[-1000%] animate-spin-slow bg-[conic-gradient(from_0deg,transparent_0_300deg,#ec4899_360deg)] opacity-0 group-hover:opacity-30 transition duration-500 pointer-events-none" />
                 <div className="absolute inset-[1px] bg-black/60 backdrop-blur-xl rounded-[31px]"></div> {/* Inner Mask for Border Beam */}
                 
                 <div className="absolute inset-0 bg-gradient-to-l from-pink-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                 
                 <div className="relative z-10 flex-1">
                    <div className="w-12 h-12 bg-pink-500/10 rounded-2xl flex items-center justify-center text-pink-400 mb-6 shadow-[0_0_15px_rgba(236,72,153,0.2)]">
                       <Palette className="w-6 h-6" />
                    </div>
                    <h3 className="text-2xl font-black mb-2">God-Tier Aesthetics</h3>
                    <p className="text-zinc-400 text-sm max-w-sm mb-6">Stand out with WebGL liquid shaders, synced Discord Nitro frames, glowing auras, and premium custom badges.</p>
                    
                    {/* TRUE TO APP: Premium Badge Pill Mockup */}
                    <div className="flex items-center gap-3.5 bg-black/60 border border-white/10 px-4 py-2 rounded-full shadow-inner backdrop-blur-md w-max group-hover:border-white/20 transition">
                        <div className="flex items-center justify-center drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]">
                           <BadgeCheck className="w-4 h-4 text-white fill-white/20" />
                        </div>
                        <div className="flex items-center justify-center drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]">
                           <Diamond className="w-4 h-4 text-white fill-white/20" />
                        </div>
                        <div className="flex items-center justify-center drop-shadow-[0_0_8px_rgba(250,204,21,0.4)]">
                           <Crown className="w-4 h-4 text-yellow-400 fill-yellow-400/20" />
                        </div>
                    </div>
                 </div>

                 {/* TRUE TO APP: AvatarDecoration Mockup */}
                 <div className="relative z-10 shrink-0 w-36 h-36 flex items-center justify-center mt-6 sm:mt-0 group-hover:scale-105 transition duration-500 animate-float">
                    {/* Glowing Aura matching the primary color (indigo) */}
                    <div className="absolute inset-0 rounded-full blur-xl opacity-60 bg-indigo-500 animate-pulse pointer-events-none"></div>
                    
                    <AvatarDecoration type="electric_god">
                       <div className="w-32 h-32 rounded-full bg-[#121214] relative z-10 shadow-[0_0_30px_rgba(168,85,247,0.3)] border border-white/10">
                          <div className="relative w-[calc(100%-8px)] h-[calc(100%-8px)] top-1 left-1">
                             <Image src="https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=200&auto=format&fit=crop" alt="Avatar" fill className="rounded-full object-cover bg-zinc-900 relative z-10" unoptimized />
                          </div>
                       </div>
                    </AvatarDecoration>
                 </div>
              </div>

           </div>
        </div>

        {/* --- INFINITE CAROUSEL WITH MASKS --- */}
        <div className="w-full overflow-hidden mb-24 border-y border-white/5 bg-black/40 backdrop-blur-xl py-16 relative" style={{ maskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)', WebkitMaskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)' }}>
           
           <div className="text-center mb-10 relative z-30">
              <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest">Join thousands of gamers</p>
           </div>

           <div className="flex w-max animate-scroll gap-6 px-4">
              {[...exampleProfiles, ...exampleProfiles, ...exampleProfiles].map((profile, i) => (
                <div key={i} className="w-[280px] h-[360px] bg-black/60 backdrop-blur-md rounded-3xl border border-white/10 overflow-hidden flex-shrink-0 relative group hover:border-white/30 transition-all hover:-translate-y-2 shadow-2xl">
                   {/* Banner */}
                   <div className="h-32 relative">
                      <Image src={profile.banner} alt="Banner" fill className="object-cover group-hover:scale-110 transition duration-700" unoptimized />
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/80"></div>
                   </div>
                   {/* Content */}
                   <div className="p-6 relative -mt-12 flex flex-col h-full">
                      <div className="w-20 h-20 rounded-2xl p-1 bg-[#121214] border border-white/10 mb-3 shadow-xl relative z-10">
                         <Image src={profile.avatar} alt="PFP" width={80} height={80} className="rounded-xl object-cover w-full h-full bg-zinc-900" unoptimized />
                      </div>
                      <h3 className="text-2xl font-black text-white">{profile.name}</h3>
                      <p className="text-zinc-500 text-sm mb-4 font-mono">@{profile.handle}</p>
                      
                      <div className="flex flex-wrap gap-2 mb-6">
                         {profile.badges.map(b => (
                           <span key={b} className={`text-[10px] font-bold px-2 py-1 rounded-md text-white bg-white/10 border border-white/10`}>
                             {b}
                           </span>
                         ))}
                      </div>

                      <div className="mt-auto bg-black/40 p-3 rounded-xl border border-white/5 flex items-center gap-3 group-hover:bg-white/10 transition">
                         <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${profile.color} text-white`}>
                           <Gamepad2 className="w-4 h-4" />
                         </div>
                         <div>
                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Library</p>
                            <p className="text-sm font-bold text-white">{profile.games}</p>
                         </div>
                      </div>
                   </div>
                </div>
              ))}
           </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="w-full border-t border-white/5 bg-[#0a0a0c] py-12 z-10 relative">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 font-bold text-lg tracking-tighter opacity-80">
             <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.4)]">
               <PulseLogo className="w-4 h-4 text-white" />
             </div>Pulse
          </div>
          
          <div className="flex gap-6 text-sm text-zinc-500 font-medium">
             <Link href="/terms" className="hover:text-white transition">Terms & Privacy</Link>
          </div>

          <div className="text-zinc-600 text-xs font-medium">
            &copy; {new Date().getFullYear()} Pulse. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}