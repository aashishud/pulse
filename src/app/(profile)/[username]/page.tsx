import { getSteamProfile, getRecentlyPlayed, getSteamLevel, getOwnedGamesCount, getGameProgress } from '@/lib/steam';
import { Sparkles, Gamepad2, Trophy, Clock, MapPin, Link as LinkIcon, ExternalLink, Ghost, Music, LayoutGrid, Zap } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Inter, Space_Grotesk, Press_Start_2P, Cinzel } from 'next/font/google';
import ShareButton from '@/components/ShareButton';

// Load Fonts
const inter = Inter({ subsets: ['latin'], display: 'swap' });
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], display: 'swap' });
const pressStart = Press_Start_2P({ weight: '400', subsets: ['latin'], display: 'swap' });
const cinzel = Cinzel({ subsets: ['latin'], display: 'swap' });

export const revalidate = 60; 

interface Props {
  params: Promise<{ username: string }>;
}

async function getFirebaseUser(username: string) {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${username}`;
  
  try {
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    
    const data = await res.json();
    const fields = data.fields;
    
    const isVerified = (field: any) => field?.booleanValue || false;

    const defaultLayout = [
      { mapValue: { fields: { id: { stringValue: "hero" }, enabled: { booleanValue: true } } } },
      { mapValue: { fields: { id: { stringValue: "stats" }, enabled: { booleanValue: true } } } },
      { mapValue: { fields: { id: { stringValue: "socials" }, enabled: { booleanValue: true } } } },
      { mapValue: { fields: { id: { stringValue: "library" }, enabled: { booleanValue: true } } } },
    ];

    return {
      steamId: fields.steamId?.stringValue,
      displayName: fields.displayName?.stringValue,
      banner: fields.theme?.mapValue?.fields?.banner?.stringValue || "https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=2600&auto=format&fit=crop",
      background: fields.theme?.mapValue?.fields?.background?.stringValue || "",
      avatar: fields.theme?.mapValue?.fields?.avatar?.stringValue || "",
      color: fields.theme?.mapValue?.fields?.color?.stringValue || "indigo",
      font: fields.theme?.mapValue?.fields?.font?.stringValue || "inter",
      nameEffect: fields.theme?.mapValue?.fields?.nameEffect?.stringValue || "solid",
      nameColor: fields.theme?.mapValue?.fields?.nameColor?.stringValue || "white",
      primary: fields.theme?.mapValue?.fields?.primary?.stringValue || "#1e1f22", 
      layout: fields.layout?.arrayValue?.values || defaultLayout, 
      gaming: {
        xbox: fields.gaming?.mapValue?.fields?.xbox?.stringValue,
        xbox_verified: isVerified(fields.gaming?.mapValue?.fields?.xbox_verified),
        epic: fields.gaming?.mapValue?.fields?.epic?.stringValue,
        epic_verified: isVerified(fields.gaming?.mapValue?.fields?.epic_verified),
      },
      socials: {
        discord: fields.socials?.mapValue?.fields?.discord?.stringValue,
        discord_verified: isVerified(fields.socials?.mapValue?.fields?.discord_verified),
        twitter: fields.socials?.mapValue?.fields?.twitter?.stringValue,
        twitter_verified: isVerified(fields.socials?.mapValue?.fields?.twitter_verified),
        instagram: fields.socials?.mapValue?.fields?.instagram?.stringValue,
        instagram_verified: isVerified(fields.socials?.mapValue?.fields?.instagram_verified),
      }
    };
  } catch (e) {
    console.error("Firebase Fetch Error:", e);
    return null;
  }
}

const VerifiedBadge = () => (
  <span className="inline-flex ml-1.5 text-blue-400 align-middle" title="Verified Link">
    <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
  </span>
);

export default async function ProfilePage({ params }: Props) {
  const { username } = await params;
  const firebaseUser = await getFirebaseUser(username);

  const isDev = process.env.NODE_ENV === 'development';
  const protocol = isDev ? 'http' : 'https';
  const domain = isDev ? 'localhost:3000' : (process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'pulsegg.vercel.app');
  
  const dashboardUrl = `${protocol}://${domain}/dashboard`;
  const homeUrl = `${protocol}://${domain}`;
  const signupUrl = `${protocol}://${domain}/signup?handle=${username}`;

  if (!firebaseUser) {
    return (
      <div className="min-h-screen bg-[#0a0a0c] text-white flex flex-col items-center justify-center font-sans p-4">
        <h1 className="text-4xl font-black mb-2 tracking-tight">@{username}</h1>
        <p className="text-zinc-500 mb-8">This handle is available.</p>
        <a href={signupUrl} className="bg-white text-black px-8 py-3 rounded-lg font-bold hover:bg-zinc-200 transition">Claim Handle</a>
      </div>
    );
  }

  // Fetch Steam Data
  let profile = null;
  let recentGames: any[] = [];
  let level = 0;
  let gameCount = 0;
  let heroGameProgress = null;

  if (firebaseUser.steamId) {
    [profile, recentGames, level, gameCount] = await Promise.all([
      getSteamProfile(firebaseUser.steamId),
      getRecentlyPlayed(firebaseUser.steamId),
      getSteamLevel(firebaseUser.steamId),
      getOwnedGamesCount(firebaseUser.steamId)
    ]);

    // Fetch achievements for the hero game (most recent)
    if (recentGames.length > 0) {
      heroGameProgress = await getGameProgress(firebaseUser.steamId, recentGames[0].appid);
    }
  }

  const joinDate = profile?.timecreated ? new Date(profile.timecreated * 1000) : new Date();
  const yearsOnSteam = new Date().getFullYear() - joinDate.getFullYear();
  const heroGame = recentGames[0];
  const otherGames = recentGames.slice(1);

  const avatarSource = firebaseUser.avatar || profile?.avatarfull || "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png";
  
  const backgroundStyle = firebaseUser.background 
    ? { backgroundImage: `url(${firebaseUser.background})`, filter: 'brightness(0.3)' } 
    : { backgroundImage: `url(${firebaseUser.banner})`, filter: 'blur(80px) opacity(0.4) scale(1.1)' }; 

  let fontClass = inter.className;
  if (firebaseUser.font === 'space') fontClass = spaceGrotesk.className;
  if (firebaseUser.font === 'press') fontClass = pressStart.className;
  if (firebaseUser.font === 'cinzel') fontClass = cinzel.className;

  // Name Styles
  let nameClasses = "text-3xl md:text-4xl font-black mb-1 leading-relaxed py-2";
  let nameStyle = {};

  if (firebaseUser.nameEffect === 'gradient') {
    nameClasses += ` bg-gradient-to-r ${firebaseUser.nameColor} bg-clip-text text-transparent`;
  } else if (firebaseUser.nameEffect === 'neon') {
    const colorMap: any = { "white": "#ffffff", "indigo-500": "#6366f1", "pink-500": "#ec4899", "cyan-400": "#22d3ee", "emerald-400": "#34d399", "yellow-400": "#facc15", "red-500": "#ef4444" };
    const shadowColor = colorMap[firebaseUser.nameColor] || "#ffffff";
    nameClasses += ` text-${firebaseUser.nameColor === 'white' ? 'white' : firebaseUser.nameColor}`;
    nameStyle = { textShadow: `0 0 15px ${shadowColor}` };
  } else {
    nameClasses += ` text-${firebaseUser.nameColor === 'white' ? 'white' : firebaseUser.nameColor}`;
  }

  const displayName = firebaseUser.displayName || profile?.personaname || username;

  // --- Dynamic Text Color Logic ---
  // Detect if the card background is white (or close to it)
  const isLightCard = firebaseUser.primary?.toLowerCase() === '#ffffff' || firebaseUser.primary?.toLowerCase() === 'white';
  
  // Default Dark Theme Text
  let titleColor = "text-white";
  let subtitleColor = "text-zinc-300";
  let mutedColor = "text-zinc-500";
  let iconBg = "bg-white/5";
  let hoverIconBg = "group-hover:bg-white/10";
  
  if (isLightCard) {
    // If nameColor is a solid color (not white, not gradient), use it for text
    const shouldUseNameColor = firebaseUser.nameEffect !== 'gradient' && firebaseUser.nameColor !== 'white';

    if (shouldUseNameColor) {
      // Use the username color
      titleColor = `text-${firebaseUser.nameColor}`;
      subtitleColor = `text-${firebaseUser.nameColor} opacity-80`;
      mutedColor = `text-${firebaseUser.nameColor} opacity-60`;
      iconBg = `bg-${firebaseUser.nameColor} bg-opacity-10`;
      hoverIconBg = `group-hover:bg-${firebaseUser.nameColor}/20`;
    } else {
      // Fallback: Username is white or gradient -> Force Black text on White Card
      titleColor = "text-black";
      subtitleColor = "text-zinc-700";
      mutedColor = "text-zinc-500";
      iconBg = "bg-black/5";
      hoverIconBg = "group-hover:bg-black/10";
    }
  }

  // Card Background with slight transparency
  const cardStyle = { backgroundColor: `${firebaseUser.primary}E6` };

  const renderWidget = (id: string, key: string) => {
    switch (id) {
      case 'hero':
        if (!heroGame) return null;
        return (
          // Hero widget keeps its own style (Dark Image Overlay) regardless of theme
          <div key={key} className="col-span-1 md:col-span-2 relative h-[260px] rounded-2xl overflow-hidden group border border-white/10 bg-zinc-900 shadow-xl">
             <Image 
                src={`https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${heroGame.appid}/library_hero.jpg`} 
                alt={heroGame.name}
                fill
                className="object-cover group-hover:scale-105 transition duration-700 opacity-60 group-hover:opacity-80"
                unoptimized
             />
             <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-black/40 to-transparent"></div>
             
             {/* Content - Always White Text for Hero */}
             <div className="absolute bottom-0 left-0 w-full p-6">
                <div className="flex justify-between items-end mb-2">
                   <div>
                      <div className="flex items-center gap-2 mb-1">
                         <span className="text-[10px] font-bold uppercase tracking-wider text-green-400 flex items-center gap-1">
                           <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> Recent
                         </span>
                      </div>
                      <h2 className="text-2xl md:text-3xl font-black text-white leading-tight line-clamp-1">{heroGame.name}</h2>
                      <p className="text-sm text-zinc-300 font-medium mt-1">{Math.round(heroGame.playtime_2weeks / 60 * 10) / 10} hours past 2 weeks</p>
                   </div>
                   <div className="text-right hidden sm:block">
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Total Played</p>
                      <p className="text-xl font-mono text-white">{Math.round(heroGame.playtime_forever / 60)}h</p>
                   </div>
                </div>

                {/* ACHIEVEMENT BAR */}
                {heroGameProgress !== null && (
                  <div className="mt-3">
                    <div className="flex justify-between text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                       <span>Game Completion</span>
                       <span className="text-white">{heroGameProgress}%</span>
                    </div>
                    <div className="h-2 w-full bg-black/50 rounded-full overflow-hidden border border-white/5">
                       <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-1000" style={{ width: `${heroGameProgress}%` }}></div>
                    </div>
                  </div>
                )}
             </div>
          </div>
        );

      case 'stats':
        return (
          <div key={key} style={cardStyle} className="col-span-1 backdrop-blur-md p-5 rounded-2xl border border-white/10 hover:border-white/20 transition h-full flex flex-col justify-between group min-h-[140px]">
             <div className="flex justify-between items-start">
                <div className={`p-2.5 rounded-xl ${iconBg} ${hoverIconBg} transition ${titleColor}`}><Trophy className="w-4 h-4" /></div>
                <div className="text-right">
                   <p className={`text-[10px] font-bold uppercase ${mutedColor}`}>Level</p>
                   <p className={`text-lg font-mono ${titleColor}`}>{level}</p>
                </div>
             </div>
             <div>
                <p className={`text-3xl font-black mb-0.5 ${titleColor}`}>{gameCount}</p>
                <p className={`text-[10px] font-bold uppercase tracking-widest ${mutedColor}`}>Games Owned</p>
             </div>
          </div>
        );

      case 'socials':
        const linkedCount = Object.values(firebaseUser.socials).filter(v => v).length + (firebaseUser.gaming.xbox ? 1 : 0) + (firebaseUser.gaming.epic ? 1 : 0);
        return (
          <div key={key} style={cardStyle} className="col-span-1 backdrop-blur-md p-5 rounded-2xl border border-white/10 hover:border-white/20 transition h-full min-h-[140px]">
             <div className="flex justify-between items-center mb-4">
                <h3 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${titleColor}`}><LinkIcon className="w-3 h-3" /> Connections</h3>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${iconBg} ${subtitleColor}`}>{linkedCount}</span>
             </div>
             <div className="space-y-2">
                {firebaseUser.steamId && (
                  <a href={`https://steamcommunity.com/profiles/${firebaseUser.steamId}`} target="_blank" className={`flex items-center justify-between p-1.5 rounded-lg hover:bg-black/5 transition group`}>
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded flex items-center justify-center ${isLightCard ? 'bg-black text-white' : 'bg-[#171a21] text-white'}`}><Gamepad2 className="w-3 h-3" /></div>
                      <span className={`text-xs font-medium group-hover:opacity-100 transition ${subtitleColor}`}>Steam</span>
                    </div>
                    <ExternalLink className={`w-3 h-3 ${mutedColor} group-hover:opacity-100`} />
                  </a>
                )}
                {firebaseUser.socials.discord && (
                  <div className={`flex items-center justify-between p-1.5 rounded-lg hover:bg-black/5 transition group`}>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-[#5865F2] rounded flex items-center justify-center"><span className="text-white text-[10px] font-bold">Ds</span></div>
                      <span className={`text-xs font-medium group-hover:opacity-100 transition ${subtitleColor}`}>{firebaseUser.socials.discord}</span>
                    </div>
                    {firebaseUser.socials.discord_verified && <VerifiedBadge />}
                  </div>
                )}
             </div>
          </div>
        );

      case 'library':
        return otherGames.length > 0 ? (
          <div key={key} style={cardStyle} className="col-span-1 md:col-span-1 backdrop-blur-md rounded-2xl border border-white/10 p-5 h-full overflow-hidden">
             <h3 className={`text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2 ${mutedColor}`}><LayoutGrid className="w-3 h-3" /> Library</h3>
             <div className="space-y-3">
                {otherGames.slice(0, 3).map((game: any) => (
                  <div key={game.appid} className="flex items-center gap-3 group cursor-default">
                     <div className="relative w-8 h-8 rounded-md overflow-hidden bg-zinc-800">
                        <Image 
                          src={`https://media.steampowered.com/steamcommunity/public/images/apps/${game.appid}/${game.img_icon_url}.jpg`} 
                          alt={game.name}
                          fill
                          className="object-cover grayscale group-hover:grayscale-0 transition"
                          unoptimized
                        />
                     </div>
                     <div className="flex-1 min-w-0">
                        <p className={`font-bold text-xs truncate transition ${subtitleColor} group-hover:opacity-100`}>{game.name}</p>
                        <p className={`text-[10px] font-mono ${mutedColor}`}>{Math.round(game.playtime_forever / 60)}h</p>
                     </div>
                  </div>
                ))}
             </div>
          </div>
        ) : null;
        
      default: return null;
    }
  };

  return (
    <div className={`min-h-screen bg-[#111214] text-white ${fontClass} overflow-x-hidden`}>
      
      {/* Background */}
      <div className="fixed inset-0 z-0">
         <div 
            className="absolute inset-0 bg-cover bg-center" style={backgroundStyle}
         ></div>
         <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-[#111214]/90 to-[#111214]"></div>
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto p-4 md:p-8">
        
        {/* TOP NAV */}
        <div className="flex justify-between items-center mb-8 px-2">
           <a href={homeUrl} className="flex items-center gap-2 font-bold text-xl tracking-tighter hover:opacity-80 transition">
             <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center"><Sparkles className="w-4 h-4 text-white" /></div>Pulse
           </a>
           <div className="flex items-center gap-3">
              <ShareButton />
              <a href={dashboardUrl} className="px-3 py-1.5 bg-[#1e1f22] border border-white/10 rounded-xl font-bold text-[10px] hover:bg-white hover:text-black transition flex items-center gap-2">
                 <Zap className="w-3 h-3 text-yellow-400 fill-current" /> Edit
              </a>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* PASSPORT (Left Column - Back to Sticky) */}
          <div className="lg:col-span-4 lg:sticky lg:top-8">
            <div className="bg-[#1e1f22]/80 backdrop-blur-md rounded-[32px] overflow-hidden border border-white/5 shadow-2xl relative">
              {/* Banner */}
              <div className="h-32 bg-zinc-900 relative group">
                <Image src={firebaseUser.banner} alt="Banner" fill className="object-cover group-hover:scale-105 transition duration-700" unoptimized />
              </div>
              
              <div className="px-6 pb-6 relative">
                {/* Avatar */}
                <div className="relative -mt-16 mb-4 w-32 h-32">
                   <div className="w-32 h-32 rounded-full p-1.5 bg-[#1e1f22] relative z-10">
                      <Image src={avatarSource} alt="Avatar" fill className="rounded-full object-cover bg-zinc-900" unoptimized />
                   </div>
                   {profile?.gameextrainfo && (
                     <div className="absolute bottom-2 right-2 w-6 h-6 rounded-full border-[4px] border-[#1e1f22] bg-green-500 z-20" title="Online"></div>
                   )}
                </div>

                <div className="mb-6">
                  <h1 className={nameClasses} style={nameStyle}>{displayName}</h1>
                  <p className="text-zinc-400 font-medium">@{username}</p>
                </div>

                {profile?.gameextrainfo && (
                  <div className="mb-6 p-3 bg-[#111214] rounded-xl border border-white/5 flex items-center gap-3">
                     <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400"><Gamepad2 className="w-5 h-5" /></div>
                     <div className="flex-1 min-w-0"><p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Playing now</p><p className="text-sm font-bold text-white truncate">{profile.gameextrainfo}</p></div>
                  </div>
                )}
                
                <div className="h-px bg-white/5 my-6"></div>
                
                <div className="space-y-4">
                   <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Connections</h3>
                   {firebaseUser.steamId && <div className="flex items-center justify-between group"><div className="flex items-center gap-3"><div className="w-8 h-8 bg-[#171a21] rounded flex items-center justify-center"><svg className="w-5 h-5 fill-white" viewBox="0 0 24 24"><path d="M11.979 0C5.352 0 .002 5.35.002 11.95c0 5.63 3.863 10.33 9.056 11.59-.115-.815-.04-1.637.28-2.392l.84-2.81c-.244-.765-.333-1.683-.153-2.61.547-2.66 3.102-4.32 5.714-3.715 2.613.604 4.234 3.25 3.687 5.91-.4 1.94-2.022 3.355-3.86 3.593l-.865 2.92c4.467-1.35 7.9-5.26 8.3-9.98.028-.27.042-.54.042-.814C23.956 5.35 18.605 0 11.98 0zm6.54 12.35c.78.18 1.265.98 1.085 1.776-.18.797-.97.94-1.75.76-.78-.18-1.264-.98-1.085-1.776.18-.798.97-.94 1.75-.76zm-5.46 3.7c-.035 1.54 1.06 2.87 2.53 3.11l.245-.82c-.815-.224-1.423-1.04-1.396-1.99.027-.95.7-1.706 1.543-1.83l.255-.86c-1.472.03-2.65 1.13-3.176 2.39zm-3.045 2.5c-.755.12-1.395-.385-1.43-1.127-.035-.742.53-1.413 1.285-1.532.755-.12 1.394.385 1.43 1.127.034.74-.53 1.41-1.285 1.53z"/></svg></div><div><p className="text-sm font-bold">Steam</p><p className="text-[10px] md:text-xs text-zinc-500">{level > 0 ? `Level ${level}` : 'Connected'}</p></div></div><VerifiedBadge /></div>}
                   {/* Other Socials Here... */}
                   {firebaseUser.socials.discord && <div className="flex items-center justify-between group"><div className="flex items-center gap-3"><div className="w-8 h-8 bg-[#5865F2] rounded flex items-center justify-center text-white"><svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg></div><div><p className="text-sm font-bold">Discord</p><p className="text-[10px] md:text-xs text-zinc-500">{firebaseUser.socials.discord}</p></div></div>{firebaseUser.socials.discord_verified && <VerifiedBadge />}</div>}
                   {firebaseUser.gaming.xbox && <div className="flex items-center justify-between group"><div className="flex items-center gap-3"><div className="w-8 h-8 bg-[#107C10] rounded flex items-center justify-center font-bold text-xs">X</div><div><p className="text-sm font-bold">Xbox</p><p className="text-xs text-zinc-500">{firebaseUser.gaming.xbox}</p></div></div></div>}
                   {firebaseUser.gaming.epic && <div className="flex items-center justify-between group"><div className="flex items-center gap-3"><div className="w-8 h-8 bg-[#313131] rounded flex items-center justify-center font-bold text-xs">E</div><div><p className="text-sm font-bold">Epic Games</p><p className="text-xs text-zinc-500">{firebaseUser.gaming.epic}</p></div></div></div>}
                   {firebaseUser.socials.twitter && <div className="flex items-center justify-between group"><div className="flex items-center gap-3"><div className="w-8 h-8 bg-zinc-800 rounded flex items-center justify-center"><svg className="w-3 h-3 fill-white" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg></div><div><p className="text-sm font-bold">Twitter</p><p className="text-xs text-zinc-500">{firebaseUser.socials.twitter}</p></div></div></div>}
                   {firebaseUser.socials.instagram && <div className="flex items-center justify-between group"><div className="flex items-center gap-3"><div className="w-8 h-8 bg-zinc-800 rounded flex items-center justify-center"><svg className="w-3 h-3 fill-white" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg></div><div><p className="text-sm font-bold">Instagram</p><p className="text-xs text-zinc-500">{firebaseUser.socials.instagram}</p></div></div></div>}
                </div>
              </div>
            </div>
          </div>

          {/* WIDGET BOARD (Right Column) */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex items-center gap-6 px-4">
               <button className="text-white font-bold border-b-2 border-white pb-1">Overview</button>
               <button className="text-zinc-500 font-bold hover:text-zinc-300 transition pb-1">About Me</button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {firebaseUser.layout.map((widget: any, index: number) => {
                  const id = widget.mapValue.fields.id.stringValue;
                  const enabled = widget.mapValue.fields.enabled.booleanValue;
                  return enabled ? renderWidget(id, `${id}-${index}`) : null;
               })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}