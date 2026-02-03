import { getSteamProfile, getRecentlyPlayed, getSteamLevel, getOwnedGamesCount } from '@/lib/steam';
import { Sparkles, Gamepad2, Trophy, Clock, MapPin, Link as LinkIcon, ExternalLink, Ghost, Music, LayoutGrid } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Inter, Space_Grotesk, Press_Start_2P, Cinzel } from 'next/font/google';

// Load Fonts with display swap for faster initial render
const inter = Inter({ subsets: ['latin'], display: 'swap' });
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], display: 'swap' });
const pressStart = Press_Start_2P({ weight: '400', subsets: ['latin'], display: 'swap' });
const cinzel = Cinzel({ subsets: ['latin'], display: 'swap' });

// Cache Control: Revalidate every 60 seconds
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

  if (firebaseUser.steamId) {
    [profile, recentGames, level, gameCount] = await Promise.all([
      getSteamProfile(firebaseUser.steamId),
      getRecentlyPlayed(firebaseUser.steamId),
      getSteamLevel(firebaseUser.steamId),
      getOwnedGamesCount(firebaseUser.steamId)
    ]);
  }

  // Data Calc
  const joinDate = profile?.timecreated ? new Date(profile.timecreated * 1000) : new Date();
  const yearsOnSteam = new Date().getFullYear() - joinDate.getFullYear();
  const heroGame = recentGames[0];
  const otherGames = recentGames.slice(1);

  // Styles
  const avatarSource = firebaseUser.avatar || profile?.avatarfull || "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png";
  const backgroundStyle = firebaseUser.background 
    ? { backgroundImage: `url(${firebaseUser.background})`, filter: 'brightness(0.2)' } 
    : { backgroundImage: `url(${firebaseUser.banner})`, filter: 'blur(100px) opacity(0.2)' }; 

  let fontClass = inter.className;
  if (firebaseUser.font === 'space') fontClass = spaceGrotesk.className;
  if (firebaseUser.font === 'press') fontClass = pressStart.className;
  if (firebaseUser.font === 'cinzel') fontClass = cinzel.className;

  // FIX 1: Relaxed leading AND vertical padding to prevent glyph clipping
  let nameClasses = "text-3xl md:text-4xl font-black mb-1 leading-relaxed py-2";
  let nameStyle = {};

  if (firebaseUser.nameEffect === 'gradient') {
    nameClasses += ` bg-gradient-to-r ${firebaseUser.nameColor} bg-clip-text text-transparent`;
  } else if (firebaseUser.nameEffect === 'neon') {
    const colorMap: any = { "white": "#ffffff", "indigo-500": "#6366f1", "pink-500": "#ec4899", "cyan-400": "#22d3ee", "emerald-400": "#34d399", "yellow-400": "#facc15", "red-500": "#ef4444" };
    const shadowColor = colorMap[firebaseUser.nameColor] || "#ffffff";
    nameClasses += ` text-${firebaseUser.nameColor === 'white' ? 'white' : firebaseUser.nameColor}`;
    nameStyle = { textShadow: `0 0 10px ${shadowColor}, 0 0 20px ${shadowColor}` };
  } else {
    nameClasses += ` text-${firebaseUser.nameColor === 'white' ? 'white' : firebaseUser.nameColor}`;
  }

  const displayName = firebaseUser.displayName || profile?.personaname || username;

  // Widget Renderer
  const renderWidget = (id: string, key: string) => {
    switch (id) {
      case 'hero':
        if (!heroGame) return null;
        return (
          <div key={key} className="col-span-1 md:col-span-2 row-span-2 relative h-[220px] md:h-full rounded-2xl overflow-hidden group border border-white/10 bg-zinc-900">
             <Image 
                src={`https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${heroGame.appid}/library_hero.jpg`} 
                alt={heroGame.name}
                fill
                className="object-cover group-hover:scale-105 transition duration-700 opacity-60 group-hover:opacity-80"
                unoptimized
             />
             <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>
             <div className="absolute bottom-0 left-0 w-full p-5 md:p-6">
                <div className="flex items-center gap-2 mb-1">
                   <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                   <span className="text-[10px] font-bold uppercase tracking-wider text-green-400">Recent Activity</span>
                </div>
                <h2 className="text-xl md:text-3xl font-black text-white mb-1 line-clamp-1">{heroGame.name}</h2>
                <div className="flex items-center gap-3 text-xs md:text-sm font-medium text-zinc-300">
                   <span>{Math.round(heroGame.playtime_2weeks / 60 * 10) / 10}h past 2w</span>
                   <span className="w-1 h-1 bg-zinc-600 rounded-full"></span>
                   <span>{Math.round(heroGame.playtime_forever / 60)}h total</span>
                </div>
             </div>
          </div>
        );

      case 'stats':
        return (
          <div key={key} className="col-span-1 bg-black/40 backdrop-blur-md p-5 rounded-2xl border border-white/10 hover:border-white/20 transition h-full flex flex-col justify-between group min-h-[140px]">
             <div className="flex justify-between items-start">
                <div className="p-2.5 bg-white/5 rounded-xl text-white group-hover:bg-white/10 transition"><Trophy className="w-4 h-4" /></div>
                <div className="text-right">
                   <p className="text-[10px] font-bold text-zinc-500 uppercase">Level</p>
                   <p className="text-lg font-mono text-white">{level}</p>
                </div>
             </div>
             <div>
                <p className="text-3xl font-black text-white mb-0.5">{gameCount}</p>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Games Owned</p>
             </div>
          </div>
        );

      case 'socials':
        const linkedCount = Object.values(firebaseUser.socials).filter(v => v).length + (firebaseUser.gaming.xbox ? 1 : 0) + (firebaseUser.gaming.epic ? 1 : 0);
        return (
          <div key={key} className="col-span-1 bg-black/40 backdrop-blur-md p-5 rounded-2xl border border-white/10 hover:border-white/20 transition h-full min-h-[140px]">
             <div className="flex justify-between items-center mb-4">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2"><LinkIcon className="w-3 h-3" /> Connections</h3>
                <span className="bg-white/10 px-1.5 py-0.5 rounded text-[10px] font-mono text-zinc-400">{linkedCount}</span>
             </div>
             <div className="space-y-2">
                {firebaseUser.steamId && (
                  <a href={`https://steamcommunity.com/profiles/${firebaseUser.steamId}`} target="_blank" className="flex items-center justify-between p-1.5 rounded-lg hover:bg-white/5 transition group">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-[#171a21] rounded flex items-center justify-center"><Gamepad2 className="w-3 h-3 text-white" /></div>
                      <span className="text-xs font-medium text-zinc-300 group-hover:text-white">Steam</span>
                    </div>
                    <ExternalLink className="w-3 h-3 text-zinc-600 group-hover:text-white" />
                  </a>
                )}
                {firebaseUser.socials.discord && (
                  <div className="flex items-center justify-between p-1.5 rounded-lg hover:bg-white/5 transition group">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-[#5865F2] rounded flex items-center justify-center"><span className="text-white text-[10px] font-bold">Ds</span></div>
                      <span className="text-xs font-medium text-zinc-300 group-hover:text-white">{firebaseUser.socials.discord}</span>
                    </div>
                    {firebaseUser.socials.discord_verified && <VerifiedBadge />}
                  </div>
                )}
             </div>
          </div>
        );

      case 'library':
        return otherGames.length > 0 ? (
          <div key={key} className="col-span-1 md:col-span-1 bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 p-5 h-full overflow-hidden">
             <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-2"><LayoutGrid className="w-3 h-3" /> Library</h3>
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
                        <p className="font-bold text-xs text-zinc-300 group-hover:text-white truncate transition">{game.name}</p>
                        <p className="text-[10px] text-zinc-600 font-mono">{Math.round(game.playtime_forever / 60)}h</p>
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
    <div className={`min-h-screen bg-black text-white ${fontClass} overflow-x-hidden`}>
      
      {/* Background */}
      <div className="fixed inset-0 z-0">
         <div 
            className="absolute inset-0 bg-cover bg-center" style={backgroundStyle}
         ></div>
         <div className="absolute inset-0 bg-black/80 backdrop-blur-3xl"></div>
         <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent,black)]"></div>
      </div>

      <div className="relative z-10">
        
        {/* HEADER */}
        <div className="w-full h-[180px] md:h-[240px] relative group overflow-hidden">
           {firebaseUser.banner && (
             <Image 
               src={firebaseUser.banner} 
               alt="Banner" 
               fill
               className="object-cover opacity-80 group-hover:scale-105 transition duration-1000"
               priority
               unoptimized
             />
           )}
           <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>
           
           <div className="absolute top-0 left-0 w-full p-4 md:p-6 flex justify-between items-center">
              <a href={homeUrl} className="flex items-center gap-2 font-bold text-lg tracking-tighter opacity-80 hover:opacity-100 transition">
                <div className="w-6 h-6 bg-white text-black rounded flex items-center justify-center"><Sparkles className="w-3 h-3" /></div>Pulse
              </a>
              <a href={dashboardUrl} className="px-3 py-1.5 bg-black/50 backdrop-blur-md border border-white/10 rounded-full font-bold text-[10px] hover:bg-white hover:text-black transition">
                 Edit Profile
              </a>
           </div>
        </div>

        {/* FIX 2: Added 'relative z-20' to ensure text sits ABOVE the banner's overflow area */}
        <div className="max-w-5xl mx-auto px-6 -mt-12 md:-mt-16 flex flex-col md:flex-row items-end md:items-end gap-6 mb-8 relative z-20">
           <div className="relative">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-3xl p-1 bg-black overflow-hidden relative shadow-2xl shadow-indigo-500/10">
                 <Image 
                   src={avatarSource} 
                   alt="Avatar" 
                   fill
                   className="rounded-2xl object-cover bg-zinc-900"
                   priority
                   unoptimized
                 />
              </div>
              {profile?.gameextrainfo && (
                 <div className="absolute -bottom-2 -right-2 bg-green-500 text-black text-[9px] font-bold px-1.5 py-0.5 rounded-full border-2 border-black animate-bounce">
                    ONLINE
                 </div>
              )}
           </div>
           
           <div className="flex-1 pb-1">
              <h1 className={nameClasses} style={nameStyle}>{displayName}</h1>
              <div className="flex flex-wrap items-center gap-4 text-xs md:text-sm text-zinc-400 font-medium">
                 <span className="text-zinc-500">@{username}</span>
                 {profile?.loccountrycode && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {profile.loccountrycode}</span>}
                 <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {yearsOnSteam}y</span>
              </div>
           </div>

           <div className="flex gap-2 pb-1">
              {firebaseUser.gaming.xbox && <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-white/5 flex items-center justify-center text-zinc-400 hover:text-[#107C10] hover:border-[#107C10]/50 transition"><div className="font-bold text-[10px]">X</div></div>}
              {firebaseUser.gaming.epic && <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-white/5 flex items-center justify-center text-zinc-400 hover:text-white hover:border-white transition"><div className="font-bold text-[10px]">E</div></div>}
              {firebaseUser.socials.twitter && <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-white/5 flex items-center justify-center text-zinc-400 hover:text-blue-400 hover:border-blue-400/50 transition"><svg className="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg></div>}
           </div>
        </div>

        <div className="max-w-5xl mx-auto px-6 pb-20">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-[minmax(160px,auto)]">
              {firebaseUser.layout.map((widget: any, index: number) => {
                  const id = widget.mapValue.fields.id.stringValue;
                  const enabled = widget.mapValue.fields.enabled.booleanValue;
                  return enabled ? renderWidget(id, `${id}-${index}`) : null;
              })}
           </div>
        </div>

      </div>
    </div>
  );
}