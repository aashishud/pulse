"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Sparkles, Gamepad2, Palette, Share2, Music, Users, Cpu, Flame, ChevronRight, Monitor, Keyboard, Mouse, LayoutDashboard } from "lucide-react";
import Image from "next/image";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import AvatarDecoration from "@/components/AvatarDecoration";
import PulseLogo from "@/components/PulseLogo";

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

  // Replaced human faces with Abstract 3D/Neon Gamer Avatars
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
      
      {/* --- 21st.dev Magic CSS Elements --- */}
      <style jsx global>{`
        /* Infinite Scroll */
        @keyframes scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .animate-scroll { animation: scroll 40s linear infinite; }
        .animate-scroll:hover { animation-play-state: paused; }
        
        /* Shimmer Text */
        @keyframes shimmer { 0% { background-position: 200% center; } 100% { background-position: -200% center; } }
        .animate-shimmer { background-size: 200% auto; animation: shimmer 4s linear infinite; }

        /* Magic Button Conic Spin */
        @keyframes spin-slow { 100% { transform: rotate(360deg); } }
        .animate-spin-slow { animation: spin-slow 4s linear infinite; }

        /* Word Flip Animation */
        @keyframes word-slide {
          0%, 20% { transform: translateY(0%); }
          25%, 45% { transform: translateY(-25%); }
          50%, 70% { transform: translateY(-50%); }
          75%, 95% { transform: translateY(-75%); }
          100% { transform: translateY(0%); }
        }
        .animate-word-slide { animation: word-slide 8s cubic-bezier(0.87, 0, 0.13, 1) infinite; }

        /* Falling Meteors */
        @keyframes meteor {
          0% { transform: rotate(215deg) translateX(0); opacity: 1; }
          70% { opacity: 1; }
          100% { transform: rotate(215deg) translateX(-1000px); opacity: 0; }
        }
        .meteor-trail { animation: meteor linear infinite; }

        /* Flickering Grid */
        @keyframes flicker {
          0%, 100% { opacity: 0.1; }
          50% { opacity: 0.3; }
        }
        .animate-flicker { animation: flicker 3s ease-in-out infinite; }

        /* Radial Dot Matrix */
        .bg-dot-pattern {
          background-image: radial-gradient(rgba(255, 255, 255, 0.15) 1px, transparent 1px);
          background-size: 24px 24px;
        }
      `}</style>

      {/* --- BACKGROUND AMBIENCE --- */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-[#0a0a0c]">
         {/* Dot Matrix with Radial Fade Mask */}
         <div className="absolute inset-0 bg-dot-pattern opacity-50" style={{ maskImage: 'radial-gradient(ellipse at center, black 20%, transparent 80%)', WebkitMaskImage: 'radial-gradient(ellipse at center, black 20%, transparent 80%)' }}></div>
         
         {/* Falling Meteors (Pure CSS) */}
         <div className="absolute top-[-20%] left-[20%] w-[2px] h-[150px] bg-gradient-to-b from-indigo-500 to-transparent rounded-full meteor-trail opacity-0 blur-[1px]" style={{ animationDuration: '4s', animationDelay: '1s' }}></div>
         <div className="absolute top-[-20%] left-[60%] w-[2px] h-[100px] bg-gradient-to-b from-purple-500 to-transparent rounded-full meteor-trail opacity-0 blur-[1px]" style={{ animationDuration: '6s', animationDelay: '3s' }}></div>
         <div className="absolute top-[-20%] left-[80%] w-[2px] h-[200px] bg-gradient-to-b from-pink-500 to-transparent rounded-full meteor-trail opacity-0 blur-[2px]" style={{ animationDuration: '5s', animationDelay: '0s' }}></div>

         {/* Glowing Orbs */}
         <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-indigo-600/10 blur-[150px] rounded-full mix-blend-screen"></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 blur-[120px] rounded-full mix-blend-screen"></div>
      </div>

      {/* --- NAVBAR --- */}
      <nav className="w-full max-w-7xl mx-auto px-6 py-6 flex justify-between items-center z-50 relative">
        <div className="text-xl font-bold tracking-tighter flex items-center gap-2 group hover:opacity-80 transition cursor-pointer">
<div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.4)]">
   <PulseLogo className="w-4 h-4 text-white" />
</div>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">Pulse</span>
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
        <div className="text-center px-4 max-w-4xl mx-auto mb-24">
          
          {/* Animated Pill Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#121214]/80 backdrop-blur-md border border-white/10 text-xs font-bold mb-8 shadow-2xl relative overflow-hidden group hover:border-white/20 transition">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/20 to-emerald-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
            <span className="relative flex h-2 w-2 mr-1">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-zinc-300 relative z-10"><span className="text-emerald-400">Live:</span> Communities & Music Sync</span>
          </div>

          {/* FLIP WORD HEADLINE (Perfectly Centered Fix) */}
          <h1 className="text-5xl sm:text-7xl md:text-[5.5rem] font-black tracking-tight mb-8 leading-[1.1]">
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
            Aggregate your Steam library, showcase your hardware, sync your live music, and build your gaming legacy in one stunning link.
          </p>

          {/* MAGIC BUTTON INPUT (Conic Gradient Border) */}
          <div className={`w-full max-w-lg mx-auto transition-opacity duration-500 ${authLoading ? 'opacity-0' : 'opacity-100'}`}>
            {currentUser ? (
              <div className="relative p-[1px] overflow-hidden rounded-2xl group hover:scale-[1.02] transition-transform duration-300 shadow-2xl shadow-indigo-500/20 cursor-pointer" onClick={() => router.push('/dashboard')}>
                 <span className="absolute inset-[-1000%] animate-spin-slow bg-[conic-gradient(from_90deg_at_50%_50%,#0a0a0c_0%,#4f46e5_50%,#0a0a0c_100%)] opacity-50 group-hover:opacity-100 transition duration-500" />
                 <div className="relative bg-[#0a0a0c] rounded-2xl flex items-center justify-center p-4 text-white font-bold gap-3 z-10 h-full w-full">
                    Go to your Dashboard <ArrowRight className="w-5 h-5 text-indigo-400 group-hover:translate-x-1 transition-transform" />
                 </div>
              </div>
            ) : (
              <form onSubmit={handleClaim} className="relative p-[1px] overflow-hidden rounded-2xl group shadow-2xl shadow-purple-500/10">
                <span className="absolute inset-[-1000%] animate-spin-slow bg-[conic-gradient(from_90deg_at_50%_50%,#0a0a0c_0%,#a855f7_50%,#0a0a0c_100%)] opacity-0 group-hover:opacity-100 transition duration-500" />
                <div className="relative bg-[#0a0a0c] rounded-2xl flex items-center p-2 pl-5 z-10 w-full">
                  <span className="text-zinc-500 font-mono text-lg select-none hidden sm:block">pulsegg.in/</span>
                  <span className="text-zinc-500 font-mono text-lg select-none sm:hidden">/</span>
                  <input 
                    type="text" 
                    placeholder="username"
                    className="flex-1 bg-transparent border-none outline-none text-white placeholder-zinc-700 font-mono text-lg p-2 w-full min-w-0"
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
            {!currentUser && (
              <p className="text-zinc-500 text-[11px] font-medium uppercase tracking-widest mt-6">Free forever • No credit card required</p>
            )}
          </div>
        </div>

        {/* --- SPOTLIGHT BENTO BOX GRID --- */}
        <div className="max-w-6xl mx-auto px-6 w-full mb-32">
           <div className="text-center mb-12">
              <h2 className="text-3xl font-black mb-4">Everything in one place.</h2>
              <p className="text-zinc-500">Powerful widgets designed to show off who you are.</p>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[280px]">
              
              {/* Box 1: Music Sync */}
              <div className="md:col-span-2 bg-[#0a0a0c] rounded-[32px] border border-white/5 overflow-hidden relative group p-8 flex flex-col justify-between shadow-2xl transition duration-500">
                 <div className="absolute inset-0 bg-gradient-to-br from-[#1DB954]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                 
                 <div className="relative z-10">
                    <div className="w-12 h-12 bg-[#1DB954]/10 rounded-2xl flex items-center justify-center text-[#1DB954] mb-6 shadow-[0_0_15px_rgba(29,185,84,0.2)]">
                       <Music className="w-6 h-6" />
                    </div>
                    <h3 className="text-2xl font-black mb-2">Live Music Sync</h3>
                    <p className="text-zinc-400 text-sm max-w-sm">Connect Last.fm or Spotify to display exactly what you are listening to in real-time, completely automatically.</p>
                 </div>
                 
                 {/* Fake Music Player UI */}
                 <div className="relative z-10 bg-black/60 backdrop-blur-xl border border-white/5 rounded-2xl p-4 flex items-center gap-4 w-full max-w-sm transform group-hover:translate-x-2 transition duration-500">
                    <div className="w-14 h-14 bg-zinc-800 rounded-xl overflow-hidden shrink-0 shadow-lg relative">
                       <Image src="https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=200&auto=format&fit=crop" alt="Album" fill className="object-cover" unoptimized />
                    </div>
                    <div className="flex-1 min-w-0">
                       <p className="text-[10px] text-[#1DB954] font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5"><Music className="w-3 h-3"/> Now Playing</p>
                       <p className="text-sm font-bold truncate text-white">Cyberpunk Vibes</p>
                       <p className="text-xs text-zinc-400 truncate">Synthwave Artist</p>
                    </div>
                    <div className="flex items-end gap-1 h-5 px-2 shrink-0">
                       <span className="w-1 bg-[#1DB954] rounded-full animate-pulse h-full"></span>
                       <span className="w-1 bg-[#1DB954] rounded-full animate-pulse h-2/3" style={{ animationDelay: '200ms' }}></span>
                       <span className="w-1 bg-[#1DB954] rounded-full animate-pulse h-4/5" style={{ animationDelay: '400ms' }}></span>
                    </div>
                 </div>
              </div>

              {/* Box 2: Communities */}
              <div className="md:col-span-1 bg-[#0a0a0c] rounded-[32px] border border-white/5 overflow-hidden relative group p-8 flex flex-col justify-between shadow-2xl transition duration-500">
                 <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                 
                 <div className="relative z-10 text-center flex flex-col items-center">
                    <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 mb-6 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                       <Users className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-black mb-2">Squad Up</h3>
                    <p className="text-zinc-400 text-sm">Create a shared hub for your clan, esports team, or friend group.</p>
                 </div>
                 
                 {/* Fake Abstract Avatar Stack (No faces) */}
                 <div className="relative z-10 flex justify-center mt-6 group-hover:-translate-y-2 transition duration-500">
                    <div className="flex -space-x-4">
                       <div className="w-14 h-14 rounded-full border-[3px] border-[#0a0a0c] bg-indigo-600 z-30 flex items-center justify-center shadow-lg"><Image src="https://images.unsplash.com/photo-1618336753974-aae8e04506aa?q=80&w=100&auto=format&fit=crop" width={56} height={56} alt="av" className="rounded-full object-cover w-full h-full" unoptimized/></div>
                       <div className="w-14 h-14 rounded-full border-[3px] border-[#0a0a0c] bg-pink-600 z-20 flex items-center justify-center shadow-lg"><Image src="https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=100&auto=format&fit=crop" width={56} height={56} alt="av" className="rounded-full object-cover w-full h-full" unoptimized/></div>
                       <div className="w-14 h-14 rounded-full border-[3px] border-[#0a0a0c] bg-zinc-800 z-10 flex items-center justify-center text-xs font-bold shadow-lg">+4</div>
                    </div>
                 </div>
              </div>

              {/* Box 3: Hardware (Flickering Grid) */}
              <div className="md:col-span-1 bg-[#0a0a0c] rounded-[32px] border border-white/5 overflow-hidden relative group p-8 flex flex-col justify-between shadow-2xl transition duration-500">
                 {/* Flickering Grid Background */}
                 <div className="absolute inset-0 bg-dot-pattern animate-flicker pointer-events-none"></div>
                 <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c] to-transparent"></div>

                 <div className="relative z-10">
                    <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-white mb-6 backdrop-blur-md">
                       <Cpu className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-black mb-2">Flex Your Rig</h3>
                    <p className="text-zinc-400 text-sm">Show off your exact PC specs and gaming peripherals.</p>
                 </div>
                 
                 <div className="relative z-10 space-y-2 mt-4 opacity-70 group-hover:opacity-100 transition">
                    <div className="bg-white/5 backdrop-blur-sm rounded-lg p-2.5 flex items-center gap-3">
                       <Monitor className="w-4 h-4 text-zinc-500 shrink-0" /> <span className="text-xs font-mono text-zinc-300 truncate">AW3423DW OLED</span>
                    </div>
                    <div className="bg-white/5 backdrop-blur-sm rounded-lg p-2.5 flex items-center gap-3">
                       <Mouse className="w-4 h-4 text-zinc-500 shrink-0" /> <span className="text-xs font-mono text-zinc-300 truncate">G Pro Superlight</span>
                    </div>
                 </div>
              </div>

              {/* Box 4: Aesthetics (Border Beam) */}
              <div className="md:col-span-2 bg-[#0a0a0c] rounded-[32px] border border-white/5 overflow-hidden relative group p-8 flex flex-col sm:flex-row items-center justify-between gap-8 shadow-2xl transition duration-500">
                 
                 {/* Border Beam Animation */}
                 <span className="absolute inset-[-1000%] animate-spin-slow bg-[conic-gradient(from_0deg,transparent_0_300deg,#ec4899_360deg)] opacity-0 group-hover:opacity-30 transition duration-500 pointer-events-none" />
                 <div className="absolute inset-[1px] bg-[#0a0a0c] rounded-[31px]"></div> {/* Inner Mask for Border Beam */}
                 
                 <div className="absolute inset-0 bg-gradient-to-l from-pink-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                 
                 <div className="relative z-10 flex-1">
                    <div className="w-12 h-12 bg-pink-500/10 rounded-2xl flex items-center justify-center text-pink-400 mb-6 shadow-[0_0_15px_rgba(236,72,153,0.2)]">
                       <Flame className="w-6 h-6" />
                    </div>
                    <h3 className="text-2xl font-black mb-2">God-Tier Aesthetics</h3>
                    <p className="text-zinc-400 text-sm max-w-sm">Stand out with animated avatar frames, custom cursor trails, neon name effects, and gorgeous profile backgrounds.</p>
                 </div>

                 {/* REAL AvatarDecoration Mockup */}
                 <div className="relative z-10 shrink-0 w-32 h-32 flex items-center justify-center mt-6 sm:mt-0 group-hover:scale-105 transition duration-500">
                    <AvatarDecoration type="electric_god">
                       <div className="w-28 h-28 rounded-full bg-[#121214] relative z-10 shadow-[0_0_30px_rgba(168,85,247,0.3)] border border-white/10">
                          <Image src="https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=200&auto=format&fit=crop" alt="Avatar" fill className="rounded-full object-cover p-1.5 bg-[#0a0a0c]" unoptimized />
                       </div>
                    </AvatarDecoration>
                 </div>
              </div>

           </div>
        </div>

        {/* --- INFINITE CAROUSEL WITH MASKS --- */}
        <div className="w-full overflow-hidden mb-24 border-y border-white/5 bg-black/40 backdrop-blur-md py-16 relative" style={{ maskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)', WebkitMaskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)' }}>
           
           <div className="text-center mb-10 relative z-30">
              <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest">Join thousands of gamers</p>
           </div>

           <div className="flex w-max animate-scroll gap-6 px-4">
              {[...exampleProfiles, ...exampleProfiles, ...exampleProfiles].map((profile, i) => (
                <div key={i} className="w-[280px] h-[360px] bg-[#0a0a0c] rounded-3xl border border-white/10 overflow-hidden flex-shrink-0 relative group hover:border-white/30 transition-all hover:-translate-y-2 shadow-2xl">
                   {/* Banner */}
                   <div className="h-32 relative">
                      <Image src={profile.banner} alt="Banner" fill className="object-cover group-hover:scale-110 transition duration-700" unoptimized />
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0a0a0c]"></div>
                   </div>
                   {/* Content */}
                   <div className="p-6 relative -mt-12 flex flex-col h-full">
                      <div className="w-20 h-20 rounded-2xl p-1 bg-[#0a0a0c] mb-3 shadow-xl relative z-10">
                         <Image src={profile.avatar} alt="PFP" width={80} height={80} className="rounded-xl object-cover w-full h-full bg-zinc-900" unoptimized />
                      </div>
                      <h3 className="text-2xl font-black text-white">{profile.name}</h3>
                      <p className="text-zinc-500 text-sm mb-4 font-mono">@{profile.handle}</p>
                      
                      <div className="flex flex-wrap gap-2 mb-6">
                         {profile.badges.map(b => (
                           <span key={b} className={`text-[10px] font-bold px-2 py-1 rounded-md text-white bg-white/5 border border-white/10`}>
                             {b}
                           </span>
                         ))}
                      </div>

                      <div className="mt-auto bg-white/5 p-3 rounded-xl border border-white/5 flex items-center gap-3 group-hover:bg-white/10 transition">
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