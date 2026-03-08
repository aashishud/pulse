import { getSteamProfile, getRecentlyPlayed, getSteamLevel, getOwnedGamesCount, getGameProgress } from '@/lib/steam';
import { getValorantProfile } from '@/lib/valorant';
import { Sparkles, Gamepad2, Trophy, Clock, MapPin, Link as LinkIcon, ExternalLink, Ghost, Music, LayoutGrid, Zap, Swords, Youtube, Twitch, Globe, ArrowUpRight, Share2, Users, ArrowRight, Eye } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Inter, Space_Grotesk, Press_Start_2P, Cinzel } from 'next/font/google';
import ShareButton from '@/components/ShareButton';
import { Metadata } from 'next';
import BadgeRack from '@/components/BadgeRack';
import AvatarDecoration from '@/components/AvatarDecoration';
import CursorEffects from '@/components/CursorEffects';
import ProfileGrid from '@/components/ProfileGrid';
import ViewCounter from '@/components/ViewCounter';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Load Fonts
const inter = Inter({ subsets: ['latin'], display: 'swap' });
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], display: 'swap' });
const pressStart = Press_Start_2P({ weight: '400', subsets: ['latin'], display: 'swap' });
const cinzel = Cinzel({ subsets: ['latin'], display: 'swap' });

// THE CACHING SHIELD: 60 seconds (1 minute). 
// Protects your database but allows Steam/Spotify status to update fast!
export const revalidate = 60;

interface Props {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  
  const isDev = process.env.NODE_ENV === 'development';
  const protocol = isDev ? 'http' : 'https';
  const domain = isDev ? 'localhost:3000' : (process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'pulsegg.in');
  
  // Added cache buster to force Discord to update the profile embed
  const ogImageUrl = `${protocol}://${domain}/api/og?user=${username}&v=1`;

  return {
    title: `${username} | Pulse`,
    description: `Check out ${username}'s gaming profile on Pulse.`,
    metadataBase: new URL(`${protocol}://${domain}`),
    openGraph: {
      title: `${username} | Pulse`,
      description: `Check out ${username}'s gaming profile on Pulse.`,
      url: `${protocol}://${domain}/${username}`,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${username}'s Pulse Profile`,
        },
      ],
      type: 'profile',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${username} | Pulse`,
      description: `Check out ${username}'s gaming profile on Pulse.`,
      images: [ogImageUrl],
    },
  };
}

async function getFirebaseUser(username: string) {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${username}`;
  
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return null;
    
    const data = await res.json();
    const fields = data.fields;
    
    const isVerified = (field: any) => field?.booleanValue || false;

    const getMapArray = (field: any) => {
        return field?.arrayValue?.values?.map((v: any) => {
            const map = v.mapValue.fields;
            return {
                label: map.label?.stringValue || "Link",
                url: map.url?.stringValue || "#"
            }
        }) || [];
    };

    const getClipsArray = (field: any) => {
        return field?.arrayValue?.values?.map((v: any) => {
            const map = v.mapValue.fields;
            return {
                title: map.title?.stringValue || "",
                url: map.url?.stringValue || ""
            }
        }) || [];
    };

    const getGear = (field: any) => {
        const map = field?.mapValue?.fields;
        if (!map) return {};
        return {
            cpu: map.cpu?.stringValue || "",
            gpu: map.gpu?.stringValue || "",
            ram: map.ram?.stringValue || "",
            mouse: map.mouse?.stringValue || "",
            keyboard: map.keyboard?.stringValue || "",
            headset: map.headset?.stringValue || "",
            monitor: map.monitor?.stringValue || "",
        };
    };

    const defaultLayout = [
      { mapValue: { fields: { id: { stringValue: "hero" }, enabled: { booleanValue: true }, size: { stringValue: 'full' } } } },
      { mapValue: { fields: { id: { stringValue: "content" }, enabled: { booleanValue: true }, size: { stringValue: 'half' } } } },
      { mapValue: { fields: { id: { stringValue: "spotify" }, enabled: { booleanValue: true }, size: { stringValue: 'half' } } } },
      { mapValue: { fields: { id: { stringValue: "stats" }, enabled: { booleanValue: true }, size: { stringValue: 'half' } } } },
      { mapValue: { fields: { id: { stringValue: "valorant" }, enabled: { booleanValue: true }, size: { stringValue: 'half' } } } },
      { mapValue: { fields: { id: { stringValue: "library" }, enabled: { booleanValue: true }, size: { stringValue: 'half' } } } },
      { mapValue: { fields: { id: { stringValue: "gear" }, enabled: { booleanValue: true }, size: { stringValue: 'half' } } } },
    ];

    return {
      owner_uid: fields.owner_uid?.stringValue,
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
      avatarDecoration: fields.theme?.mapValue?.fields?.avatarDecoration?.stringValue || "none",
      cursorTrail: fields.theme?.mapValue?.fields?.cursorTrail?.stringValue || "none",
      customCursor: fields.theme?.mapValue?.fields?.customCursor?.stringValue || "", 
      customCursorHover: fields.theme?.mapValue?.fields?.customCursorHover?.stringValue || "", // FETCHING HOVER CURSOR
      bio: fields.bio?.stringValue || "",
      views: fields.views?.integerValue || "0", // ADDED: View count
      primaryCommunity: fields.primaryCommunity?.stringValue ?? null,
      lastfm: fields.lastfm?.stringValue || "",
      customLinks: getMapArray(fields.customLinks),
      clips: getClipsArray(fields.clips),
      layout: fields.layout?.arrayValue?.values || defaultLayout, 
      gear: getGear(fields.gear),
      gaming: {
        xbox: fields.gaming?.mapValue?.fields?.xbox?.stringValue,
        xbox_verified: isVerified(fields.gaming?.mapValue?.fields?.xbox_verified),
        epic: fields.gaming?.mapValue?.fields?.epic?.stringValue,
        epic_verified: isVerified(fields.gaming?.mapValue?.fields?.epic_verified),
        valorant: {
          name: fields.gaming?.mapValue?.fields?.valorant?.mapValue?.fields?.name?.stringValue,
          tag: fields.gaming?.mapValue?.fields?.valorant?.mapValue?.fields?.tag?.stringValue,
          region: fields.gaming?.mapValue?.fields?.valorant?.mapValue?.fields?.region?.stringValue,
        }
      },
      socials: {
        discord: fields.socials?.mapValue?.fields?.discord?.stringValue,
        discord_verified: isVerified(fields.socials?.mapValue?.fields?.discord_verified),
        twitter: fields.socials?.mapValue?.fields?.twitter?.stringValue,
        twitter_verified: isVerified(fields.socials?.mapValue?.fields?.twitter_verified),
        instagram: fields.socials?.mapValue?.fields?.instagram?.stringValue,
        instagram_verified: isVerified(fields.socials?.mapValue?.fields?.instagram_verified),
        youtube: fields.socials?.mapValue?.fields?.youtube?.stringValue,
        twitch: fields.socials?.mapValue?.fields?.twitch?.stringValue,
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
  const domain = isDev ? 'localhost:3000' : (process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'pulsegg.in');
  
  const dashboardUrl = `${protocol}://${domain}/dashboard`;

  // Sleek Growth Hacker 404 Page for unclaimed handles
  if (!firebaseUser) {
    return (
      <div className="min-h-screen bg-[#0a0a0c] text-white flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
        {/* Background Ambience */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.05)_0%,transparent_70%)] pointer-events-none" />
        
        <div className="relative z-10 text-center max-w-md w-full">
          <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl animate-[bounce_3s_ease-in-out_infinite]">
            <Ghost className="w-10 h-10 text-zinc-500" />
          </div>
          
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-3">@{username}</h1>
          <p className="text-zinc-400 mb-10 text-sm md:text-base leading-relaxed">
            This handle is completely available. Claim it before someone else does and start building your gaming identity.
          </p>

          <div className="space-y-4 w-full max-w-xs mx-auto">
            <Link 
              href={`/signup?handle=${username}`}
              className="relative inline-flex h-14 w-full overflow-hidden rounded-xl p-[1px] focus:outline-none group active:scale-[0.98] transition-transform"
            >
              <span className="absolute inset-[-1000%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#6366f1_50%,#E2CBFF_100%)] opacity-70 group-hover:opacity-100 transition-opacity duration-500" />
              <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-[11px] bg-zinc-950 px-8 py-1 text-sm font-bold text-white backdrop-blur-3xl gap-2 transition-colors group-hover:bg-zinc-900/90">
                Claim This Link <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
            
            <Link 
              href="/" 
              className="w-full flex items-center justify-center py-4 text-sm font-bold text-zinc-500 hover:text-white transition-colors"
            >
              Return to Base
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const badges = [];
  if (firebaseUser.steamId) badges.push('steam');
  if (firebaseUser.socials.discord_verified) badges.push('discord');

  let profile = null;
  let recentGames: any[] = [];
  let level = 0;
  let gameCount = 0;
  let heroGameProgress = null;
  let valorantData = null;
  let musicData = null;
  let community = null;

  const promises: Promise<any>[] = [];

  if (firebaseUser.steamId) {
    promises.push(getSteamProfile(firebaseUser.steamId));
    promises.push(getRecentlyPlayed(firebaseUser.steamId));
    promises.push(getSteamLevel(firebaseUser.steamId));
    promises.push(getOwnedGamesCount(firebaseUser.steamId));
  } else {
    promises.push(Promise.resolve(null), Promise.resolve([]), Promise.resolve(0), Promise.resolve(0));
  }

  if (firebaseUser.gaming.valorant?.name && firebaseUser.gaming.valorant?.tag) {
    promises.push(getValorantProfile(
      firebaseUser.gaming.valorant.name, 
      firebaseUser.gaming.valorant.tag, 
      firebaseUser.gaming.valorant.region || 'na'
    ));
  } else {
    promises.push(Promise.resolve(null));
  }

  promises.push(
    firebaseUser.lastfm 
      ? fetch(`${protocol}://${domain}/api/lastfm/now-playing?user=${firebaseUser.lastfm}`, { 
          cache: 'no-store',
          signal: AbortSignal.timeout(4000) 
        })
          .then(res => res.ok ? res.json() : null)
          .catch(err => { console.error("Last.fm Fetch Error:", err); return null; })
      : Promise.resolve(null)
  );

  promises.push(
    firebaseUser.owner_uid ? (async () => {
      try {
        if (firebaseUser.primaryCommunity === "") {
           return null;
        }

        if (firebaseUser.primaryCommunity) {
           const commRef = doc(db, "communities", firebaseUser.primaryCommunity);
           const commSnap = await getDoc(commRef);
           
           if (commSnap.exists() && commSnap.data().members?.includes(firebaseUser.owner_uid)) {
              return commSnap.data();
           }
        }
        
        const commQ = query(collection(db, "communities"), where("members", "array-contains", firebaseUser.owner_uid));
        const commSnap = await getDocs(commQ);
        if (!commSnap.empty) {
           return commSnap.docs[0].data();
        }
        
        return null;
      } catch (e) {
        console.error("Community Fetch Error:", e);
        return null;
      }
    })() : Promise.resolve(null)
  );

  const [
    steamProfile, 
    steamGames, 
    steamLevel, 
    steamGameCount, 
    valProfile,
    fetchedMusicData,
    fetchedCommunity
  ] = await Promise.all(promises);

  profile = steamProfile;
  recentGames = steamGames || [];
  level = steamLevel || 0;
  gameCount = steamGameCount || 0;
  valorantData = valProfile;
  musicData = fetchedMusicData;
  community = fetchedCommunity;

  if (recentGames.length > 0 && firebaseUser.steamId) {
    heroGameProgress = await getGameProgress(firebaseUser.steamId, recentGames[0].appid);
  }
  
  const avatarSource = firebaseUser.avatar || profile?.avatarfull || "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png";
  
  const backgroundStyle = firebaseUser.background 
    ? { backgroundImage: `url(${firebaseUser.background})`, filter: 'brightness(0.3)' } 
    : { backgroundImage: `url(${firebaseUser.banner})`, filter: 'blur(80px) opacity(0.4) scale(1.1)' }; 

  let fontClass = inter.className;
  if (firebaseUser.font === 'space') fontClass = spaceGrotesk.className;
  if (firebaseUser.font === 'press') fontClass = pressStart.className;
  if (firebaseUser.font === 'cinzel') fontClass = cinzel.className;

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

  const steamData = {
    profile: steamProfile,
    recentGames: steamGames || [],
    level: steamLevel || 0,
    gameCount: steamGameCount || 0,
    heroGameProgress,
    valorantData: valProfile
  };

  return (
    <div className={`min-h-screen bg-[#111214] text-white ${fontClass} overflow-x-hidden`}>
      <CursorEffects type={firebaseUser.cursorTrail} />
      
      {/* ADDED: View Counter Trigger */}
      <ViewCounter username={username} />
      
      {/* AGGRESSIVE CSS OVERRIDE TO ENSURE CUSTOM CURSOR ALWAYS SHOWS (HOTSPOT 0 0 FIXED) */}
      {(firebaseUser.customCursor || firebaseUser.customCursorHover) && (
        <style dangerouslySetInnerHTML={{ __html: `
          html, body, *, .min-h-screen { 
            cursor: url("${firebaseUser.customCursor}") 0 0, auto !important; 
          }
          a, button, [role="button"], [class*="hover:"], .cursor-pointer, input, textarea { 
            cursor: url("${firebaseUser.customCursorHover || firebaseUser.customCursor}") 0 0, pointer !important; 
          }
        `}} />
      )}

      <div className="fixed inset-0 z-0">
         <div className="absolute inset-0 bg-cover bg-center" style={backgroundStyle}></div>
         <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-[#111214]/90 to-[#111214]"></div>
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto p-4 md:p-8">
        
        <div className="flex justify-between items-center mb-8 px-2">
           <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tighter hover:opacity-80 transition">
             <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center"><Sparkles className="w-4 h-4 text-white" /></div>Pulse
           </Link>
           <div className="flex items-center gap-3">
              <ShareButton />
              <a href={dashboardUrl} className="px-3 py-1.5 bg-[#1e1f22] border border-white/10 rounded-xl font-bold text-[10px] hover:bg-white hover:text-black transition flex items-center gap-2">
                 <Zap className="w-3 h-3 text-yellow-400 fill-current" /> Edit
              </a>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          <div className="lg:col-span-4 lg:sticky lg:top-8 z-20">
            <div className="bg-[#1e1f22]/80 backdrop-blur-md rounded-[32px] overflow-hidden border border-white/5 shadow-2xl relative">
              <div className="h-32 bg-zinc-900 relative group">
                <Image src={firebaseUser.banner} alt="Banner" fill className="object-cover group-hover:scale-105 transition duration-700" unoptimized />
              </div>
              
              <div className="px-6 pb-6 relative">
                <div className="relative -mt-16 mb-4 w-32 h-32">
                   <AvatarDecoration type={firebaseUser.avatarDecoration}>
                     <div className="w-32 h-32 rounded-full p-1.5 bg-[#1e1f22] relative z-10">
                        <Image src={avatarSource} alt="Avatar" fill className="rounded-full object-cover bg-zinc-900" unoptimized />
                     </div>
                   </AvatarDecoration>
                   {profile?.gameextrainfo && (
                     <div className="absolute bottom-2 right-2 w-6 h-6 rounded-full border-[4px] border-[#1e1f22] bg-green-500 z-20" title="Online"></div>
                   )}
                </div>

                <div className="flex justify-between items-start mb-6 gap-4">
                  <div className="min-w-0 flex-1">
                    <h1 className={`${nameClasses} truncate`} style={nameStyle}>{displayName}</h1>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-zinc-400 font-medium">@{username}</p>
                      
                      {parseInt(firebaseUser.views || "0") >= 0 && (
                         <div className="flex items-center gap-1.5 text-zinc-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded-lg text-[10px] font-bold tracking-wide ml-1">
                            <Eye className="w-3 h-3" /> {Number(firebaseUser.views || 0).toLocaleString()}
                         </div>
                      )}

                      <BadgeRack badgeList={badges} />
                    </div>
                  </div>

                  {community && (
                    <Link href={`/c/${community.handle}`} className="shrink-0 group mt-1">
                       <div className="flex items-center gap-3 px-3 py-2 bg-[#111214] hover:bg-white/5 border border-white/5 rounded-2xl transition shadow-lg relative overflow-hidden">
                           <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition duration-500"></div>
                           <div className="text-right relative z-10 hidden sm:block">
                              <p className="text-[9px] font-bold text-indigo-400/80 uppercase tracking-widest leading-none mb-1.5">Squad</p>
                              <p className="text-xs font-black text-white group-hover:text-indigo-400 transition truncate max-w-[120px] leading-none">{community.name}</p>
                           </div>
                           <div className="w-10 h-10 rounded-xl bg-zinc-800 overflow-hidden flex items-center justify-center shrink-0 border border-white/10 group-hover:scale-105 transition relative z-10 shadow-md">
                              {community.avatar ? (
                                 <img src={community.avatar} alt={community.name} className="w-full h-full object-cover" />
                              ) : (
                                 <Users className="w-5 h-5 text-zinc-400" />
                              )}
                           </div>
                       </div>
                    </Link>
                  )}
                </div>

                {profile?.gameextrainfo && (
                  <div className="mb-4 p-3 bg-[#111214] rounded-xl border border-white/5 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400"><Gamepad2 className="w-5 h-5" /></div>
                      <div className="flex-1 min-w-0"><p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Playing now</p><p className="text-sm font-bold text-white truncate">{profile.gameextrainfo}</p></div>
                  </div>
                )}

                {musicData?.nowPlaying?.isPlaying && (
                  <div className="mb-6 p-3 bg-[#111214] rounded-xl border border-[#1DB954]/20 flex items-center gap-3 group relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-[#1DB954]/5 to-transparent opacity-0 group-hover:opacity-100 transition duration-500"></div>
                      <div className="w-12 h-12 rounded-lg bg-[#1DB954]/10 flex items-center justify-center text-[#1DB954] overflow-hidden relative shrink-0 shadow-lg shadow-[#1DB954]/10">
                         {musicData.nowPlaying.albumArt ? (
                           <Image src={musicData.nowPlaying.albumArt} fill className="object-cover" alt="Album" unoptimized />
                         ) : (
                           <Music className="w-6 h-6" />
                         )}
                      </div>
                      <div className="flex-1 min-w-0 relative z-10">
                         <p className="text-[10px] font-bold text-[#1DB954] uppercase tracking-wider flex items-center gap-1.5 mb-0.5">
                            <Music className="w-3 h-3" /> Listening on Spotify
                         </p>
                         <a href={musicData.nowPlaying.url} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-white truncate block hover:underline leading-tight">
                            {musicData.nowPlaying.title}
                         </a>
                         <p className="text-xs text-zinc-400 truncate mt-0.5">{musicData.nowPlaying.artist}</p>
                      </div>
                      <div className="flex items-end gap-1 h-5 px-1 shrink-0">
                         <span className="w-1 bg-[#1DB954] rounded-full animate-pulse h-full"></span>
                         <span className="w-1 bg-[#1DB954] rounded-full animate-pulse h-2/3" style={{ animationDelay: '200ms' }}></span>
                         <span className="w-1 bg-[#1DB954] rounded-full animate-pulse h-4/5" style={{ animationDelay: '400ms' }}></span>
                      </div>
                  </div>
                )}
                
                <div className="h-px bg-white/5 my-6"></div>
                
                <div className="space-y-4">
                   <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Connections</h3>
                   
                   {/* OFFICIAL STEAM ICON */}
                   {firebaseUser.steamId && (
                     <div className="flex items-center justify-between group">
                       <div className="flex items-center gap-3">
                         <div className="w-8 h-8 bg-[#171a21] rounded flex items-center justify-center">
                           <svg className="w-4 h-4 fill-white" viewBox="0 0 496 512"><path d="M496 256c0 137-111.2 248-248.4 248-113.8 0-209.6-76.3-239-180.4l95.2 39.3c6.4 32.1 34.9 56.4 68.9 56.4 39.2 0 71.9-32.4 70.2-73.5l84.5-60.2c52.1 1.3 95.8-40.9 95.8-93.5 0-51.6-42-93.5-93.7-93.5s-93.7 42-93.7 93.5v1.2L176.6 279c-15.5-.9-30.7 3.4-43.5 12.1L0 236.1C10.2 108.4 117.1 8 247.6 8 384.8 8 496 119.3 496 256zM155.7 384.3l-30.5-12.6a52.79 52.79 0 0 0 27.2 25.8c26.9 11.2 57.8-1.6 69-28.4 5.4-13 5.5-27.3.1-40.3-5.4-13-15.5-23.2-28.5-28.6-12.9-5.4-26.7-5.2-38.9-.6l31.5 13c19.8 8.2 29.2 30.9 20.9 50.7-8.3 19.9-31 29.2-50.8 21zM277.5 344.1c-8.7-1.4-16.7-6.2-22.3-13.3-5.6-7.1-8.5-16.1-8.2-25.2.3-9.1 3.8-17.8 9.9-24.6 6.1-6.8 14.4-11.1 23.3-12.1 8.9-1 17.8 1.4 25 6.4 7.2 5 12.3 12.4 14.1 21.1 1.8 8.7-.3 17.8-5.8 24.8-5.5 7-13.4 11.6-22 13.1-8.6 1.5-17.6-.2-24-4.2zm24.6-67.6c-16.1 0-29.2 13.1-29.2 29.2s13.1 29.2 29.2 29.2 29.2-13.1 29.2-29.2-13.1-29.2-29.2-29.2z"/></svg>
                         </div>
                         <div>
                           <p className="text-sm font-bold">Steam</p>
                           <p className="text-[10px] md:text-xs text-zinc-500">{level > 0 ? `Level ${level}` : 'Connected'}</p>
                         </div>
                       </div>
                       <VerifiedBadge />
                     </div>
                   )}

                   {/* OFFICIAL DISCORD ICON */}
                   {firebaseUser.socials.discord && (
                     <div className="flex items-center justify-between group">
                       <div className="flex items-center gap-3">
                         <div className="w-8 h-8 bg-[#5865F2] rounded flex items-center justify-center text-white">
                           <svg className="w-4 h-4 fill-white" viewBox="0 0 640 512"><path d="M524.5 69.8a1.5 1.5 0 0 0 -.8-.7A485.1 485.1 0 0 0 404.1 32a1.8 1.8 0 0 0 -1.9 .9 337.5 337.5 0 0 0 -14.9 30.6 447.8 447.8 0 0 0 -134.4 0 309.5 309.5 0 0 0 -15.1-30.6 1.9 1.9 0 0 0 -1.9-.9A483.7 483.7 0 0 0 116.1 69.1a1.7 1.7 0 0 0 -.8 .7C39.1 183.7 18.2 294.7 28.4 404.4a2 2 0 0 0 .8 1.4A487.7 487.7 0 0 0 176 479.9a1.9 1.9 0 0 0 2.1-.7A348.2 348.2 0 0 0 208.1 430.4a1.9 1.9 0 0 0 -1-2.6 321.2 321.2 0 0 1 -45.9-21.9 1.9 1.9 0 0 1 -.2-3.1c3.1-2.3 6.2-4.7 9.1-7.1a1.8 1.8 0 0 1 1.9-.3c96.2 43.9 200.4 43.9 295.5 0a1.8 1.8 0 0 1 1.9 .2c2.9 2.4 6 4.9 9.1 7.2a1.9 1.9 0 0 1 -.2 3.1 301.4 301.4 0 0 1 -45.9 21.8 1.9 1.9 0 0 0 -1 2.6 391.1 391.1 0 0 0 30 48.8 1.9 1.9 0 0 0 2.1 .7A486 486 0 0 0 611.6 405.7a1.9 1.9 0 0 0 .8-1.4C623.2 277.6 590.9 167.5 524.5 69.8zM222.5 337.6c-29 0-52.8-26.6-52.8-59.2S193.1 219.1 222.5 219.1c29.7 0 53.3 26.8 52.8 59.2C275.3 311 251.9 337.6 222.5 337.6zm195.4 0c-29 0-52.8-26.6-52.8-59.2S388.4 219.1 417.9 219.1c29.7 0 53.3 26.8 52.8 59.2C470.7 311 447.5 337.6 417.9 337.6z"/></svg>
                         </div>
                         <div>
                           <p className="text-sm font-bold">Discord</p>
                           <p className="text-[10px] md:text-xs text-zinc-500">{firebaseUser.socials.discord}</p>
                         </div>
                       </div>
                       {firebaseUser.socials.discord_verified && <VerifiedBadge />}
                     </div>
                   )}

                   {/* OFFICIAL XBOX ICON */}
                   {firebaseUser.gaming.xbox && (
                     <div className="flex items-center justify-between group">
                       <div className="flex items-center gap-3">
                         <div className="w-8 h-8 bg-[#107C10] rounded flex items-center justify-center">
                           <svg className="w-4 h-4 fill-white" viewBox="0 0 512 512"><path d="M256 0A256 256 0 1 0 256 512A256 256 0 1 0 256 0zM144.1 88.5c19.3-5.2 41.5-7.7 65.5-5.9C168 116.3 125 155.6 91.8 206.4c1.8-49 24.3-94.8 52.3-117.9zm13 325c-43.2-30.3-69.5-80.1-70-134.4C108.5 315.6 128.5 352.5 157 386c-5.1-4.7-9.5-9.3-12.9-12.5zm195.6-325c28 23.1 50.5 69 52.3 117.9-33.2-50.8-76.3-90.1-117.8-123.8 24-1.8 46.2 .7 65.5 5.9zm-13.6 337.4C307.7 400.6 281.8 409 256 409s-51.7-8.4-83.1-16.9C211.7 353.4 256 295.3 256 295.3s44.3 58.1 83.1 96.8zM355 386c28.5-33.5 48.5-70.4 69.9-106.9-.5 54.3-26.8 104.1-70 134.4-3.4 3.2-7.8 7.8-12.9 12.5z"/></svg>
                         </div>
                         <div>
                           <p className="text-sm font-bold">Xbox</p>
                           <p className="text-xs text-zinc-500">{firebaseUser.gaming.xbox}</p>
                         </div>
                       </div>
                     </div>
                   )}

                   {/* OFFICIAL EPIC GAMES ICON */}
                   {firebaseUser.gaming.epic && (
                     <div className="flex items-center justify-between group">
                       <div className="flex items-center gap-3">
                         <div className="w-8 h-8 bg-[#313131] rounded flex items-center justify-center">
                           <svg className="w-3.5 h-3.5 fill-white" viewBox="0 0 24 24"><path d="M20.67 4.195l-7.234-4.004c-1.304-.72-2.825-.664-4.09.117L2.942 4.195c-1.28.788-2.072 2.148-2.072 3.655v8.113c0 1.507.792 2.867 2.072 3.655l6.404 3.948a4.238 4.238 0 004.144 0l6.404-3.948c1.28-.788 2.072-2.148 2.072-3.655V7.85c0-1.507-.792-2.867-2.072-3.655H20.67zm-7.618 11.23h-2.46v-1.57h2.46v-2.116h-2.46v-1.544h2.92v-2.19h-5.182v9.61h5.263v-2.19h-1.996l1.455.001z"/></svg>
                         </div>
                         <div>
                           <p className="text-sm font-bold">Epic Games</p>
                           <p className="text-xs text-zinc-500">{firebaseUser.gaming.epic}</p>
                         </div>
                       </div>
                     </div>
                   )}

                   {/* OFFICIAL TWITTER (X) ICON */}
                   {firebaseUser.socials.twitter && (
                     <div className="flex items-center justify-between group">
                       <div className="flex items-center gap-3">
                         <div className="w-8 h-8 bg-zinc-800 rounded flex items-center justify-center">
                           <svg className="w-3.5 h-3.5 fill-white" viewBox="0 0 512 512"><path d="M389.2 48h70.6L305.6 224.2 487 464H345L233.7 318.6 106.5 464H35.8L200.7 275.5 26.8 48H172.4L272.9 180.9 389.2 48zM364.4 421.8h39.1L151.1 88h-42L364.4 421.8z"/></svg>
                         </div>
                         <div>
                           <p className="text-sm font-bold">Twitter</p>
                           <p className="text-xs text-zinc-500">{firebaseUser.socials.twitter}</p>
                         </div>
                       </div>
                     </div>
                   )}

                   {/* OFFICIAL INSTAGRAM ICON */}
                   {firebaseUser.socials.instagram && (
                     <div className="flex items-center justify-between group">
                       <div className="flex items-center gap-3">
                         <div className="w-8 h-8 bg-zinc-800 rounded flex items-center justify-center">
                           <svg className="w-4 h-4 fill-white" viewBox="0 0 448 512"><path d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z"/></svg>
                         </div>
                         <div>
                           <p className="text-sm font-bold">Instagram</p>
                           <p className="text-xs text-zinc-500">{firebaseUser.socials.instagram}</p>
                         </div>
                       </div>
                     </div>
                   )}

                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-8">
            <ProfileGrid user={firebaseUser} steam={steamData} spotify={musicData} />
          </div>

        </div>
      </div>
    </div>
  );
}