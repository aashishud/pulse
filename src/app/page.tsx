"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Sparkles, Gamepad2, Palette, Share2, ShieldCheck, Zap, Trophy, Link as LinkIcon } from "lucide-react";
import Image from "next/image";

export default function LandingPage() {
  const [username, setUsername] = useState("");
  const router = useRouter();

  const handleClaim = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.length > 2) {
      router.push(`/signup?handle=${username.toLowerCase()}`);
    }
  };

  // Mock Data for the Carousel (Updated with Gamer Aesthetics)
  const exampleProfiles = [
    {
      handle: "sour",
      name: "Sour",
      color: "bg-indigo-600",
      banner: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=800&auto=format&fit=crop", // Vibrant Gradient
      avatar: "https://images.unsplash.com/photo-1614853316476-de00d14cb1fc?q=80&w=200&auto=format&fit=crop", // Abstract Neon
      badges: ["Level 42", "Pro"],
      games: "142 Games"
    },
    {
      handle: "milky",
      name: "Milky",
      color: "bg-blue-500",
      banner: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=800&auto=format&fit=crop", // Cyberpunk City
      avatar: "https://images.unsplash.com/photo-1618336753974-aae8e04506aa?q=80&w=200&auto=format&fit=crop", // Abstract Fluid
      badges: ["Streamer", "Partner"],
      games: "312 Games"
    },
    {
      handle: "glitch",
      name: "Glitch",
      color: "bg-emerald-500",
      banner: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=800&auto=format&fit=crop", // Retro Tech
      avatar: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=200&auto=format&fit=crop", // 3D Render
      badges: ["Dev", "Verified"],
      games: "89 Games"
    },
    {
      handle: "kream",
      name: "Kream",
      color: "bg-pink-500",
      banner: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=800&auto=format&fit=crop", // Event/Abstract
      avatar: "https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?q=80&w=200&auto=format&fit=crop", // Pink Abstract
      badges: ["Artist"],
      games: "24 Games"
    }
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white selection:bg-indigo-500/30 font-sans flex flex-col overflow-x-hidden">
      
      {/* CSS for Infinite Scroll */}
      <style jsx global>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-scroll {
          animation: scroll 40s linear infinite;
        }
        .animate-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>

      {/* Background Ambience */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
         <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-900/20 blur-[120px] rounded-full mix-blend-screen animate-pulse"></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-900/10 blur-[120px] rounded-full mix-blend-screen"></div>
         <div className="absolute top-[40%] left-[50%] transform -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5"></div>
      </div>

      {/* Navbar */}
      <nav className="w-full max-w-7xl mx-auto px-6 py-6 flex justify-between items-center z-50 relative">
        <div className="text-xl font-bold tracking-tighter flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">Pulse</span>
        </div>
        <div className="flex gap-4 items-center">
            <Link href="/login" className="text-sm font-medium text-zinc-400 hover:text-white transition">
              Login
            </Link>
            <Link href="/signup" className="text-sm font-bold bg-white text-black px-5 py-2.5 rounded-full hover:bg-zinc-200 transition shadow-lg shadow-white/5">
              Sign Up
            </Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center z-10 relative pt-20">
        
        {/* HERO */}
        <div className="text-center px-4 max-w-4xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium mb-8 text-indigo-300">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            New: Discord & Spotify Integration
          </div>

          <h1 className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tight mb-8 leading-[0.9]">
            Your Gaming Legacy <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">In One Link.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-12 leading-relaxed">
            Aggregate your Steam library, Xbox achievements, and gaming history into a single, beautiful profile.
          </p>

          {/* CLAIM INPUT */}
          <form onSubmit={handleClaim} className="w-full max-w-lg mx-auto relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-1000"></div>
            <div className="relative bg-[#0e0e11] border border-white/10 rounded-xl flex items-center p-2 pl-4 shadow-2xl">
              <span className="text-zinc-500 font-mono text-lg select-none">pulsegg.in/</span>
              <input 
                type="text" 
                placeholder="username"
                className="flex-1 bg-transparent border-none outline-none text-white placeholder-zinc-600 font-mono text-lg p-2 w-full"
                value={username}
                onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9-_]/g, ''))} 
                autoFocus
              />
              <button 
                type="submit"
                disabled={username.length < 3}
                className="bg-white text-black px-6 py-3 rounded-lg font-bold hover:bg-zinc-200 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                Claim <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <p className="text-zinc-500 text-xs mt-4">Free forever • No credit card • Instant Setup</p>
          </form>
        </div>

        {/* --- NEW: INFINITE CAROUSEL --- */}
        <div className="w-full overflow-hidden mb-32 border-y border-white/5 bg-black/20 backdrop-blur-sm py-12 relative">
           <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0c] via-transparent to-[#0a0a0c] z-20 pointer-events-none"></div>
           
           <div className="flex w-max animate-scroll gap-8 px-4">
              {/* Duplicate the list to create infinite effect */}
              {[...exampleProfiles, ...exampleProfiles, ...exampleProfiles].map((profile, i) => (
                <div key={i} className="w-[300px] h-[380px] bg-[#121214] rounded-3xl border border-white/10 overflow-hidden flex-shrink-0 relative group hover:border-white/20 transition-all hover:-translate-y-2 shadow-2xl">
                   {/* Banner */}
                   <div className="h-32 relative">
                      <Image src={profile.banner} alt="Banner" fill className="object-cover" unoptimized />
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#121214]"></div>
                   </div>
                   {/* Content */}
                   <div className="p-6 relative -mt-12 flex flex-col h-full">
                      <div className="w-20 h-20 rounded-2xl p-1 bg-[#121214] mb-3">
                         <Image src={profile.avatar} alt="PFP" width={80} height={80} className="rounded-xl object-cover w-full h-full bg-zinc-800" unoptimized />
                      </div>
                      <h3 className="text-2xl font-black">{profile.name}</h3>
                      <p className="text-zinc-500 text-sm mb-4">@{profile.handle}</p>
                      
                      <div className="flex flex-wrap gap-2 mb-6">
                         {profile.badges.map(b => (
                           <span key={b} className={`text-[10px] font-bold px-2 py-1 rounded-md text-black ${profile.color.replace('bg-', 'bg-')}/20 text-white border border-white/10`}>
                             {b}
                           </span>
                         ))}
                      </div>

                      <div className="mt-auto bg-zinc-900/50 p-3 rounded-xl border border-white/5 flex items-center gap-3">
                         <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${profile.color} text-white`}>
                           <Gamepad2 className="w-4 h-4" />
                         </div>
                         <div>
                            <p className="text-[10px] text-zinc-500 font-bold uppercase">Collection</p>
                            <p className="text-sm font-bold">{profile.games}</p>
                         </div>
                      </div>
                   </div>
                </div>
              ))}
           </div>
        </div>

        {/* FEATURES GRID */}
        <div className="max-w-7xl mx-auto px-6 w-full mb-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#121214]/50 backdrop-blur-sm border border-white/5 p-8 rounded-3xl hover:border-white/10 transition group">
              <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 mb-6 group-hover:scale-110 transition">
                <Gamepad2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Universal Sync</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Connect Steam, Xbox, Epic Games, and Discord. We pull your stats, playtime, and library automatically.
              </p>
            </div>

            <div className="bg-[#121214]/50 backdrop-blur-sm border border-white/5 p-8 rounded-3xl hover:border-white/10 transition group">
              <div className="w-12 h-12 bg-pink-500/10 rounded-2xl flex items-center justify-center text-pink-400 mb-6 group-hover:scale-110 transition">
                <Palette className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Custom Aesthetics</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Express yourself with custom banners, animated wallpapers, neon name effects, and layout controls.
              </p>
            </div>

            <div className="bg-[#121214]/50 backdrop-blur-sm border border-white/5 p-8 rounded-3xl hover:border-white/10 transition group">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400 mb-6 group-hover:scale-110 transition">
                <Share2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Share Anywhere</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                One short link for your bio. Perfect for Twitter, Instagram, Twitch, and your Discord status.
              </p>
            </div>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="w-full border-t border-white/5 bg-black/20 backdrop-blur-md py-12 z-10 relative">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 font-bold text-lg tracking-tighter opacity-80">
             <div className="w-6 h-6 bg-white text-black rounded flex items-center justify-center"><Sparkles className="w-3 h-3" /></div>Pulse
          </div>
          
          <div className="text-zinc-600 text-xs font-medium">
            &copy; {new Date().getFullYear()} Pulse. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}