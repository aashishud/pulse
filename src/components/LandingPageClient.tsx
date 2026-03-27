"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Sparkles, Gamepad2, Palette, Music, Users, Cpu, Monitor, LayoutDashboard, BadgeCheck, Diamond, Crown, Terminal } from "lucide-react";
import Image from "next/image";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import AvatarDecoration from "@/components/AvatarDecoration";
import PulseLogo from "@/components/PulseLogo";
import BackgroundShader from "@/components/BackgroundShader";

// The username that acts as the default "Showcase" profile for logged-out users
const SHOWCASE_USERNAME = "sour";

export default function LandingPageClient() {
  const [username, setUsername] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [previewUser, setPreviewUser] = useState<any>(null); // State for live profile preview
  const [mockSpotify, setMockSpotify] = useState<{ title: string; artist: string; albumArt: string; isPlaying: boolean } | null>(null); // State for live music
  const [authLoading, setAuthLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    // 1. Fetch the default showcase profile right away so it never looks fake
    const fetchDefaultProfile = async () => {
      try {
        const docRef = doc(db, "users", SHOWCASE_USERNAME);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && isMounted) {
          // Set it as the preview user (will be overridden if they are logged in)
          setPreviewUser((prev: any) => prev ? prev : docSnap.data());
        }
      } catch (e) {
        console.error("Failed to fetch showcase user", e);
      }
    };

    fetchDefaultProfile();

    // 2. Listen for auth changes and override the preview if they are logged in
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
         try {
            const q = query(collection(db, "users"), where("owner_uid", "==", user.uid));
            const snap = await getDocs(q);
            if (!snap.empty && isMounted) {
               setPreviewUser(snap.docs[0].data());
            }
         } catch (e) {
            console.error("Failed to fetch preview user", e);
         }
      }
      setAuthLoading(false);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // 3. Fetch live music data whenever the previewUser changes
  useEffect(() => {
    const fetchMusic = async () => {
      if (previewUser?.lastfm) {
        try {
          const res = await fetch(`/api/lastfm/now-playing?user=${previewUser.lastfm}`);
          const data = await res.json();
          if (data.nowPlaying?.isPlaying) {
            setMockSpotify(data.nowPlaying);
          } else if (data.topTracks && data.topTracks.length > 0) {
            setMockSpotify(data.topTracks[0]);
          }
        } catch (e) {
          console.error("Failed to fetch music for showcase", e);
        }
      }
    };
    fetchMusic();
  }, [previewUser?.lastfm]);

  const handleClaim = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.length > 2) {
      router.push(`/signup?handle=${username.toLowerCase()}`);
    }
  };

  // --- NEW COMPACT SHOWCASE CARDS (Replaces the chunky fake profile cards) ---
  const showcaseRow1 = [
    {
      handle: "sour", name: "Sour", avatar: "https://cdn.discordapp.com/avatars/700982390113173545/a_410368d4363682ff8f5be0b361907563.gif?size=1024", deco: "electric_god",
      statusIcon: <Music className="w-3.5 h-3.5" />, statusText: "Listening to STARWALK",
      colorClass: "text-[#1DB954]", bgClass: "bg-[#1DB954]/10", borderClass: "border-[#1DB954]/20",
      badges: [<BadgeCheck key="1" className="w-4 h-4 text-blue-400 fill-blue-400/20" />, <Crown key="2" className="w-4 h-4 text-yellow-400 fill-yellow-400/20" />]
    },
    {
      handle: "phantom", name: "Phantom", avatar: "https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?q=80&w=200&auto=format&fit=crop", deco: "fire_god",
      statusIcon: <Gamepad2 className="w-3.5 h-3.5" />, statusText: "Playing VALORANT",
      colorClass: "text-red-400", bgClass: "bg-red-500/10", borderClass: "border-red-500/20",
      badges: [<Diamond key="1" className="w-4 h-4 text-white fill-white/20" />]
    },
    {
      handle: "glitch", name: "Glitch", avatar: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=200&auto=format&fit=crop", deco: "glitch",
      statusIcon: <Monitor className="w-3.5 h-3.5" />, statusText: "Developing Pulse",
      colorClass: "text-indigo-400", bgClass: "bg-indigo-500/10", borderClass: "border-indigo-500/20",
      badges: [<BadgeCheck key="1" className="w-4 h-4 text-blue-400 fill-blue-400/20" />]
    },
     {
      handle: "milky", name: "Milky", avatar: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=200&auto=format&fit=crop", deco: "none",
      statusIcon: <img src="https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/twitch.svg" className="w-3.5 h-3.5 invert opacity-80" />, statusText: "Live on Twitch",
      colorClass: "text-purple-400", bgClass: "bg-purple-500/10", borderClass: "border-purple-500/20",
      badges: [<BadgeCheck key="1" className="w-4 h-4 text-blue-400 fill-blue-400/20" />]
    }
  ];

  const showcaseRow2 = [
    {
      handle: "kream", name: "Kream", avatar: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=200&auto=format&fit=crop", deco: "neon",
      statusIcon: <Palette className="w-3.5 h-3.5" />, statusText: "Designing Graphics",
      colorClass: "text-pink-400", bgClass: "bg-pink-500/10", borderClass: "border-pink-500/20",
      badges: []
    },
    {
      handle: "vex", name: "Vex", avatar: "https://cdn.discordapp.com/avatars/700982390113173545/a_410368d4363682ff8f5be0b361907563.gif?size=1024", deco: "gold",
      statusIcon: <img src="https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/steam.svg" className="w-3.5 h-3.5 invert opacity-80" />, statusText: "Level 142 on Steam",
      colorClass: "text-[#66c0f4]", bgClass: "bg-[#66c0f4]/10", borderClass: "border-[#66c0f4]/20",
      badges: [<BadgeCheck key="1" className="w-4 h-4 text-blue-400 fill-blue-400/20" />]
    },
    {
      handle: "zero", name: "Zero", avatar: "https://images.unsplash.com/photo-1511367461989-f85a21fda167?q=80&w=200&auto=format&fit=crop", deco: "none",
      statusIcon: <Users className="w-3.5 h-3.5" />, statusText: "In Squad: SOUR_GANG",
      colorClass: "text-zinc-300", bgClass: "bg-white/10", borderClass: "border-white/20",
      badges: []
    },
    {
      handle: "Trexen", name: "Trexen", avatar: "https://cdn.discordapp.com/avatars/866224112082616351/a75ce57ac7f990ca4bfdd6e2c119a18f.png?size=512", deco: "electric_god",
      statusIcon: <Music className="w-3.5 h-3.5" />, statusText: "Listening to Deftones",
      colorClass: "text-[#1DB954]", bgClass: "bg-[#1DB954]/10", borderClass: "border-[#1DB954]/20",
      badges: [<Diamond key="1" className="w-4 h-4 text-white fill-white/20" />]
    }
  ];

  // Dynamic variables for the 3D Floating Mockup (Uses the real user's data from Firestore!)
  const mockName = previewUser?.displayName || previewUser?.username || "Sour";
  const mockHandle = previewUser?.username || "sour";
  const mockAvatar = previewUser?.theme?.avatar || "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=200&auto=format&fit=crop";
  const mockBanner = previewUser?.theme?.banner || "https://images.unsplash.com/photo-1614624532983-4ce03382d63d?q=80&w=800&auto=format&fit=crop";
  const mockDecoration = previewUser?.theme?.avatarDecoration || "electric_god";
  const mockDiscordDeco = previewUser?.theme?.discordDecoration || "";
  const mockPrimaryColor = previewUser?.theme?.primary || "#6366f1"; 
  
  // Dynamic Connections
  const hasVerified = previewUser ? previewUser.isVerified : true;
  const hasDiscord = previewUser ? !!previewUser.socials?.discord_verified : true;
  const hasSteam = previewUser ? !!previewUser.steamId : true;
  const hasTwitter = previewUser ? !!previewUser.socials?.twitter : true;

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-indigo-500/30 font-sans flex flex-col overflow-x-hidden">
      
      {/* --- MAGIC CSS ELEMENTS --- */}
      <style jsx global>{`
        @keyframes scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .animate-scroll { animation: scroll 30s linear infinite; }
        .animate-scroll:hover { animation-play-state: paused; }

        @keyframes scroll-reverse { 0% { transform: translateX(-50%); } 100% { transform: translateX(0); } }
        .animate-scroll-reverse { animation: scroll-reverse 30s linear infinite; }
        .animate-scroll-reverse:hover { animation-play-state: paused; }
        
        @keyframes float {
          0% { transform: translateY(0px) rotateY(-15deg) rotateX(5deg); }
          50% { transform: translateY(-20px) rotateY(-12deg) rotateX(8deg); }
          100% { transform: translateY(0px) rotateY(-15deg) rotateX(5deg); }
        }
        .animate-float-3d { animation: float 8s ease-in-out infinite; transform-style: preserve-3d; }

        .bg-grid-pattern {
          background-size: 40px 40px;
          background-image: linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
                            linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
        }
      `}</style>

      {/* --- BACKGROUND AMBIENCE --- */}
      <div className="fixed inset-0 z-0 pointer-events-none">
         <BackgroundShader type="mesh-gradient" />
         <div className="absolute inset-0 bg-grid-pattern opacity-50" style={{ maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)', WebkitMaskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)' }}></div>
         <div className="absolute inset-0 bg-gradient-to-b from-[#050505]/40 via-[#050505]/80 to-[#050505] mix-blend-multiply"></div>
      </div>

      {/* --- NAVBAR --- */}
      <nav className="w-full max-w-7xl mx-auto px-6 py-6 flex justify-between items-center z-50 relative">
        <div className="text-xl font-bold tracking-tighter flex items-center gap-3 group cursor-pointer">
           <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.2)] group-hover:scale-105 transition">
              <PulseLogo className="w-4 h-4 text-black" />
           </div>
          <span className="text-white drop-shadow-md">Pulse</span>
        </div>
        
        <div className={`flex gap-4 items-center transition-opacity duration-300 ${authLoading ? 'opacity-0' : 'opacity-100'}`}>
          {currentUser ? (
            <Link href="/dashboard" className="text-xs font-bold bg-white/10 border border-white/20 text-white px-5 py-2.5 rounded-xl hover:bg-white hover:text-black transition flex items-center gap-2 backdrop-blur-md">
              <LayoutDashboard className="w-4 h-4" /> Dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className="text-xs font-bold text-zinc-400 hover:text-white transition uppercase tracking-widest">
                Login
              </Link>
              <Link href="/signup" className="text-xs font-bold bg-white text-black px-6 py-2.5 rounded-xl hover:bg-zinc-200 transition hover:scale-105 shadow-[0_0_20px_rgba(255,255,255,0.2)] uppercase tracking-widest">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* --- HERO SPLIT SECTION --- */}
      <main className="flex-1 z-10 relative">
        <div className="max-w-7xl mx-auto px-6 pt-12 pb-24 lg:pt-24 lg:pb-32 flex flex-col lg:flex-row items-center justify-between gap-16 lg:gap-8">
          
          {/* LEFT: Copy & Input (Brutalist, Confident) */}
          <div className="flex-1 text-left w-full max-w-2xl lg:max-w-none mx-auto lg:mx-0">
             <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] font-mono uppercase tracking-widest text-zinc-400 mb-6 backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Public Beta Live
             </div>
             
             <h1 className="text-6xl sm:text-7xl lg:text-[5.5rem] font-black tracking-tighter leading-[0.95] mb-6 drop-shadow-2xl">
                Your gaming <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
                  legacy.
                </span><br />
                Unified.
             </h1>
             
             <p className="text-lg text-zinc-400 max-w-lg mb-10 leading-relaxed font-medium">
                Stop pasting messy links. Everything you play, listen to, and create in one place. Build a custom gaming profile that actually represents you.
             </p>

             <div className={`w-full max-w-md transition-opacity duration-500 ${authLoading ? 'opacity-0' : 'opacity-100'}`}>
               {currentUser ? (
                 <button onClick={() => router.push('/dashboard')} className="w-full bg-white text-black rounded-2xl flex items-center justify-center p-5 font-black text-lg gap-3 hover:bg-zinc-200 transition shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:scale-[1.02]">
                    Enter Dashboard <ArrowRight className="w-5 h-5" />
                 </button>
               ) : (
                 <form onSubmit={handleClaim} className="relative group">
                   <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                   <div className="relative bg-[#0a0a0c] border border-white/10 rounded-2xl flex items-center p-2 pl-4 focus-within:border-indigo-500/50 transition shadow-2xl">
                     <Terminal className="w-4 h-4 text-zinc-500 hidden sm:block shrink-0" />
                     <span className="text-zinc-500 font-mono text-sm sm:text-base ml-2 sm:ml-3 select-none">pulse.gg/</span>
                     <input 
                       type="text" 
                       placeholder="username"
                       className="flex-1 bg-transparent border-none outline-none text-white font-mono text-sm sm:text-base p-2 w-full min-w-0"
                       value={username}
                       onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9-_]/g, ''))} 
                     />
                     <button 
                       type="submit"
                       disabled={username.length < 3}
                       className="bg-white text-black px-5 py-3 rounded-xl font-bold hover:bg-zinc-200 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg"
                     >
                       Claim <ArrowRight className="w-4 h-4" />
                     </button>
                   </div>
                 </form>
               )}
             </div>
          </div>

          {/* RIGHT: Floating 3D Profile Mockup (Powered by real user data!) */}
          <div className="flex-1 w-full relative perspective-[2000px] hidden md:block">
             <div className="w-full max-w-[400px] mx-auto animate-float-3d">
                {/* Glass Card Base */}
                <div className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-[32px] p-6 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden">
                   
                   {/* Dynamic Mock Banner */}
                   <div className="absolute top-0 left-0 w-full h-32 opacity-40">
                      <img src={mockBanner} alt="Banner" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0a0a0c]"></div>
                   </div>

                   {/* Dynamic Mock Avatar with Aura & Lottie */}
                   <div className="relative pt-12 flex justify-center mb-4">
                      {/* Aura dynamically uses their primary color */}
                      <div className="absolute inset-0 top-12 w-24 h-24 mx-auto rounded-full blur-xl opacity-50 animate-pulse pointer-events-none" style={{ backgroundColor: mockPrimaryColor }}></div>
                      
                      <div className="w-28 h-28 relative">
                         <AvatarDecoration type={mockDecoration}>
                            <div className="w-24 h-24 rounded-full bg-[#121214] relative z-10 border border-white/10 mx-auto mt-2">
                               <img src={mockAvatar} alt="Avatar" className="rounded-full object-cover p-1 bg-[#0a0a0c] w-full h-full" />
                               {mockDiscordDeco && (
                                  <img src={mockDiscordDeco} alt="Decoration" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] max-w-none z-30 pointer-events-none object-contain scale-[1.2]" />
                               )}
                            </div>
                         </AvatarDecoration>
                      </div>
                   </div>

                   {/* Dynamic Mock Identity */}
                   <div className="text-center relative z-10">
                      <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-400 tracking-tight flex items-center justify-center gap-2 mb-2">
                         {mockName} 
                         {(hasVerified || mockHandle === 'sour') && (
                           <div className="flex items-center gap-1.5 bg-white/10 px-2 py-0.5 rounded-full border border-white/10">
                             <BadgeCheck className="w-3.5 h-3.5 text-blue-400" />
                             {mockHandle === 'sour' && <Crown className="w-3.5 h-3.5 text-yellow-400" />}
                           </div>
                         )}
                      </h2>
                      <p className="text-xs font-mono text-zinc-500 mb-6">@{mockHandle}</p>
                      
                      {/* Socials Mock */}
                      <div className="flex justify-center gap-2 mb-6">
                         {hasDiscord && (
                           <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                              <img src="https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/discord.svg" className="w-4 h-4 invert opacity-80" />
                           </div>
                         )}
                         {hasSteam && (
                           <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                              <img src="https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/steam.svg" className="w-4 h-4 invert opacity-80" />
                           </div>
                         )}
                         {hasTwitter && (
                           <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                              <img src="https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/x.svg" className="w-4 h-4 invert opacity-80" />
                           </div>
                         )}
                      </div>

                      {/* Spotify Mock Widget (Now Live!) */}
                      <div className="bg-black/60 border border-[#1DB954]/30 rounded-2xl p-3 flex items-center gap-3 text-left w-full">
                         <div className="w-10 h-10 bg-zinc-800 rounded-lg overflow-hidden shrink-0 relative">
                            <img src={mockSpotify?.albumArt || "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=200&auto=format&fit=crop"} alt="Album" className="w-full h-full object-cover" />
                         </div>
                         <div className="flex-1 min-w-0">
                            <p className="text-[9px] text-[#1DB954] font-bold uppercase tracking-wider mb-0.5 flex items-center gap-1">
                               <Music className="w-2.5 h-2.5"/> {mockSpotify?.isPlaying ? "Listening on Spotify" : "Top Track"}
                            </p>
                            <p className="text-xs font-bold truncate text-white">{mockSpotify?.title || "Cyberpunk Vibes"}</p>
                            {mockSpotify?.artist && <p className="text-[10px] text-zinc-400 truncate mt-0.5">{mockSpotify.artist}</p>}
                         </div>
                         <div className="flex items-end gap-0.5 h-3 px-1 shrink-0">
                            <span className="w-1 bg-[#1DB954] rounded-full animate-pulse h-full"></span>
                            <span className="w-1 bg-[#1DB954] rounded-full animate-pulse h-2/3" style={{ animationDelay: '200ms' }}></span>
                            <span className="w-1 bg-[#1DB954] rounded-full animate-pulse h-4/5" style={{ animationDelay: '400ms' }}></span>
                         </div>
                      </div>

                   </div>
                </div>
             </div>
          </div>
        </div>

        {/* --- SPOTLIGHT BENTO BOX GRID --- */}
        <div className="max-w-6xl mx-auto px-6 w-full mb-32 relative z-20">
           <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-black mb-4 tracking-tight">Everything in one place.</h2>
              <p className="text-zinc-500 font-mono text-sm uppercase tracking-widest">Built exclusively for gamers.</p>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[280px]">
              
              {/* Box 1: Aesthetics */}
              <div className="md:col-span-2 bg-[#0c0c0e] border border-white/5 rounded-[32px] overflow-hidden relative group p-8 flex flex-col justify-between shadow-2xl transition duration-500 hover:border-white/10">
                 <div className="relative z-10">
                    <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-white mb-6 border border-white/10">
                       <Palette className="w-5 h-5" />
                    </div>
                    <h3 className="text-2xl font-black mb-2">Make it yours.</h3>
                    <p className="text-zinc-500 text-sm max-w-sm">Express yourself with animated backgrounds, dynamic avatar frames, frosted glass effects, and custom cursors to match your vibe.</p>
                 </div>
                 
                 <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-indigo-500/20 blur-[80px] rounded-full group-hover:bg-indigo-500/30 transition duration-500"></div>
                 
                 {/* Visual Mockups */}
                 <div className="relative z-10 flex gap-4 mt-8 opacity-80 group-hover:opacity-100 transition">
                    <div className="px-4 py-2 bg-black/40 border border-white/10 rounded-full flex items-center gap-2 text-xs font-mono backdrop-blur-md shadow-lg">
                       <Sparkles className="w-3 h-3 text-yellow-400" /> Custom Badges
                    </div>
                    <div className="px-4 py-2 bg-black/40 border border-white/10 rounded-full flex items-center gap-2 text-xs font-mono backdrop-blur-md shadow-lg">
                       <img src="https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/discord.svg" alt="Discord" className="w-3 h-3 object-contain invert opacity-80" /> Profile Effects
                    </div>
                 </div>
              </div>

              {/* Box 2: Communities */}
              <div className="md:col-span-1 bg-[#0c0c0e] border border-white/5 rounded-[32px] overflow-hidden relative group p-8 flex flex-col justify-between shadow-2xl transition duration-500 hover:border-white/10">
                 <div className="relative z-10">
                    <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 mb-6 border border-indigo-500/20">
                       <Users className="w-5 h-5" />
                    </div>
                    <h3 className="text-xl font-black mb-2">Squad Hubs</h3>
                    <p className="text-zinc-500 text-sm">Build a centralized page for your esports org, clan, or friend group.</p>
                 </div>
                 
                 <div className="relative z-10 flex justify-start mt-6 group-hover:-translate-y-2 transition duration-500">
                     <div className="inline-flex items-center gap-3 px-4 py-3 bg-black/60 border border-white/10 rounded-2xl shadow-inner">
                         <div className="w-8 h-8 rounded-xl bg-zinc-800 overflow-hidden flex items-center justify-center shrink-0 border border-white/10 relative">
                            <img src="https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=100&auto=format&fit=crop" alt="Logo" className="w-full h-full object-cover" />
                         </div>
                         <div className="text-left flex flex-col justify-center leading-none">
                             <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Squad</span>
                             <span className="text-sm font-bold text-white font-mono">SOUR_GANG</span>
                         </div>
                     </div>
                 </div>
              </div>

              {/* Box 3: Hardware */}
              <div className="md:col-span-1 bg-[#0c0c0e] border border-white/5 rounded-[32px] overflow-hidden relative group p-8 flex flex-col justify-between shadow-2xl transition duration-500 hover:border-white/10">
                 <div className="relative z-10">
                    <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-white mb-6 border border-white/10">
                       <Cpu className="w-5 h-5" />
                    </div>
                    <h3 className="text-xl font-black mb-2">Hardware Setup</h3>
                    <p className="text-zinc-500 text-sm">Showcase your PC build, peripherals, and gaming rig.</p>
                 </div>
                 
                 <div className="relative z-10 space-y-2 mt-4 opacity-70 group-hover:opacity-100 transition">
                    <div className="bg-black/40 border border-white/5 rounded-xl p-3 flex items-center gap-3">
                       <Monitor className="w-4 h-4 text-zinc-500 shrink-0" />
                       <div className="min-w-0 flex-1"><p className="text-[9px] text-zinc-600 font-bold uppercase leading-none mb-1 tracking-widest">Monitor</p><p className="text-xs font-bold text-zinc-300 truncate font-mono">OLED G8</p></div>
                    </div>
                 </div>
              </div>

              {/* Box 4: Connections */}
              <div className="md:col-span-2 bg-[#0c0c0e] border border-white/5 rounded-[32px] overflow-hidden relative group p-8 flex flex-col sm:flex-row items-center justify-between gap-8 shadow-2xl transition duration-500 hover:border-white/10">
                 <div className="relative z-10 flex-1">
                    <div className="w-10 h-10 bg-[#1DB954]/10 rounded-xl flex items-center justify-center text-[#1DB954] mb-6 border border-[#1DB954]/20">
                       <Gamepad2 className="w-5 h-5" />
                    </div>
                    <h3 className="text-2xl font-black mb-2">Live Auto-Sync</h3>
                    <p className="text-zinc-500 text-sm max-w-sm mb-6">Connect Steam, Valorant, and Spotify to automatically display your real-time stats and status directly on your profile.</p>
                    
                    <div className="flex gap-3">
                       {["steam", "discord", "xbox", "epicgames"].map((brand) => (
                         <div key={brand} className="w-10 h-10 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center">
                            <img src={`https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/${brand}.svg`} className="w-4 h-4 invert opacity-60" />
                         </div>
                       ))}
                    </div>
                 </div>
                 
                 <div className="relative z-10 shrink-0 w-full sm:w-auto mt-6 sm:mt-0">
                    <div className="bg-black/60 border border-[#66c0f4]/30 rounded-2xl p-4 flex items-center gap-4 shadow-xl group-hover:-translate-y-2 transition duration-500">
                       <div className="w-12 h-12 bg-[#171a21] rounded-xl flex items-center justify-center border border-white/10">
                         <img src="https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/steam.svg" alt="Steam" className="w-6 h-6 invert" />
                       </div>
                       <div>
                          <p className="text-[10px] text-[#66c0f4] font-bold uppercase tracking-wider mb-1">Steam Level 38</p>
                          <p className="text-sm font-bold text-white font-mono">15,402 Hours</p>
                       </div>
                    </div>
                 </div>
              </div>

           </div>
        </div>

        {/* --- COMPACT DUAL-MARQUEE CAROUSEL (Replaces the chunky boxes) --- */}
        <div className="w-full overflow-hidden mb-24 border-y border-white/5 bg-[#050505] py-16 relative" style={{ maskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)', WebkitMaskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)' }}>
           
           <div className="text-center mb-10 relative z-30">
              <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest font-mono">Gamers already on Pulse</p>
           </div>

           <div className="flex flex-col gap-5 relative z-20">
               {/* ROW 1 (Scrolls Left) */}
               <div className="flex w-max animate-scroll gap-5 px-3">
                  {[...showcaseRow1, ...showcaseRow1, ...showcaseRow1, ...showcaseRow1].map((profile, i) => (
                     <div key={`r1-${i}`} className="w-[320px] bg-[#0a0a0c]/80 backdrop-blur-md rounded-2xl border border-white/5 p-4 flex flex-col gap-4 group hover:border-white/20 transition-all hover:-translate-y-1 shadow-lg flex-shrink-0">
                        <div className="flex items-center gap-3">
                           <div className="w-12 h-12 relative shrink-0">
                               <AvatarDecoration type={profile.deco}>
                                  <div className="w-10 h-10 rounded-full bg-[#121214] relative z-10 border border-white/10 mx-auto mt-1">
                                     <img src={profile.avatar} alt="PFP" className="rounded-full object-cover p-0.5 bg-[#0a0a0c] w-full h-full" />
                                  </div>
                               </AvatarDecoration>
                           </div>
                           <div className="min-w-0 flex-1">
                               <div className="flex items-center gap-1 font-black text-white text-base truncate">
                                  {profile.name} {profile.badges.map((b) => b)}
                               </div>
                               <p className="text-[10px] text-zinc-500 font-mono truncate">@{profile.handle}</p>
                           </div>
                        </div>
                        <div className={`w-full rounded-xl p-2.5 flex items-center gap-2.5 text-xs font-bold ${profile.bgClass} ${profile.colorClass} border ${profile.borderClass}`}>
                           {profile.statusIcon}
                           <span className="truncate">{profile.statusText}</span>
                        </div>
                     </div>
                  ))}
               </div>
               
               {/* ROW 2 (Scrolls Right) */}
               <div className="flex w-max animate-scroll-reverse gap-5 px-3">
                  {[...showcaseRow2, ...showcaseRow2, ...showcaseRow2, ...showcaseRow2].map((profile, i) => (
                     <div key={`r2-${i}`} className="w-[320px] bg-[#0a0a0c]/80 backdrop-blur-md rounded-2xl border border-white/5 p-4 flex flex-col gap-4 group hover:border-white/20 transition-all hover:-translate-y-1 shadow-lg flex-shrink-0">
                        <div className="flex items-center gap-3">
                           <div className="w-12 h-12 relative shrink-0">
                               <AvatarDecoration type={profile.deco}>
                                  <div className="w-10 h-10 rounded-full bg-[#121214] relative z-10 border border-white/10 mx-auto mt-1">
                                     <img src={profile.avatar} alt="PFP" className="rounded-full object-cover p-0.5 bg-[#0a0a0c] w-full h-full" />
                                  </div>
                               </AvatarDecoration>
                           </div>
                           <div className="min-w-0 flex-1">
                               <div className="flex items-center gap-1 font-black text-white text-base truncate">
                                  {profile.name} {profile.badges.map((b) => b)}
                               </div>
                               <p className="text-[10px] text-zinc-500 font-mono truncate">@{profile.handle}</p>
                           </div>
                        </div>
                        <div className={`w-full rounded-xl p-2.5 flex items-center gap-2.5 text-xs font-bold ${profile.bgClass} ${profile.colorClass} border ${profile.borderClass}`}>
                           {profile.statusIcon}
                           <span className="truncate">{profile.statusText}</span>
                        </div>
                     </div>
                  ))}
               </div>
           </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="w-full border-t border-white/5 bg-[#050505] py-12 z-10 relative mt-auto">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 font-bold text-lg tracking-tighter opacity-50 hover:opacity-100 transition">
             <div className="w-6 h-6 bg-white rounded-md flex items-center justify-center">
               <PulseLogo className="w-3 h-3 text-black" />
             </div>Pulse
          </div>
          
          <div className="flex gap-6 text-xs text-zinc-600 font-mono uppercase tracking-widest">
             <Link href="/terms" className="hover:text-white transition">Terms & Privacy</Link>
          </div>

          <div className="text-zinc-700 text-[10px] font-mono uppercase tracking-widest">
            &copy; {new Date().getFullYear()} Pulse. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}