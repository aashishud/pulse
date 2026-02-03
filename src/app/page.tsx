"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

export default function LandingPage() {
  const [username, setUsername] = useState("");
  const router = useRouter();

  const handleClaim = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.length > 2) {
      router.push(`/signup?handle=${username.toLowerCase()}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white selection:bg-indigo-500/30 flex flex-col relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-indigo-900/20 blur-[150px] rounded-full mix-blend-screen pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-purple-900/20 blur-[150px] rounded-full mix-blend-screen pointer-events-none" />

      <nav className="w-full max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8 flex justify-between items-center z-50 relative">
        <div className="text-xl md:text-2xl font-bold tracking-tighter flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          Pulse
        </div>
        <div className="flex gap-4 md:gap-6 items-center">
            <Link href="/login" className="text-sm font-bold text-zinc-400 hover:text-white transition">
              Login
            </Link>
            <Link href="/signup" className="text-sm font-bold bg-white text-black px-4 py-2 rounded-lg hover:bg-zinc-200 transition">
              Sign Up
            </Link>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 z-10 -mt-20 relative">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs md:text-sm font-medium mb-6 md:mb-8 animate-fade-in-up">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          Accepting Early Access
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-8xl font-black tracking-tighter mb-4 md:mb-6 bg-gradient-to-br from-white via-white to-zinc-500 bg-clip-text text-transparent max-w-4xl leading-tight">
          The Linktree for <br className="hidden md:block" /> Gamers.
        </h1>
        
        <p className="text-base md:text-xl text-zinc-400 max-w-2xl mb-8 md:mb-12 leading-relaxed px-2">
          Aggregate your achievements, showcase your stats, and build your ultimate gaming portfolio. All in one link.
        </p>

        <form onSubmit={handleClaim} className="w-full max-w-md relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-500"></div>
          <div className="relative bg-[#0a0a0c] border border-white/10 rounded-2xl flex items-center p-2 shadow-2xl">
            <span className="pl-4 text-zinc-500 font-mono text-base md:text-lg">pulse.gg/</span>
            <input 
              type="text" 
              placeholder="username"
              className="flex-1 bg-transparent border-none outline-none text-white placeholder-zinc-600 font-mono text-base md:text-lg p-2 w-full min-w-0"
              value={username}
              onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9-_]/g, ''))} 
            />
            <button 
              type="submit"
              disabled={username.length < 3}
              className="bg-white text-black px-4 md:px-6 py-2 md:py-3 rounded-xl font-bold hover:bg-zinc-200 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
            >
              Claim <ArrowRight className="w-4 h-4 hidden sm:block" />
            </button>
          </div>
          <p className="text-zinc-500 text-xs mt-4">Free forever. No credit card required.</p>
        </form>
      </main>

      <div className="border-t border-white/5 bg-white/[0.02] backdrop-blur-sm z-20 relative">
        <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
           <div className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0">
               <div className="w-5 h-5 border-2 border-current rounded-full"></div>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-1">Steam Integration</h3>
              <p className="text-sm text-zinc-400">Connect instantly to sync hours, library, and stats.</p>
            </div>
          </div>
          <div className="flex gap-4">
             <div className="w-10 h-10 rounded-full bg-pink-500/10 flex items-center justify-center text-pink-400 shrink-0">
               <div className="w-5 h-5 border-2 border-current rounded-full"></div>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-1">Custom Themes</h3>
              <p className="text-sm text-zinc-400">Design your profile with banners, widgets, and colors.</p>
            </div>
          </div>
          <div className="flex gap-4">
             <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
               <div className="w-5 h-5 border-2 border-current rounded-full"></div>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-1">Unique Subdomain</h3>
              <p className="text-sm text-zinc-400">Get a short, professional URL like pulsegg.vercel.app/pulse</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}