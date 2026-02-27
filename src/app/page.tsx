"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Sparkles, Gamepad2, Palette, Share2, Music, Users, Cpu, Flame, ChevronRight, Monitor, Keyboard, Mouse, LayoutDashboard } from "lucide-react";
import Image from "next/image";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import AvatarDecoration from "@/components/AvatarDecoration";

export default function LandingPage() {
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
      banner: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=800&auto=format&fit=crop", 
      avatar: "https://images.unsplash.com/photo-1614853316476-de00d14cb1fc?q=80&w=200&auto=format&fit=crop", 
      badges: ["Level 42", "Pro"],
      games: "142 Games"
    },
    {
      handle: "milky",
      name: "Milky",
      color: "bg-blue-500",
      banner: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=800&auto=format&fit=crop", 
      avatar: "https://images.unsplash.com/photo-1618336753974-aae8e04506aa?q=80&w=200&auto=format&fit=crop", 
      badges: ["Streamer", "Partner"],
      games: "312 Games"
    },
    {
      handle: "glitch",
      name: "Glitch",
      color: "bg-emerald-500",
      banner: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=800&auto=format&fit=crop", 
      avatar: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=200&auto=format&fit=crop", 
      badges: ["Dev", "Verified"],
      games: "89 Games"
    },
    {
      handle: "kream",
      name: "Kream",
      color: "bg-pink-500",
      banner: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=800&auto=format&fit=crop", 
      avatar: "https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?q=80&w=200&auto=format&fit=crop", 
      badges: ["Artist"],
      games: "24 Games"
    }
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white selection:bg-indigo-500/30 font-sans flex flex-col overflow-x-hidden">
      
      {/* CSS for Animations */}
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
        .bg-grid-pattern {
          background-image: linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px),
                            linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 40px 40px;
        }
      `}</style>

      {/* Dynamic Background Ambience */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
         <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-indigo-600/10 blur-[150px] rounded-full mix-blend-screen animate-pulse" style={{ animationDuration: '4s' }}></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-pink-600/10 blur-[120px] rounded-full mix-blend-screen"></div>
         <div className="absolute inset-0 bg-grid-pattern opacity-50"></div>
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03]"></div>
         <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a0a0c]/80 to-[#0a0a0c]"></div>
      </div>

      {/* Navbar */}
      <nav className="w-full max-w-7xl mx-auto px-6 py-6 flex justify-between items-center z-50 relative">
        <div className="text-xl font-bold tracking-tighter flex items-center gap-2 group hover:opacity-80 transition cursor-pointer">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">Pulse</span>
        </div>
        
        {/* Dynamic Nav Actions */}
        <div className={`flex gap-4 items-center transition-opacity duration-300 ${authLoading ? 'opacity-0' : 'opacity-100'}`}>
          {currentUser ? (
            <Link href="/dashboard" className="text-sm font-bold bg-white text-black px-5 py-2.5 rounded-full hover:bg-zinc-200 hover:scale-105 transition shadow-lg shadow-white/5 flex items-center gap-2">
              <LayoutDashboard className="w-4 h-4" /> Dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium text-zinc-400 hover:text-white transition">
                Login
              </Link>
              <Link href="/signup" className="text-sm font-bold bg-white text-black px-5 py-2.5 rounded-full hover:bg-zinc-200 hover:scale-105 transition shadow-lg shadow-white/5">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center z-10 relative pt-12 md:pt-20">
        
        {/* HERO SECTION */}
        <div className="text-center px-4 max-w-4xl mx-auto mb-24">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#121214]/80 backdrop-blur-md border border-white/10 text-xs font-bold mb-8 shadow-2xl">
            <span className="relative flex h-2 w-2 mr-1">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-zinc-300"><span className="text-emerald-400">Live:</span> Communities & Music Sync</span>
          </div>

          <h1 className="text-5xl sm:text-7xl md:text-[5.5rem] font-black tracking-tight mb-8 leading-[0.95]">
            The Ultimate Identity <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 drop-shadow-sm">
              For Gamers.
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-12 leading-relaxed">
            Aggregate your Steam library, showcase your hardware, sync your live music, and build your gaming legacy in one stunning link.
          </p>

          {/* DYNAMIC CLAIM/DASHBOARD INPUT */}
          <div className={`w-full max-w-lg mx-auto relative group transition-opacity duration-500 ${authLoading ? 'opacity-0' : 'opacity-100'}`}>
            <div className="absolute -inset-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl blur opacity-20 group-hover:opacity-60 transition duration-1000"></div>
            
            {currentUser ? (
              <button 
                onClick={() => router.push('/dashboard')}
                className="relative w-full bg-[#0a0a0c] border border-white/10 rounded-2xl flex items-center justify-center p-4 shadow-2xl transition group-hover:border-white/20 text-white font-bold hover:bg-[#121214] gap-3"
              >
                Go to your Dashboard <ArrowRight className="w-5 h-5 text-indigo-400" />
              </button>
            ) : (
              <form onSubmit={handleClaim} className="relative bg-[#0a0a0c] border border-white/10 rounded-2xl flex items-center p-2 pl-5 shadow-2xl transition group-hover:border-white/20">
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
                  className="bg-white text-black px-6 py-4 rounded-xl font-bold hover:bg-zinc-200 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg hover:scale-105 active:scale-95"
                >
                  Claim <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}
            {!currentUser && (
              <p className="text-zinc-500 text-[11px] font-medium uppercase tracking-widest mt-6">Free forever • No credit card required</p>
            )}
          </div>
        </div>

        {/* --- PREMIUM BENTO BOX GRID --- */}
        <div className="max-w-6xl mx-auto px-6 w-full mb-32">
           <div className="text-center mb-12">
              <h2 className="text-3xl font-black mb-4">Everything in one place.</h2>
              <p className="text-zinc-500">Powerful widgets designed to show off who you are.</p>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[280px]">
              
              {/* Box 1: Music Sync (Wide) */}
              <div className="md:col-span-2 bg-gradient-to-br from-[#121214] to-[#0a0a0c] rounded-[32px] border border-white/5 overflow-hidden relative group hover:border-white/10 transition duration-500 p-8 flex flex-col justify-between shadow-2xl">
                 <div className="absolute top-0 right-0 w-64 h-64 bg-[#1DB954]/10 blur-3xl rounded-full -mr-20 -mt-20 group-hover:bg-[#1DB954]/20 transition duration-700"></div>
                 <div className="relative z-10">
                    <div className="w-12 h-12 bg-[#1DB954]/10 rounded-2xl flex items-center justify-center text-[#1DB954] mb-6">
                       <Music className="w-6 h-6" />
                    </div>
                    <h3 className="text-2xl font-black mb-2">Live Music Sync</h3>
                    <p className="text-zinc-400 text-sm max-w-sm">Connect Last.fm or Spotify to display exactly what you are listening to in real-time, completely automatically.</p>
                 </div>
                 
                 {/* Fake Music Player UI */}
                 <div className="relative z-10 bg-black/40 backdrop-blur-md border border-white/5 rounded-2xl p-4 flex items-center gap-4 w-full max-w-sm transform group-hover:translate-x-2 transition duration-500">
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

              {/* Box 2: Communities (Square) */}
              <div className="md:col-span-1 bg-gradient-to-br from-[#121214] to-[#0a0a0c] rounded-[32px] border border-white/5 overflow-hidden relative group hover:border-white/10 transition duration-500 p-8 flex flex-col justify-between shadow-2xl">
                 <div className="absolute inset-0 bg-indigo-500/5 group-hover:bg-indigo-500/10 transition duration-500"></div>
                 <div className="relative z-10 text-center flex flex-col items-center">
                    <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 mb-6">
                       <Users className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-black mb-2">Squad Up</h3>
                    <p className="text-zinc-400 text-sm">Create a shared hub for your clan, esports team, or friend group.</p>
                 </div>
                 
                 {/* Fake Avatar Stack */}
                 <div className="relative z-10 flex justify-center mt-6 group-hover:-translate-y-2 transition duration-500">
                    <div className="flex -space-x-4">
                       <div className="w-14 h-14 rounded-full border-[3px] border-[#121214] bg-indigo-600 z-30 flex items-center justify-center shadow-lg"><Image src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=100&auto=format&fit=crop" width={56} height={56} alt="av" className="rounded-full object-cover w-full h-full" unoptimized/></div>
                       <div className="w-14 h-14 rounded-full border-[3px] border-[#121214] bg-pink-600 z-20 flex items-center justify-center shadow-lg"><Image src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=100&auto=format&fit=crop" width={56} height={56} alt="av" className="rounded-full object-cover w-full h-full" unoptimized/></div>
                       <div className="w-14 h-14 rounded-full border-[3px] border-[#121214] bg-zinc-800 z-10 flex items-center justify-center text-xs font-bold shadow-lg">+4</div>
                    </div>
                 </div>
              </div>

              {/* Box 3: Hardware (Square) */}
              <div className="md:col-span-1 bg-gradient-to-br from-[#121214] to-[#0a0a0c] rounded-[32px] border border-white/5 overflow-hidden relative group hover:border-white/10 transition duration-500 p-8 flex flex-col justify-between shadow-2xl">
                 <div className="absolute inset-0 bg-grid-pattern opacity-10 group-hover:opacity-30 transition duration-500"></div>
                 <div className="relative z-10">
                    <div className="w-12 h-12 bg-zinc-800 rounded-2xl flex items-center justify-center text-white mb-6">
                       <Cpu className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-black mb-2">Flex Your Rig</h3>
                    <p className="text-zinc-400 text-sm">Show off your exact PC specs and gaming peripherals.</p>
                 </div>
                 
                 <div className="relative z-10 space-y-2 mt-4 opacity-80 group-hover:opacity-100 transition">
                    <div className="bg-black/50 backdrop-blur-sm border border-white/5 rounded-lg p-2.5 flex items-center gap-3">
                       <Monitor className="w-4 h-4 text-zinc-500 shrink-0" /> <span className="text-xs font-mono text-zinc-300 truncate">AW3423DW OLED</span>
                    </div>
                    <div className="bg-black/50 backdrop-blur-sm border border-white/5 rounded-lg p-2.5 flex items-center gap-3">
                       <Mouse className="w-4 h-4 text-zinc-500 shrink-0" /> <span className="text-xs font-mono text-zinc-300 truncate">G Pro Superlight</span>
                    </div>
                 </div>
              </div>

              {/* Box 4: Aesthetics (Wide) */}
              <div className="md:col-span-2 bg-gradient-to-br from-[#121214] to-[#0a0a0c] rounded-[32px] border border-white/5 overflow-hidden relative group hover:border-white/10 transition duration-500 p-8 flex flex-col sm:flex-row items-center justify-between gap-8 shadow-2xl">
                 <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-r from-purple-600/10 to-pink-600/10 blur-3xl opacity-0 group-hover:opacity-100 transition duration-700 pointer-events-none"></div>
                 
                 <div className="relative z-10 flex-1">
                    <div className="w-12 h-12 bg-pink-500/10 rounded-2xl flex items-center justify-center text-pink-400 mb-6">
                       <Flame className="w-6 h-6" />
                    </div>
                    <h3 className="text-2xl font-black mb-2">God-Tier Aesthetics</h3>
                    <p className="text-zinc-400 text-sm max-w-sm">Stand out with animated avatar frames, custom cursor trails, neon name effects, and gorgeous profile backgrounds.</p>
                 </div>

                 {/* REAL AvatarDecoration Mockup */}
                 <div className="relative z-10 shrink-0 w-32 h-32 flex items-center justify-center mt-6 sm:mt-0 group-hover:scale-105 transition duration-500">
                    <AvatarDecoration type="electric_god">
                       <div className="w-28 h-28 rounded-full bg-[#121214] relative z-10 shadow-2xl border border-white/10">
                          <Image src="https://images.unsplash.com/photo-1614853316476-de00d14cb1fc?q=80&w=200&auto=format&fit=crop" alt="Avatar" fill className="rounded-full object-cover p-1.5 bg-zinc-900" unoptimized />
                       </div>
                    </AvatarDecoration>
                 </div>
              </div>

           </div>
        </div>

        {/* --- INFINITE CAROUSEL --- */}
        <div className="w-full overflow-hidden mb-24 border-y border-white/5 bg-black/20 backdrop-blur-sm py-16 relative">
           <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0c] via-transparent to-[#0a0a0c] z-20 pointer-events-none"></div>
           
           <div className="text-center mb-10 relative z-30">
              <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest">Join thousands of gamers</p>
           </div>

           <div className="flex w-max animate-scroll gap-6 px-4">
              {[...exampleProfiles, ...exampleProfiles, ...exampleProfiles].map((profile, i) => (
                <div key={i} className="w-[280px] h-[360px] bg-[#121214] rounded-3xl border border-white/5 overflow-hidden flex-shrink-0 relative group hover:border-white/20 transition-all hover:-translate-y-2 shadow-2xl">
                   {/* Banner */}
                   <div className="h-32 relative">
                      <Image src={profile.banner} alt="Banner" fill className="object-cover group-hover:scale-105 transition duration-700" unoptimized />
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#121214]"></div>
                   </div>
                   {/* Content */}
                   <div className="p-6 relative -mt-12 flex flex-col h-full">
                      <div className="w-20 h-20 rounded-2xl p-1.5 bg-[#121214] mb-3 shadow-xl relative z-10">
                         <Image src={profile.avatar} alt="PFP" width={80} height={80} className="rounded-xl object-cover w-full h-full bg-zinc-900" unoptimized />
                      </div>
                      <h3 className="text-2xl font-black text-white">{profile.name}</h3>
                      <p className="text-zinc-500 text-sm mb-4">@{profile.handle}</p>
                      
                      <div className="flex flex-wrap gap-2 mb-6">
                         {profile.badges.map(b => (
                           <span key={b} className={`text-[10px] font-bold px-2 py-1 rounded-md text-white bg-white/5 border border-white/10`}>
                             {b}
                           </span>
                         ))}
                      </div>

                      <div className="mt-auto bg-black/40 backdrop-blur-sm p-3 rounded-xl border border-white/5 flex items-center gap-3">
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
      <footer className="w-full border-t border-white/5 bg-black/40 backdrop-blur-xl py-12 z-10 relative">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 font-bold text-lg tracking-tighter opacity-80">
             <div className="w-6 h-6 bg-white text-black rounded flex items-center justify-center"><Sparkles className="w-3 h-3" /></div>Pulse
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