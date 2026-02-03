import { getSteamProfile, getRecentlyPlayed, getSteamLevel, getOwnedGamesCount } from '@/lib/steam';
import { Sparkles, Gamepad2, Trophy, Clock, MapPin, Link as LinkIcon, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface Props {
  params: Promise<{ username: string }>;
}

async function getFirebaseUser(username: string) {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${username}`;
  
  try {
    const res = await fetch(url, { next: { revalidate: 0 } });
    if (!res.ok) return null;
    
    const data = await res.json();
    const fields = data.fields;
    
    const isVerified = (field: any) => field?.booleanValue || false;

    // Default widgets if none exist
    const defaultLayout = [
      { mapValue: { fields: { id: { stringValue: "hero" }, enabled: { booleanValue: true } } } },
      { mapValue: { fields: { id: { stringValue: "stats" }, enabled: { booleanValue: true } } } },
      { mapValue: { fields: { id: { stringValue: "socials" }, enabled: { booleanValue: true } } } },
      { mapValue: { fields: { id: { stringValue: "library" }, enabled: { booleanValue: true } } } },
    ];

    return {
      steamId: fields.steamId?.stringValue,
      // Get Custom Visuals (Banner, Background, Avatar)
      banner: fields.theme?.mapValue?.fields?.banner?.stringValue || "https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=2600&auto=format&fit=crop",
      background: fields.theme?.mapValue?.fields?.background?.stringValue || "", // Empty means use blurred banner
      avatar: fields.theme?.mapValue?.fields?.avatar?.stringValue || "", // Empty means use Steam/Placeholder
      color: fields.theme?.mapValue?.fields?.color?.stringValue || "indigo",
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
  <span className="inline-flex ml-1 text-blue-400" title="Verified Link">
    <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
  </span>
);

export default async function ProfilePage({ params }: Props) {
  const { username } = await params;
  const firebaseUser = await getFirebaseUser(username);

  // FIX: Force Absolute URLs to break out of subdomain
  const isDev = process.env.NODE_ENV === 'development';
  const protocol = isDev ? 'http' : 'https';
  const domain = isDev ? 'localhost:3000' : (process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'pulsegg.vercel.app');
  
  const dashboardUrl = `${protocol}://${domain}/dashboard`;
  const homeUrl = `${protocol}://${domain}`;
  const signupUrl = `${protocol}://${domain}/signup?handle=${username}`;

  if (!firebaseUser) {
    return (
      <div className="min-h-screen bg-[#0a0a0c] text-white flex flex-col items-center justify-center font-sans">
        <div className="w-24 h-24 bg-zinc-900 rounded-full flex items-center justify-center mb-6 animate-pulse"><span className="text-4xl">?</span></div>
        <h1 className="text-4xl font-black mb-2 tracking-tight">@{username}</h1>
        <p className="text-zinc-500 mb-8">This handle is available to claim.</p>
        <a href={signupUrl} className="bg-white text-black px-8 py-4 rounded-2xl font-bold hover:scale-105 transition duration-200">Claim Handle</a>
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

  const joinDate = profile?.timecreated ? new Date(profile.timecreated * 1000) : new Date();
  const yearsOnSteam = new Date().getFullYear() - joinDate.getFullYear();
  const heroGame = recentGames[0];
  const otherGames = recentGames.slice(1);

  // DECIDE AVATAR AND BACKGROUND
  const avatarSource = firebaseUser.avatar || profile?.avatarfull || "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png";
  
  const backgroundStyle = firebaseUser.background 
    ? { backgroundImage: `url(${firebaseUser.background})`, filter: 'brightness(0.3)' } 
    : { backgroundImage: `url(${firebaseUser.banner})`, filter: 'blur(60px) opacity(0.3) scale(1.1)' }; 

  const renderWidget = (id: string) => {
    switch (id) {
      case 'hero':
        return heroGame ? (
          <div className="col-span-1 md:col-span-2 relative h-64 rounded-[32px] overflow-hidden group border border-white/5 shadow-2xl">
             <img 
                src={`https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${heroGame.appid}/library_hero.jpg`} 
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-700"
                alt={heroGame.name}
             />
             <div className="absolute inset-0 bg-gradient-to-t from-[#000] via-[#000]/40 to-transparent"></div>
             <div className="absolute bottom-0 left-0 w-full p-8">
                <div className="flex items-end justify-between">
                   <div>
                      <div className="flex items-center gap-2 mb-2">
                         <span className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold border border-white/10 flex items-center gap-1">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            Recent Activity
                         </span>
                      </div>
                      <h2 className="text-3xl font-black text-white mb-2">{heroGame.name}</h2>
                      <p className="text-zinc-300 font-medium">{Math.round(heroGame.playtime_2weeks / 60 * 10) / 10} hours past 2 weeks</p>
                   </div>
                   <div className="hidden sm:block text-right">
                      <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Total Time</p>
                      <p className="text-2xl font-mono text-white">{Math.round(heroGame.playtime_forever / 60)}h</p>
                   </div>
                </div>
             </div>
          </div>
        ) : null;

      case 'stats':
        return (
          <div className="bg-[#1e1f22]/80 backdrop-blur-md p-6 rounded-[32px] border border-white/5 flex flex-col justify-between hover:bg-[#1e1f22] transition h-full min-h-[160px]">
             <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400"><Trophy className="w-5 h-5" /></div>
             </div>
             <div>
                <p className="text-3xl font-black text-white mb-1">{gameCount}</p>
                <p className="text-sm font-bold text-zinc-500">Games Owned</p>
             </div>
          </div>
        );

      case 'socials':
        const linkedCount = Object.values(firebaseUser.socials).filter(v => v).length + (firebaseUser.gaming.xbox ? 1 : 0) + (firebaseUser.gaming.epic ? 1 : 0);
        return (
          <div className="bg-[#1e1f22]/80 backdrop-blur-md p-6 rounded-[32px] border border-white/5 flex flex-col justify-between hover:bg-[#1e1f22] transition h-full min-h-[160px]">
             <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-400"><LinkIcon className="w-5 h-5" /></div>
             </div>
             <div>
                <p className="text-3xl font-black text-white mb-1">{linkedCount}</p>
                <p className="text-sm font-bold text-zinc-500">Linked Accounts</p>
             </div>
          </div>
        );

      case 'library':
        return otherGames.length > 0 ? (
          <div className="col-span-1 md:col-span-2 bg-[#1e1f22]/80 backdrop-blur-md rounded-[32px] border border-white/5 p-6">
             <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-4">Also Playing</h3>
             <div className="space-y-3">
                {otherGames.map((game: any) => (
                  <div key={game.appid} className="flex items-center gap-4 group cursor-default">
                     <img src={`https://media.steampowered.com/steamcommunity/public/images/apps/${game.appid}/${game.img_icon_url}.jpg`} className="w-12 h-12 rounded-xl object-cover bg-black" alt={game.name} />
                     <div className="flex-1">
                        <p className="font-bold text-white group-hover:text-indigo-400 transition">{game.name}</p>
                        <p className="text-xs text-zinc-500">{Math.round(game.playtime_2weeks / 60)} hrs recent</p>
                     </div>
                     <div className="text-sm font-mono text-zinc-600">{Math.round(game.playtime_forever / 60)}h</div>
                  </div>
                ))}
             </div>
          </div>
        ) : null;
        
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#111214] text-white font-sans selection:bg-indigo-500/30 overflow-x-hidden">
      
      {/* 1. Dynamic Background */}
      <div className="fixed inset-0 z-0">
         <div 
            className="absolute inset-0 bg-cover bg-center transition-all duration-1000"
            style={backgroundStyle}
         ></div>
         {/* Overlay to ensure text readability */}
         <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-[#111214]/80 to-[#111214]"></div>
      </div>

      <div className="max-w-[1400px] mx-auto p-4 md:p-8 relative z-10">
        <div className="flex justify-between items-center mb-12 px-2">
           <a href={homeUrl} className="flex items-center gap-2 font-bold text-xl tracking-tighter hover:opacity-80 transition">
             <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center"><Sparkles className="w-4 h-4 text-white" /></div>Pulse
           </a>
           <a href={dashboardUrl} className="flex items-center gap-2 px-4 py-2 bg-[#1e1f22] border border-white/10 rounded-xl font-bold text-sm hover:bg-white/10 transition">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Edit Profile
           </a>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* PASSPORT */}
          <div className="lg:col-span-4 sticky top-8">
            <div className="bg-[#1e1f22]/80 backdrop-blur-md rounded-[32px] overflow-hidden border border-white/5 shadow-2xl">
              <div className="h-32 bg-zinc-800 relative group"><img src={firebaseUser.banner} className="w-full h-full object-cover group-hover:scale-105 transition duration-700" alt="Banner" /></div>
              <div className="px-6 pb-6 relative">
                <div className="relative -mt-16 mb-4 w-32 h-32">
                   <div className="w-32 h-32 rounded-full p-1.5 bg-[#1e1f22]">
                      <img src={avatarSource} className="w-full h-full rounded-full object-cover bg-zinc-800" alt="Avatar" />
                   </div>
                   <div className={`absolute bottom-3 right-3 w-6 h-6 rounded-full border-[4px] border-[#1e1f22] ${profile?.gameextrainfo ? 'bg-green-500' : 'bg-zinc-500'}`} title={profile?.gameextrainfo ? "Playing" : "Offline"}></div>
                </div>
                <div className="mb-6">
                  <h1 className="text-2xl font-black text-white leading-tight mb-1">{profile?.personaname || username}</h1>
                  <p className="text-zinc-400 font-medium">@{username}</p>
                </div>
                {profile?.gameextrainfo && (
                  <div className="mb-6 p-3 bg-[#111214] rounded-xl border border-white/5 flex items-center gap-3">
                     <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400"><Gamepad2 className="w-5 h-5" /></div>
                     <div className="flex-1 min-w-0"><p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Playing now</p><p className="text-sm font-bold text-white truncate">{profile.gameextrainfo}</p></div>
                  </div>
                )}
                <div className="h-px bg-white/5 my-6"></div>
                <div className="space-y-4">
                   <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Connections</h3>
                   
                   {/* Steam Connection */}
                   {firebaseUser.steamId && (
                     <div className="flex items-center justify-between group">
                       <div className="flex items-center gap-3">
                         <div className="w-8 h-8 bg-[#171a21] rounded flex items-center justify-center"><svg className="w-5 h-5 fill-white" viewBox="0 0 24 24"><path d="M11.979 0C5.352 0 .002 5.35.002 11.95c0 5.63 3.863 10.33 9.056 11.59-.115-.815-.04-1.637.28-2.392l.84-2.81c-.244-.765-.333-1.683-.153-2.61.547-2.66 3.102-4.32 5.714-3.715 2.613.604 4.234 3.25 3.687 5.91-.4 1.94-2.022 3.355-3.86 3.593l-.865 2.92c4.467-1.35 7.9-5.26 8.3-9.98.028-.27.042-.54.042-.814C23.956 5.35 18.605 0 11.98 0zm6.54 12.35c.78.18 1.265.98 1.085 1.776-.18.797-.97.94-1.75.76-.78-.18-1.264-.98-1.085-1.776.18-.798.97-.94 1.75-.76zm-5.46 3.7c-.035 1.54 1.06 2.87 2.53 3.11l.245-.82c-.815-.224-1.423-1.04-1.396-1.99.027-.95.7-1.706 1.543-1.83l.255-.86c-1.472.03-2.65 1.13-3.176 2.39zm-3.045 2.5c-.755.12-1.395-.385-1.43-1.127-.035-.742.53-1.413 1.285-1.532.755-.12 1.394.385 1.43 1.127.034.74-.53 1.41-1.285 1.53z"/></svg></div>
                         <div><p className="text-sm font-bold">Steam</p><p className="text-xs text-zinc-500">{level > 0 ? `Level ${level}` : 'Connected'}</p></div>
                       </div>
                       
                       <div className="flex items-center gap-2">
                         <a 
                           href={`https://steamcommunity.com/profiles/${firebaseUser.steamId}`}
                           target="_blank"
                           rel="noopener noreferrer"
                           className="p-1.5 bg-[#1e1f22] text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-lg transition"
                           title="Visit Steam Profile"
                         >
                           <ExternalLink className="w-3 h-3" />
                         </a>
                         <VerifiedBadge />
                       </div>
                     </div>
                   )}

                   {firebaseUser.socials.discord && <div className="flex items-center justify-between group"><div className="flex items-center gap-3"><div className="w-8 h-8 bg-[#5865F2] rounded flex items-center justify-center text-white"><svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg></div><div><p className="text-sm font-bold">Discord</p><p className="text-xs text-zinc-500">{firebaseUser.socials.discord}</p></div></div>{firebaseUser.socials.discord_verified && <VerifiedBadge />}</div>}
                   {firebaseUser.gaming.epic && <div className="flex items-center justify-between group"><div className="flex items-center gap-3"><div className="w-8 h-8 bg-[#313131] rounded flex items-center justify-center font-bold text-xs">E</div><div><p className="text-sm font-bold">Epic Games</p><p className="text-xs text-zinc-500">{firebaseUser.gaming.epic}</p></div></div></div>}
                   {firebaseUser.gaming.xbox && <div className="flex items-center justify-between group"><div className="flex items-center gap-3"><div className="w-8 h-8 bg-[#107C10] rounded flex items-center justify-center font-bold text-xs">X</div><div><p className="text-sm font-bold">Xbox</p><p className="text-xs text-zinc-500">{firebaseUser.gaming.xbox}</p></div></div></div>}
                </div>
              </div>
            </div>
          </div>

          {/* WIDGET BOARD */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex items-center gap-6 px-4">
               <button className="text-white font-bold border-b-2 border-white pb-1">Overview</button>
               <button className="text-zinc-500 font-bold hover:text-zinc-300 transition pb-1">Activity</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {firebaseUser.layout.map((widget: any) => {
                  const id = widget.mapValue.fields.id.stringValue;
                  const enabled = widget.mapValue.fields.enabled.booleanValue;
                  return enabled ? <div key={id} className={id === 'hero' || id === 'library' ? 'col-span-1 md:col-span-2' : 'col-span-1'}>{renderWidget(id)}</div> : null;
               })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}