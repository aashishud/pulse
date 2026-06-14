"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Sparkles, Gamepad2, Palette, Music, Users, Cpu, Monitor, LayoutDashboard, BadgeCheck, Diamond, Crown, Terminal } from "lucide-react";
import Image from "next/image";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import AvatarDecoration from "@/components/AvatarDecoration";
import PulseLogo from "@/components/PulseLogo";
import BackgroundShader from "@/components/BackgroundShader";
import Navbar from "@/components/Navbar";

// The username that acts as the default "Showcase" profile for logged-out users
const SHOWCASE_USERNAME = "sour";

export default function LandingPageClient() {
  const [username, setUsername] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [previewUser, setPreviewUser] = useState<any>(null); // State for live profile preview
  const [mockSpotify, setMockSpotify] = useState<{ title: string; artist: string; albumArt: string; isPlaying: boolean } | null>(null); // State for live music
  const [authLoading, setAuthLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);
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
               setHasProfile(true);
            } else {
               setHasProfile(false);
            }
         } catch (e) {
            console.error("Failed to fetch preview user", e);
            setHasProfile(false);
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
  const mockBanner = previewUser?.theme?.background || previewUser?.theme?.banner || "https://images.unsplash.com/photo-1614624532983-4ce03382d63d?q=80&w=800&auto=format&fit=crop";
  const mockScale = previewUser?.theme?.background ? (previewUser?.theme?.bgZoom || 100) / 100 : (previewUser?.theme?.bannerZoom || 100) / 100;
  const mockDecoration = previewUser?.theme?.avatarDecoration || "electric_god";
  const mockDiscordDeco = previewUser?.theme?.discordDecoration || "";
  const mockPrimaryColor = previewUser?.theme?.primary || "#6366f1"; 
  
  // Dynamic Connections
  const hasVerified = previewUser ? previewUser.isVerified : true;
  const hasDiscord = previewUser ? !!previewUser.socials?.discord_verified : true;
  const hasSteam = previewUser ? !!previewUser.steamId : true;
  const hasTwitter = previewUser ? !!previewUser.socials?.twitter : true;

  return (
    <div className="min-h-screen bg-[#07070a] text-white selection:bg-indigo-500/30 font-sans flex flex-col overflow-x-hidden relative">
      
      {/* --- MAGIC CSS ELEMENTS --- */}
      <style jsx global>{`
        @keyframes scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .animate-scroll { animation: scroll 40s linear infinite; }
        .animate-scroll:hover { animation-play-state: paused; }

        @keyframes scroll-reverse { 0% { transform: translateX(-50%); } 100% { transform: translateX(0); } }
        .animate-scroll-reverse { animation: scroll-reverse 40s linear infinite; }
        .animate-scroll-reverse:hover { animation-play-state: paused; }
        
        @keyframes float {
          0% { transform: translateY(0px) rotateY(-5deg) rotateX(2deg); }
          50% { transform: translateY(-15px) rotateY(-2deg) rotateX(4deg); }
          100% { transform: translateY(0px) rotateY(-5deg) rotateX(2deg); }
        }
        .animate-float-3d { animation: float 10s ease-in-out infinite; transform-style: preserve-3d; }
        
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob { animation: blob 15s infinite alternate; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
      `}</style>

      {/* --- SOFT BACKGROUND AMBIENCE --- */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
         {/* Soft dark base */}
         <div className="absolute inset-0 bg-[#07070a]"></div>
         
         {/* Animated Glowing Blobs */}
         <div className="absolute top-0 -left-4 w-96 h-96 bg-indigo-500/20 rounded-full mix-blend-screen filter blur-[100px] opacity-70 animate-blob"></div>
         <div className="absolute top-0 -right-4 w-96 h-96 bg-purple-500/20 rounded-full mix-blend-screen filter blur-[100px] opacity-70 animate-blob animation-delay-2000"></div>
         <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-500/20 rounded-full mix-blend-screen filter blur-[100px] opacity-70 animate-blob animation-delay-4000"></div>
         
         {/* Grain overlay for texture */}
         <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay" style={{ backgroundImage: 'url("https://upload.wikimedia.org/wikipedia/commons/7/76/1k_Dissolve_Noise_Texture.png")' }}></div>
      </div>

      {/* --- FLOATING NAVBAR --- */}
      <Navbar />

      {/* --- HERO SPLIT SECTION --- */}
      <main className="flex-1 z-10 relative">
        <div className="max-w-7xl mx-auto px-6 pt-12 pb-24 lg:pt-24 lg:pb-32 flex flex-col lg:flex-row items-center justify-between gap-16 lg:gap-8">
          
          {/* LEFT: Copy & Input (Brutalist, Confident) */}
          <div className="flex-1 text-left w-full max-w-2xl lg:max-w-none mx-auto lg:mx-0">

             <h1 className="text-5xl sm:text-6xl lg:text-[5rem] font-bold tracking-tight leading-[1.05] mb-6 drop-shadow-2xl">
                Your gaming <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-pink-400">
                  identity
                </span><br />
                made beautiful.
             </h1>
             
             <p className="text-lg text-zinc-300 max-w-lg mb-10 leading-relaxed font-medium">
                Stop pasting messy links. Everything you play, listen to, and create in one beautifully soft space. Build a gaming profile that feels like you.
             </p>

             <div className={`w-full max-w-md transition-opacity duration-500 ${authLoading ? 'opacity-0' : 'opacity-100'}`}>
               {currentUser && hasProfile ? (
                 <button onClick={() => router.push('/dashboard')} className="w-full bg-white text-black rounded-2xl flex items-center justify-center p-5 font-black text-lg gap-3 hover:bg-zinc-200 transition shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:scale-[1.02]">
                    Enter Dashboard <ArrowRight className="w-5 h-5" />
                 </button>
               ) : currentUser && !hasProfile ? (
                 <div className="space-y-3">
                    <button onClick={() => router.push('/signup')} className="w-full bg-indigo-600 text-white rounded-2xl flex items-center justify-center p-5 font-black text-lg gap-3 hover:bg-indigo-500 transition shadow-[0_0_30px_rgba(99,102,241,0.3)] hover:scale-[1.02]">
                       Complete Profile Setup <ArrowRight className="w-5 h-5" />
                    </button>
                    <button onClick={() => signOut(auth)} className="w-full text-zinc-500 hover:text-red-400 text-sm font-bold transition py-2">
                       Sign out and start over
                    </button>
                 </div>
               ) : (
                 <form onSubmit={handleClaim} className="relative group">
                   <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full blur opacity-25 group-hover:opacity-40 transition duration-500"></div>
                   <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-full flex items-center p-2 pl-5 focus-within:border-indigo-400/50 transition shadow-2xl">
                     <span className="text-zinc-400 font-medium text-sm sm:text-base select-none">pulse.gg/</span>
                     <input 
                       type="text" 
                       placeholder="username"
                       className="flex-1 bg-transparent border-none outline-none text-white font-medium text-sm sm:text-base p-2 w-full min-w-0 placeholder-zinc-500"
                       value={username}
                       onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9-_]/g, ''))} 
                     />
                     <button 
                       type="submit"
                       disabled={username.length < 3}
                       className="bg-white text-black px-6 py-3 rounded-full font-bold hover:bg-zinc-200 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg hover:scale-105"
                     >
                       Claim <ArrowRight className="w-4 h-4" />
                     </button>
                   </div>
                 </form>
               )}
             </div>
          </div>

          {/* RIGHT: Floating 3D Profile Mockup (Powered by real user data!) */}
          <div className="flex-1 w-full relative perspective-[2000px] hidden md:block z-20">
             <div className="w-full max-w-[400px] mx-auto animate-float-3d">
                {/* Ultra-Soft Glass Card Base */}
                <div className="bg-white/5 backdrop-blur-3xl border border-white/20 rounded-[40px] p-6 shadow-[0_30px_60px_rgba(0,0,0,0.4)] relative overflow-hidden group">
                   
                   {/* Shine effect */}
                   <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition duration-700 pointer-events-none"></div>

                   {/* Dynamic Mock Banner */}
                   <div className="absolute top-0 left-0 w-full h-32 opacity-40 overflow-hidden rounded-t-[40px]">
                      <img src={mockBanner} alt="Banner" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" style={{ transform: `scale(${mockScale})` }} />
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#07070a]"></div>
                   </div>

                   {/* Dynamic Mock Avatar with Aura & Lottie */}
                   <div className="relative pt-12 flex justify-center mb-4">
                      {/* Aura dynamically uses their primary color */}
                      <div className="absolute inset-0 top-12 w-32 h-32 mx-auto rounded-full blur-2xl opacity-40 animate-pulse pointer-events-none" style={{ backgroundColor: mockPrimaryColor }}></div>
                      
                      <div className="w-28 h-28 relative transition-transform duration-500 group-hover:scale-105">
                         <AvatarDecoration type={mockDecoration}>
                            <div className="w-24 h-24 rounded-full bg-[#121214] relative z-10 border border-white/20 mx-auto mt-2 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                               <img src={mockAvatar} alt="Avatar" className="rounded-full object-cover p-1 w-full h-full" />
                               {mockDiscordDeco && (
                                  <img src={mockDiscordDeco} alt="Decoration" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] max-w-none z-30 pointer-events-none object-contain scale-[1.2]" />
                               )}
                            </div>
                         </AvatarDecoration>
                      </div>
                   </div>

                   {/* Dynamic Mock Identity */}
                   <div className="text-center relative z-10">
                      <h2 className="text-3xl font-bold text-white tracking-tight flex items-center justify-center gap-2 mb-1">
                         {mockName} 
                         {(hasVerified || mockHandle === 'sour') && (
                           <div className="flex items-center gap-1.5 bg-white/10 px-2 py-0.5 rounded-full border border-white/10 shadow-sm">
                             <BadgeCheck className="w-3.5 h-3.5 text-blue-400" />
                             {mockHandle === 'sour' && <Crown className="w-3.5 h-3.5 text-yellow-400" />}
                           </div>
                         )}
                      </h2>
                      <p className="text-sm font-medium text-zinc-400 mb-6">@{mockHandle}</p>
                      
                      {/* Socials Mock */}
                      <div className="flex justify-center gap-3 mb-6">
                         {hasDiscord && (
                           <div className="w-12 h-12 rounded-[16px] bg-white/5 border border-white/10 flex items-center justify-center shadow-lg hover:bg-white/10 transition">
                              <img src="https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/discord.svg" className="w-5 h-5 invert opacity-90" />
                           </div>
                         )}
                         {hasSteam && (
                           <div className="w-12 h-12 rounded-[16px] bg-white/5 border border-white/10 flex items-center justify-center shadow-lg hover:bg-white/10 transition">
                              <img src="https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/steam.svg" className="w-5 h-5 invert opacity-90" />
                           </div>
                         )}
                         {hasTwitter && (
                           <div className="w-12 h-12 rounded-[16px] bg-white/5 border border-white/10 flex items-center justify-center shadow-lg hover:bg-white/10 transition">
                              <img src="https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/x.svg" className="w-5 h-5 invert opacity-90" />
                           </div>
                         )}
                      </div>

                      {/* Spotify Mock Widget (Now Live!) */}
                      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-[24px] p-3 flex items-center gap-4 text-left w-full shadow-lg hover:bg-white/10 transition duration-300">
                         <div className="w-12 h-12 bg-zinc-800 rounded-[14px] overflow-hidden shrink-0 relative shadow-md">
                            <img src={mockSpotify?.albumArt || "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=200&auto=format&fit=crop"} alt="Album" className="w-full h-full object-cover" />
                         </div>
                         <div className="flex-1 min-w-0">
                            <p className="text-[10px] text-green-400 font-bold uppercase tracking-widest mb-0.5 flex items-center gap-1.5">
                               <Music className="w-3 h-3"/> {mockSpotify?.isPlaying ? "Listening on Spotify" : "Top Track"}
                            </p>
                            <p className="text-sm font-bold truncate text-white">{mockSpotify?.title || "Cyberpunk Vibes"}</p>
                            {mockSpotify?.artist && <p className="text-xs text-zinc-400 truncate mt-0.5">{mockSpotify.artist}</p>}
                         </div>
                         <div className="flex items-end gap-1 h-4 px-2 shrink-0">
                            <span className="w-1.5 bg-green-400 rounded-full animate-pulse h-full"></span>
                            <span className="w-1.5 bg-green-400 rounded-full animate-pulse h-2/3" style={{ animationDelay: '200ms' }}></span>
                            <span className="w-1.5 bg-green-400 rounded-full animate-pulse h-4/5" style={{ animationDelay: '400ms' }}></span>
                         </div>
                      </div>

                   </div>
                </div>
             </div>
          </div>
        </div>

        {/* --- Z-PATTERN FEATURE SECTIONS --- */}
        <div className="w-full relative z-20 mb-40 overflow-hidden py-24">
           {/* Huge ambient background glows for the whole section */}
           <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-500/10 blur-[150px] rounded-full pointer-events-none"></div>
           <div className="absolute top-1/3 left-0 w-[600px] h-[600px] bg-purple-500/10 blur-[150px] rounded-full pointer-events-none"></div>
           <div className="absolute bottom-0 right-1/4 w-[700px] h-[700px] bg-[#1DB954]/10 blur-[150px] rounded-full pointer-events-none"></div>

           <div className="max-w-7xl mx-auto px-6 w-full space-y-40">
              
              {/* Feature 1: Aesthetics (Visuals Left, Text Right) */}
              <div className="flex flex-col-reverse lg:flex-row items-center justify-between gap-16 lg:gap-24 relative">
                 
                 {/* Visuals (Left) */}
                 <div className="flex-1 w-full relative h-[400px] md:h-[500px]">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-white/5 blur-3xl rounded-full mix-blend-screen pointer-events-none"></div>
                    
                    {/* Floating UI Elements */}
                    <div className="absolute top-[10%] left-[10%] w-64 h-auto bg-white/5 backdrop-blur-2xl border border-white/20 rounded-[32px] p-6 shadow-[0_20px_40px_rgba(0,0,0,0.3)] animate-float-3d" style={{ animationDelay: '0s' }}>
                       <div className="w-12 h-12 bg-white/10 rounded-[16px] flex items-center justify-center mb-4">
                          <Palette className="w-6 h-6 text-indigo-300" />
                       </div>
                       <div className="h-4 w-3/4 bg-white/10 rounded-full mb-3"></div>
                       <div className="h-3 w-1/2 bg-white/5 rounded-full mb-6"></div>
                       <div className="flex gap-2">
                          <div className="w-6 h-6 rounded-full bg-pink-500/50"></div>
                          <div className="w-6 h-6 rounded-full bg-purple-500/50"></div>
                          <div className="w-6 h-6 rounded-full bg-indigo-500/50"></div>
                       </div>
                    </div>

                    <div className="absolute bottom-[10%] right-[10%] w-72 h-auto bg-[#0a0a0c]/60 backdrop-blur-3xl border border-white/10 rounded-full p-4 flex items-center gap-4 shadow-[0_30px_60px_rgba(0,0,0,0.5)] animate-float-3d" style={{ animationDelay: '1s' }}>
                       <div className="w-14 h-14 bg-gradient-to-tr from-yellow-500 to-orange-500 rounded-full p-0.5 flex items-center justify-center shrink-0">
                          <Sparkles className="w-6 h-6 text-white" />
                       </div>
                       <div>
                          <p className="text-white font-bold">Luminous Badge</p>
                          <p className="text-zinc-400 text-xs font-medium">Equipped</p>
                       </div>
                    </div>

                    <div className="absolute top-[40%] right-[5%] w-16 h-16 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl flex items-center justify-center shadow-xl animate-float-3d" style={{ animationDelay: '2.5s' }}>
                       <img src="https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/discord.svg" alt="Discord" className="w-8 h-8 invert opacity-80" />
                    </div>
                 </div>

                 {/* Text (Right) */}
                 <div className="flex-1 w-full text-left relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-widest mb-6">
                       <Palette className="w-3.5 h-3.5" /> Aesthetics
                    </div>
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">Absolute freedom over your space.</h2>
                    <p className="text-lg md:text-xl text-zinc-400 font-medium leading-relaxed mb-8">
                       Express yourself without constraints. Layer frosted glass, vibrant gradients, and dynamic glowing effects to create a profile that perfectly captures your vibe.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4">
                       <div className="flex items-center gap-3 text-white font-medium"><BadgeCheck className="w-5 h-5 text-indigo-400"/> Custom Cursors</div>
                       <div className="flex items-center gap-3 text-white font-medium"><BadgeCheck className="w-5 h-5 text-indigo-400"/> Video Backgrounds</div>
                    </div>
                 </div>

              </div>


              {/* Feature 2: Squad Hubs (Text Left, Visuals Right) */}
              <div className="flex flex-col lg:flex-row items-center justify-between gap-16 lg:gap-24 relative">
                 
                 {/* Text (Left) */}
                 <div className="flex-1 w-full text-left order-2 lg:order-1 relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-bold uppercase tracking-widest mb-6">
                       <Users className="w-3.5 h-3.5" /> Communities
                    </div>
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">Your squad, centralized.</h2>
                    <p className="text-lg md:text-xl text-zinc-400 font-medium leading-relaxed mb-8">
                       Stop scattering your members across different platforms. Build a beautiful, unified roster for your esports org, clan, or friend group with dedicated team pages.
                    </p>
                    <div className="flex items-center gap-4 text-sm font-bold text-white">
                       <div className="flex -space-x-4">
                          <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop" className="w-10 h-10 rounded-full border-2 border-[#07070a]"/>
                          <img src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop" className="w-10 h-10 rounded-full border-2 border-[#07070a]"/>
                          <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop" className="w-10 h-10 rounded-full border-2 border-[#07070a]"/>
                       </div>
                       Join thousands of squads.
                    </div>
                 </div>

                 {/* Visuals (Right) */}
                 <div className="flex-1 w-full relative h-[400px] md:h-[500px] order-1 lg:order-2">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-purple-500/20 blur-[120px] rounded-full pointer-events-none"></div>
                    
                    {/* Squad Hub UI Mock */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-[#0a0a0e]/80 backdrop-blur-3xl border border-white/10 rounded-[40px] p-8 shadow-[0_40px_80px_rgba(0,0,0,0.5)] animate-float-3d">
                       <div className="flex items-center gap-6 mb-8">
                          <div className="w-20 h-20 rounded-[24px] bg-white/10 overflow-hidden shadow-lg border border-white/20">
                             <img src="https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=200&auto=format&fit=crop" alt="Squad Logo" className="w-full h-full object-cover" />
                          </div>
                          <div>
                             <h3 className="text-2xl font-bold text-white mb-1">SOUR_GANG</h3>
                             <p className="text-zinc-400 text-sm font-medium">14 Members • Established 2026</p>
                          </div>
                       </div>
                       
                       <div className="space-y-3">
                          {[
                             { name: "Sour", role: "Founder", color: "text-red-400", bg: "bg-red-400/10", border: "border-red-400/20" },
                             { name: "Phantom", role: "Co-Leader", color: "text-purple-400", bg: "bg-purple-400/10", border: "border-purple-400/20" },
                             { name: "Zero", role: "Member", color: "text-zinc-400", bg: "bg-zinc-400/10", border: "border-zinc-400/20" }
                          ].map((member, i) => (
                             <div key={i} className="bg-white/5 border border-white/10 rounded-[20px] p-4 flex items-center justify-between hover:bg-white/10 transition cursor-pointer">
                                <div className="flex items-center gap-3">
                                   <div className="w-10 h-10 rounded-full bg-zinc-800 border border-white/10"></div>
                                   <span className="text-white font-bold">{member.name}</span>
                                </div>
                                <div className={`px-3 py-1 rounded-full text-xs font-bold ${member.color} ${member.bg} border ${member.border}`}>
                                   {member.role}
                                </div>
                             </div>
                          ))}
                       </div>
                    </div>
                 </div>

              </div>

              {/* Feature 3: Live Auto-Sync (Visuals Left, Text Right) */}
              <div className="flex flex-col-reverse lg:flex-row items-center justify-between gap-16 lg:gap-24 relative">
                 
                 {/* Visuals (Left) */}
                 <div className="flex-1 w-full relative h-[400px] md:h-[500px]">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[#1DB954]/10 blur-[100px] rounded-full pointer-events-none"></div>
                    
                    {/* Center Node */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-white/10 backdrop-blur-3xl border border-white/20 rounded-[24px] shadow-2xl flex items-center justify-center z-20">
                       <PulseLogo className="w-10 h-10 text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]" />
                    </div>

                    {/* Orbiting/Connecting Nodes */}
                    <div className="absolute top-[20%] left-[20%] w-20 h-20 bg-[#0a0a0c]/60 backdrop-blur-xl border border-white/10 rounded-[20px] p-4 shadow-xl flex items-center justify-center animate-float-3d" style={{ animationDelay: '0s' }}>
                       <img src="https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/steam.svg" alt="Steam" className="w-full h-full invert opacity-90" />
                    </div>

                    <div className="absolute bottom-[20%] left-[30%] w-20 h-20 bg-[#0a0a0c]/60 backdrop-blur-xl border border-white/10 rounded-[20px] p-4 shadow-xl flex items-center justify-center animate-float-3d" style={{ animationDelay: '1.5s' }}>
                       <img src="https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/discord.svg" alt="Discord" className="w-full h-full invert opacity-90" />
                    </div>

                    <div className="absolute top-[30%] right-[10%] w-52 h-auto bg-[#0a0a0c]/60 backdrop-blur-xl border border-[#1DB954]/30 rounded-[24px] p-4 shadow-xl flex items-center gap-4 animate-float-3d" style={{ animationDelay: '3s' }}>
                       <div className="w-12 h-12 bg-zinc-800 rounded-xl overflow-hidden shrink-0"><img src="https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=100&h=100&fit=crop" className="w-full h-full object-cover"/></div>
                       <div className="min-w-0">
                          <p className="text-[10px] text-[#1DB954] font-bold uppercase tracking-widest flex items-center gap-1.5"><Music className="w-3 h-3"/> Spotify</p>
                          <p className="text-white text-sm font-bold truncate">Listening now</p>
                       </div>
                    </div>
                 </div>

                 {/* Text (Right) */}
                 <div className="flex-1 w-full text-left relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold uppercase tracking-widest mb-6">
                       <Gamepad2 className="w-3.5 h-3.5" /> Integrations
                    </div>
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">Always in sync.</h2>
                    <p className="text-lg md:text-xl text-zinc-400 font-medium leading-relaxed mb-8">
                       Connect your accounts once and let Pulse do the rest. Your Steam hours, Spotify tracks, and Discord status are magically synced and displayed in real-time.
                    </p>
                    <button className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-6 py-3 rounded-full font-bold transition flex items-center gap-2 w-fit">
                       Explore Integrations <ArrowRight className="w-4 h-4" />
                    </button>
                 </div>

              </div>

           </div>
        </div>

        {/* --- FINAL CTA --- */}
        <div className="w-full relative py-32 flex justify-center overflow-hidden">
           {/* Soft glow behind CTA */}
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none"></div>
           
           <div className="max-w-3xl px-6 w-full text-center relative z-20">
              <h2 className="text-4xl md:text-5xl lg:text-7xl font-bold tracking-tight mb-6">
                 Ready to build <br className="hidden md:block" /> your space?
              </h2>
              <p className="text-lg text-zinc-400 font-medium mb-10 max-w-xl mx-auto">
                 Claim your handle today and join the next generation of gamers building their identity on Pulse.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                 <Link href="/signup" className="w-full sm:w-auto bg-white text-black px-8 py-4 rounded-full font-bold text-lg hover:scale-105 transition shadow-[0_0_30px_rgba(255,255,255,0.15)] hover:shadow-[0_0_40px_rgba(255,255,255,0.3)]">
                    Claim your link
                 </Link>
                 <Link href="/login" className="w-full sm:w-auto px-8 py-4 rounded-full font-bold text-lg text-white/70 hover:text-white hover:bg-white/5 transition border border-transparent hover:border-white/10">
                    Log in
                 </Link>
              </div>
           </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="w-full border-t border-white/5 bg-transparent py-12 z-10 relative mt-auto">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 font-bold text-lg tracking-tight opacity-50 hover:opacity-100 transition duration-300">
             <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
               <PulseLogo className="w-3 h-3 text-black" />
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