import { getSteamProfile, getRecentlyPlayed, getSteamLevel, getOwnedGamesCount, getGameProgress } from '@/lib/steam';
import { getValorantProfile } from '@/lib/valorant';
import { Gamepad2, Globe, ArrowUpRight, Ghost, Music, Zap, Share2, Users, ArrowRight, Eye, Cpu, Monitor, Mouse, Keyboard, Headphones, BadgeCheck } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Inter, Space_Grotesk, Press_Start_2P, Cinzel } from 'next/font/google';
import ShareButton from '@/components/ShareButton';
import { Metadata } from 'next';
import AvatarDecoration from '@/components/AvatarDecoration';
import CursorEffects from '@/components/CursorEffects';
import ProfileGrid from '@/components/ProfileGrid';
import ViewCounter from '@/components/ViewCounter';
import BackgroundShader from '@/components/BackgroundShader';
import EnterScreen from '@/components/EnterScreen';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import PulseLogo from "@/components/PulseLogo"; 

// --- IMPORT YOUR NEW CUSTOM BADGES ---
import { customBadges } from '@/config/badges';

// Load Fonts
const inter = Inter({ subsets: ['latin'], display: 'swap' });
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], display: 'swap' });
const pressStart = Press_Start_2P({ weight: '400', subsets: ['latin'], display: 'swap' });
const cinzel = Cinzel({ subsets: ['latin'], display: 'swap' });

export const revalidate = 60;

interface Props {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  
  const isDev = process.env.NODE_ENV === 'development';
  const protocol = isDev ? 'http' : 'https';
  const domain = isDev ? 'localhost:3000' : (process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'pulsegg.in');
  const ogImageUrl = `${protocol}://${domain}/api/og?user=${username}&v=1`;

  return {
    title: `${username} | Pulse`,
    description: `Check out ${username}'s gaming profile on Pulse.`,
    metadataBase: new URL(`${protocol}://${domain}`),
    openGraph: {
      title: `${username} | Pulse`,
      description: `Check out ${username}'s gaming profile on Pulse.`,
      url: `${protocol}://${domain}/${username}`,
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: `${username}'s Pulse Profile` }],
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

const ensureProtocol = (url: string) => {
  if (!url) return "#";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("mailto:")) return url;
  return `https://${url}`;
};

async function getFirebaseUser(username: string) {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${username}`;
  
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return null;
    
    const data = await res.json();
    const fields = data.fields;
    const isVerified = (field: any) => field?.booleanValue || false;

    const getMapArray = (field: any) => field?.arrayValue?.values?.map((v: any) => {
        const map = v.mapValue.fields;
        return { label: map.label?.stringValue || "Link", url: map.url?.stringValue || "#" }
    }) || [];

    const getClipsArray = (field: any) => field?.arrayValue?.values?.map((v: any) => {
        const map = v.mapValue.fields;
        return { title: map.title?.stringValue || "", url: map.url?.stringValue || "" }
    }) || [];

    const getGear = (field: any) => {
        const map = field?.mapValue?.fields;
        if (!map) return {};
        return {
            cpu: map.cpu?.stringValue || "", gpu: map.gpu?.stringValue || "", ram: map.ram?.stringValue || "",
            mouse: map.mouse?.stringValue || "", keyboard: map.keyboard?.stringValue || "",
            headset: map.headset?.stringValue || "", monitor: map.monitor?.stringValue || "",
        };
    };

    const getNum = (val: any, def: number) => {
        if (val?.doubleValue !== undefined) return Number(val.doubleValue);
        if (val?.integerValue !== undefined) return Number(val.integerValue);
        return def;
    };

    const defaultLayout = [
      { mapValue: { fields: { id: { stringValue: "hero" }, enabled: { booleanValue: true }, size: { stringValue: 'full' } } } },
      { mapValue: { fields: { id: { stringValue: "content" }, enabled: { booleanValue: true }, size: { stringValue: 'half' } } } },
      { mapValue: { fields: { id: { stringValue: "spotify" }, enabled: { booleanValue: true }, size: { stringValue: 'half' } } } },
      { mapValue: { fields: { id: { stringValue: "valorant" }, enabled: { booleanValue: true }, size: { stringValue: 'half' } } } },
      { mapValue: { fields: { id: { stringValue: "connections" }, enabled: { booleanValue: true }, size: { stringValue: 'half' } } } }
    ];

    return {
      owner_uid: fields.owner_uid?.stringValue,
      steamId: fields.steamId?.stringValue,
      isVerified: isVerified(fields.isVerified),
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
      customCursorHover: fields.theme?.mapValue?.fields?.customCursorHover?.stringValue || "",
      cardOpacity: getNum(fields.theme?.mapValue?.fields?.cardOpacity, 0.8),
      cardBlur: getNum(fields.theme?.mapValue?.fields?.cardBlur, 10),
      layoutStyle: fields.theme?.mapValue?.fields?.layoutStyle?.stringValue || "bento",
      shader: fields.theme?.mapValue?.fields?.shader?.stringValue || "none",
      discordDecoration: fields.theme?.mapValue?.fields?.discordDecoration?.stringValue || "",
      bgm: fields.theme?.mapValue?.fields?.bgm?.stringValue || "",
      backgroundVideo: fields.theme?.mapValue?.fields?.backgroundVideo?.stringValue || "",
      enterText: fields.theme?.mapValue?.fields?.enterText?.stringValue || "",
      bio: fields.bio?.stringValue || "",
      views: fields.views?.integerValue || "0", 
      primaryCommunity: fields.primaryCommunity?.stringValue ?? null,
      lastfm: fields.lastfm?.stringValue || "",
      customLinks: getMapArray(fields.customLinks),
      clips: getClipsArray(fields.clips),
      layout: (fields.layout?.arrayValue?.values || defaultLayout).map((w: any) => {
        if (w.mapValue?.fields?.id?.stringValue === 'library') {
          return { ...w, mapValue: { ...w.mapValue, fields: { ...w.mapValue.fields, id: { stringValue: 'connections' } } } };
        }
        return w;
      }),
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

export default async function ProfilePage({ params }: Props) {
  const { username } = await params;
  const firebaseUser = await getFirebaseUser(username);

  const isDev = process.env.NODE_ENV === 'development';
  const protocol = isDev ? 'http' : 'https';
  const domain = isDev ? 'localhost:3000' : (process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'pulsegg.in');
  const dashboardUrl = `${protocol}://${domain}/dashboard`;

  if (!firebaseUser) {
    return (
      <div className="h-screen w-screen bg-[#0a0a0c] text-white flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.05)_0%,transparent_70%)] pointer-events-none" />
        <div className="relative z-10 text-center max-w-md w-full">
          <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl">
            <Ghost className="w-10 h-10 text-zinc-500" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-3">@{username}</h1>
          <p className="text-zinc-400 mb-10 text-sm md:text-base leading-relaxed">
            This handle is available. Claim it before someone else does and start building your gaming identity.
          </p>
          <div className="space-y-4 w-full max-w-xs mx-auto">
            <Link href={`/signup?handle=${username}`} className="relative inline-flex h-14 w-full overflow-hidden rounded-xl p-[1px] group">
              <span className="absolute inset-[-1000%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#6366f1_50%,#E2CBFF_100%)] opacity-70 group-hover:opacity-100 transition-opacity" />
              <span className="inline-flex h-full w-full items-center justify-center rounded-[11px] bg-zinc-950 px-8 py-1 text-sm font-bold text-white backdrop-blur-3xl gap-2">
                Claim This Link <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
            <Link href="/" className="w-full flex items-center justify-center py-4 text-sm font-bold text-zinc-500 hover:text-white transition-colors">Return to Base</Link>
          </div>
        </div>
      </div>
    );
  }

  // Generate the Custom Badges List for this User
  const userCustomBadges = customBadges[username.toLowerCase()] || [];
  const hasBadges = userCustomBadges.length > 0 || firebaseUser.steamId || firebaseUser.socials.discord_verified;

  let profile = null; let recentGames: any[] = []; let level = 0; let gameCount = 0; let heroGameProgress = null; let valorantData = null; let musicData = null; let community = null;
  const promises: Promise<any>[] = [];

  if (firebaseUser.steamId) {
    promises.push(getSteamProfile(firebaseUser.steamId), getRecentlyPlayed(firebaseUser.steamId), getSteamLevel(firebaseUser.steamId), getOwnedGamesCount(firebaseUser.steamId));
  } else {
    promises.push(Promise.resolve(null), Promise.resolve([]), Promise.resolve(0), Promise.resolve(0));
  }

  if (firebaseUser.gaming.valorant?.name && firebaseUser.gaming.valorant?.tag) {
    promises.push(getValorantProfile(firebaseUser.gaming.valorant.name, firebaseUser.gaming.valorant.tag, firebaseUser.gaming.valorant.region || 'na'));
  } else { promises.push(Promise.resolve(null)); }

  promises.push(firebaseUser.lastfm ? fetch(`${protocol}://${domain}/api/lastfm/now-playing?user=${firebaseUser.lastfm}`, { cache: 'no-store', signal: AbortSignal.timeout(4000) }).then(res => res.ok ? res.json() : null).catch(() => null) : Promise.resolve(null));

  promises.push(firebaseUser.owner_uid && firebaseUser.primaryCommunity ? (async () => {
    try {
      const commSnap = await getDoc(doc(db, "communities", firebaseUser.primaryCommunity));
      if (commSnap.exists() && commSnap.data().members?.includes(firebaseUser.owner_uid)) return commSnap.data();
      const commQ = query(collection(db, "communities"), where("members", "array-contains", firebaseUser.owner_uid));
      const fallbackSnap = await getDocs(commQ);
      return !fallbackSnap.empty ? fallbackSnap.docs[0].data() : null;
    } catch { return null; }
  })() : Promise.resolve(null));

  const [steamProfile, steamGames, steamLevel, steamGameCount, valProfile, fetchedMusicData, fetchedCommunity] = await Promise.all(promises);
  profile = steamProfile; recentGames = steamGames || []; level = steamLevel || 0; gameCount = steamGameCount || 0; valorantData = valProfile; musicData = fetchedMusicData; community = fetchedCommunity;

  if (recentGames.length > 0 && firebaseUser.steamId) heroGameProgress = await getGameProgress(firebaseUser.steamId, recentGames[0].appid);
  
  const avatarSource = firebaseUser.avatar || profile?.avatarfull || "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png";
  const backgroundStyle = firebaseUser.background ? { backgroundImage: `url(${firebaseUser.background})`, filter: 'brightness(0.3)' } : { backgroundImage: `url(${firebaseUser.banner})`, filter: 'blur(80px) opacity(0.4) scale(1.1)' }; 

  let fontClass = inter.className;
  if (firebaseUser.font === 'space') fontClass = spaceGrotesk.className;
  if (firebaseUser.font === 'press') fontClass = pressStart.className;
  if (firebaseUser.font === 'cinzel') fontClass = cinzel.className;

  let nameClasses = "text-3xl md:text-4xl font-black mb-1 leading-relaxed py-1";
  let nameStyle = {};

  if (firebaseUser.nameEffect === 'gradient') {
    nameClasses += ` bg-gradient-to-r ${firebaseUser.nameColor} bg-clip-text text-transparent`;
  } else if (firebaseUser.nameEffect === 'neon') {
    const colorMap: any = { "white": "#ffffff", "indigo-500": "#6366f1", "pink-500": "#ec4899", "cyan-400": "#22d3ee", "emerald-400": "#34d399", "yellow-400": "#facc15", "red-500": "#ef4444" };
    nameClasses += ` text-${firebaseUser.nameColor === 'white' ? 'white' : firebaseUser.nameColor}`;
    nameStyle = { textShadow: `0 0 15px ${colorMap[firebaseUser.nameColor] || "#ffffff"}` };
  } else {
    nameClasses += ` text-${firebaseUser.nameColor === 'white' ? 'white' : firebaseUser.nameColor}`;
  }

  const displayName = firebaseUser.displayName || profile?.personaname || username;
  const steamData = { profile: steamProfile, recentGames: steamGames || [], level: steamLevel || 0, gameCount: steamGameCount || 0, heroGameProgress, valorantData: valProfile };

  function hexToRgba(hex: string, alpha: number) {
    if (!hex) return `rgba(30, 31, 34, ${alpha})`;
    hex = hex.replace('#', '');
    let r = 30, g = 31, b = 34;
    if (hex.length === 3) { r = parseInt(hex[0]+hex[0], 16); g = parseInt(hex[1]+hex[1], 16); b = parseInt(hex[2]+hex[2], 16); } 
    else if (hex.length === 6) { r = parseInt(hex.slice(0, 2), 16); g = parseInt(hex.slice(2, 4), 16); b = parseInt(hex.slice(4, 6), 16); }
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  const leftCardStyle = {
    backgroundColor: hexToRgba(firebaseUser.primary, firebaseUser.cardOpacity),
    backdropFilter: `blur(${firebaseUser.cardBlur}px)`, 
    WebkitBackdropFilter: `blur(${firebaseUser.cardBlur}px)`,
  };

  const isSimpleMode = firebaseUser.layoutStyle === "simple";

  const simpleSocials = [];
  if (firebaseUser.socials?.discord) simpleSocials.push({ name: 'Discord', tooltip: firebaseUser.socials.discord, url: '#', icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/discord.svg' });
  if (firebaseUser.socials?.twitter) simpleSocials.push({ name: 'Twitter', tooltip: `@${firebaseUser.socials.twitter}`, url: `https://twitter.com/${firebaseUser.socials.twitter}`, icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/x.svg' });
  if (firebaseUser.socials?.youtube) simpleSocials.push({ name: 'YouTube', tooltip: 'YouTube', url: ensureProtocol(firebaseUser.socials.youtube), icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/youtube.svg' });
  if (firebaseUser.socials?.twitch) simpleSocials.push({ name: 'Twitch', tooltip: 'Twitch', url: `https://twitch.tv/${firebaseUser.socials.twitch}`, icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/twitch.svg' });
  if (firebaseUser.socials?.instagram) simpleSocials.push({ name: 'Instagram', tooltip: `@${firebaseUser.socials.instagram}`, url: `https://instagram.com/${firebaseUser.socials.instagram}`, icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/instagram.svg' });
  if (firebaseUser.steamId) simpleSocials.push({ name: 'Steam', tooltip: 'Steam', url: `https://steamcommunity.com/profiles/${firebaseUser.steamId}`, icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/steam.svg' });
  if (firebaseUser.gaming?.xbox) simpleSocials.push({ name: 'Xbox', tooltip: firebaseUser.gaming.xbox, url: '#', icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/xbox.svg' });
  if (firebaseUser.gaming?.epic) simpleSocials.push({ name: 'Epic Games', tooltip: firebaseUser.gaming.epic, url: '#', icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/epicgames.svg' });

  // === THE ENTER SCREEN WRAPPER ===
  return (
    <EnterScreen bgmUrl={firebaseUser.bgm} bgVideoUrl={firebaseUser.backgroundVideo} enterText={firebaseUser.enterText}>
      
      {/* GLOBAL STYLES TO PERMANENTLY PREVENT SCROLLBARS */}
      <style dangerouslySetInnerHTML={{ __html: `
        /* The Magic Bullet: Completely Nuke External Page Scrolling */
        html, body { 
          overflow: hidden !important; 
          width: 100vw; 
          height: 100vh; 
          margin: 0; 
          padding: 0; 
          background: #050505; 
        }
        
        .sleek-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .sleek-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .sleek-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.15); border-radius: 4px; }
        .sleek-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.3); }

        ${(firebaseUser.customCursor || firebaseUser.customCursorHover) ? `
          html, body, *, .min-h-screen, .h-screen { cursor: url("${firebaseUser.customCursor}") 0 0, auto !important; }
          a, button, [role="button"], [class*="hover:"], .cursor-pointer, input, textarea { cursor: url("${firebaseUser.customCursorHover || firebaseUser.customCursor}") 0 0, pointer !important; }
        ` : ''}
      `}} />

      {isSimpleMode ? (
        // === SIMPLE MODE RENDER ===
        <div className={`h-screen w-screen text-white ${fontClass} overflow-hidden flex flex-col`}>
          <CursorEffects type={firebaseUser.cursorTrail} />
          <ViewCounter username={username} />

          <div className="fixed inset-0 z-0">
            {/* Layer 1: Base Background Image OR Background Video */}
            {firebaseUser.backgroundVideo ? (
                <video src={firebaseUser.backgroundVideo} autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover opacity-60" />
            ) : (
                <div className="absolute inset-0 bg-cover bg-center" style={backgroundStyle}></div>
            )}
             
             {/* Layer 2: Shaders */}
             <BackgroundShader 
                type={firebaseUser.shader} 
                primaryColor={firebaseUser.primary} 
                backgroundImage={firebaseUser.background || firebaseUser.banner} 
             />
             
             {/* Layer 3: Dark overlay ON TOP of the shader to ensure the glassmorphism blur and text are readable */}
             <div className="absolute inset-0 bg-black/40 pointer-events-none"></div>
          </div>

          {/* Top Nav (Absolute floating) */}
          <div className="absolute top-0 left-0 w-full z-50 p-4 md:p-6 flex justify-between items-center pointer-events-auto">
             <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tighter hover:opacity-80 transition drop-shadow-md">
               <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.4)]">
                 <PulseLogo className="w-4 h-4 text-white" />
               </div>
               Pulse
             </Link>
             <div className="flex items-center gap-3">
                <ShareButton />
                <a href={dashboardUrl} className="px-3 py-1.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl font-bold text-[10px] hover:bg-white hover:text-black transition flex items-center gap-2 shadow-lg">
                   <Zap className="w-3 h-3 text-yellow-400 fill-current" /> Edit
                </a>
             </div>
          </div>

          {/* Centered Simple Card Content - LOCKED TO H-SCREEN */}
          <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-4 pt-24 pb-8 h-screen w-full pointer-events-none">
              <div className="w-full max-w-[500px] max-h-full rounded-[32px] border border-white/10 shadow-2xl flex flex-col relative overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700 pointer-events-auto" style={leftCardStyle}>
                  
                  {/* INNER SCROLLABLE AREA - This prevents the page from breaking! */}
                  <div className="flex-1 overflow-y-auto sleek-scrollbar w-full p-6 md:p-10 flex flex-col items-center text-center">

                    {/* Avatar */}
                    <div className="relative w-32 h-32 mb-6 shrink-0">
                      <div className="absolute inset-0 rounded-full blur-xl opacity-40 z-0 animate-pulse" style={{ backgroundColor: firebaseUser.primary }}></div>
                      
                      <AvatarDecoration type={firebaseUser.avatarDecoration}>
                        <div className="w-32 h-32 rounded-full bg-[#1e1f22] relative z-10 flex items-center justify-center">
                            <div className="relative w-[calc(100%-8px)] h-[calc(100%-8px)]">
                              <img src={avatarSource} alt="Avatar" className="w-full h-full rounded-full object-cover bg-zinc-900 relative z-10" />
                              {firebaseUser.discordDecoration && (
                                  <img src={firebaseUser.discordDecoration} alt="Decoration" className="absolute inset-0 w-full h-full z-30 pointer-events-none object-contain scale-[1.2]" />
                              )}
                            </div>
                        </div>
                      </AvatarDecoration>
                      {/* CUSTOM TOOLTIP: Playing Now */}
                      {profile?.gameextrainfo && (
                        <div className="absolute bottom-2 right-2 group cursor-help z-20">
                            <div className="w-6 h-6 rounded-full border-[4px] border-[#1e1f22] bg-green-500"></div>
                            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-zinc-900 border border-white/10 rounded-lg text-[10px] font-bold text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all pointer-events-none shadow-xl scale-95 group-hover:scale-100">
                              Playing {profile.gameextrainfo}
                            </div>
                        </div>
                      )}
                    </div>

                    {/* Identity */}
                    <div className="flex items-center justify-center gap-2 mb-2 max-w-full">
                      <h1 className={`text-4xl ${nameClasses} truncate`} style={nameStyle}>{displayName}</h1>
                      {firebaseUser.isVerified && (
                          <div className="relative group flex items-center justify-center shrink-0 cursor-help">
                            <BadgeCheck className="w-7 h-7 text-white fill-white/20 drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]" />
                            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-zinc-900 border border-white/10 rounded-md text-[10px] font-bold text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
                                Verified
                            </div>
                          </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 justify-center mb-6 flex-wrap">
                      <p className="text-zinc-400 font-medium text-sm">@{username}</p>
                      
                      {parseInt(firebaseUser.views || "0") >= 0 && (
                        <div className="flex items-center gap-1.5 text-zinc-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded-lg text-[10px] font-bold tracking-wide">
                            <Eye className="w-3 h-3" /> {Number(firebaseUser.views || 0).toLocaleString()}
                        </div>
                      )}

                      {/* NEW UNIFIED BADGE PILL (Custom + Connections) */}
                      {hasBadges && (
                        <div className="flex items-center gap-3.5 bg-black/40 border border-white/10 px-4 py-1.5 rounded-full shadow-inner backdrop-blur-md ml-1">
                            
                            {userCustomBadges.map((badge, idx) => {
                              const Icon = badge.icon;
                              return (
                                  <div key={idx} className={`relative group flex items-center justify-center cursor-help ${badge.dropShadow || ''}`}>
                                    <Icon className={`w-4 h-4 ${badge.color} ${badge.fill || ''}`} />
                                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-zinc-900 border border-white/10 rounded-md text-[10px] font-bold text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
                                        {badge.tooltip}
                                    </div>
                                  </div>
                              )
                            })}

                            {firebaseUser.steamId && (
                              <div className="relative group flex items-center justify-center w-4 h-4 opacity-80 hover:opacity-100 transition cursor-help">
                                  <img src="https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/steam.svg" alt="Steam" className="w-full h-full object-contain invert" />
                                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-zinc-900 border border-white/10 rounded-md text-[10px] font-bold text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
                                    Steam Connected
                                  </div>
                              </div>
                            )}

                            {firebaseUser.socials.discord_verified && (
                              <div className="relative group flex items-center justify-center w-4 h-4 opacity-80 hover:opacity-100 transition cursor-help">
                                  <img src="https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/discord.svg" alt="Discord" className="w-full h-full object-contain invert" />
                                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-zinc-900 border border-white/10 rounded-md text-[10px] font-bold text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
                                    Discord Connected
                                  </div>
                              </div>
                            )}
                        </div>
                      )}
                    </div>

                    {/* Community Badge */}
                    {community && (
                      <Link href={`/c/${community.handle}`} className="mb-6 group">
                        <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-black/20 hover:bg-white/5 border border-white/5 rounded-xl transition shadow-inner">
                            <div className="w-6 h-6 rounded-md bg-zinc-800 overflow-hidden flex items-center justify-center shrink-0 border border-white/10">
                                {community.avatar ? <img src={community.avatar} alt="Logo" className="w-full h-full object-cover" /> : <Users className="w-3 h-3 text-zinc-400" />}
                            </div>
                            <div className="text-left flex flex-col justify-center leading-none">
                                <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Squad</span>
                                <span className="text-sm font-bold text-white group-hover:text-indigo-400 transition">{community.name}</span>
                            </div>
                        </div>
                      </Link>
                    )}

                    {/* Bio */}
                    {firebaseUser.bio && (
                      <p className="text-sm text-zinc-300 leading-relaxed mb-8 font-medium max-w-[340px] whitespace-pre-wrap">{firebaseUser.bio}</p>
                    )}

                    {/* CUSTOM TOOLTIPS: Simple Profile Social Connections */}
                    {simpleSocials.length > 0 && (
                      <div className="flex flex-wrap justify-center gap-3 w-full mb-8">
                        {simpleSocials.map((s, idx) => (
                          <a key={idx} href={s.url !== '#' ? s.url : undefined} target={s.url !== '#' ? "_blank" : undefined} rel="noopener noreferrer" className="relative group w-12 h-12 rounded-2xl bg-black/40 hover:bg-white/10 border border-white/5 flex items-center justify-center transition-all hover:scale-110 shadow-lg">
                            <img src={s.icon} alt={s.name} className="w-5 h-5 object-contain opacity-90 invert" />
                            <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-zinc-950 border border-white/10 rounded-lg text-xs font-bold text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-50 shadow-xl scale-95 group-hover:scale-100">
                                {s.tooltip}
                            </div>
                          </a>
                        ))}
                      </div>
                    )}

                    {/* Spotify Pill */}
                    {musicData?.nowPlaying?.isPlaying && (
                      <a href={musicData.nowPlaying.url} target="_blank" rel="noopener noreferrer" className="w-full p-3 bg-black/40 rounded-2xl border border-[#1DB954]/30 hover:border-[#1DB954]/60 transition flex items-center gap-3 mb-8 group overflow-hidden relative shadow-lg">
                          <div className="absolute inset-0 bg-gradient-to-r from-[#1DB954]/5 to-transparent opacity-0 group-hover:opacity-100 transition duration-500"></div>
                          <div className="w-12 h-12 rounded-xl bg-[#1DB954]/10 flex items-center justify-center text-[#1DB954] overflow-hidden relative shrink-0 shadow-sm border border-white/5">
                            {musicData.nowPlaying.albumArt ? <img src={musicData.nowPlaying.albumArt} className="w-full h-full object-cover" alt="Album" /> : <Music className="w-5 h-5" />}
                          </div>
                          <div className="flex-1 min-w-0 relative z-10 text-left">
                            <p className="text-[10px] font-bold text-[#1DB954] uppercase tracking-wider flex items-center gap-1.5 mb-0.5"><Music className="w-3 h-3" /> Listening on Spotify</p>
                            <p className="text-sm font-bold text-white truncate leading-tight group-hover:underline">{musicData.nowPlaying.title}</p>
                            <p className="text-xs text-zinc-400 truncate mt-0.5">{musicData.nowPlaying.artist}</p>
                          </div>
                          <div className="flex items-end gap-1 h-4 px-2 shrink-0">
                            <span className="w-1 bg-[#1DB954] rounded-full animate-pulse h-full"></span>
                            <span className="w-1 bg-[#1DB954] rounded-full animate-pulse h-2/3" style={{ animationDelay: '200ms' }}></span>
                            <span className="w-1 bg-[#1DB954] rounded-full animate-pulse h-4/5" style={{ animationDelay: '400ms' }}></span>
                          </div>
                      </a>
                    )}

                    {/* Custom Links */}
                    {firebaseUser.customLinks && firebaseUser.customLinks.length > 0 && (
                      <div className="w-full space-y-3 mt-auto">
                        {firebaseUser.customLinks.map((link: any, idx: number) => (
                          <a key={idx} href={ensureProtocol(link.url)} target="_blank" rel="noopener noreferrer" className="block w-full py-4 px-6 bg-black/40 hover:bg-white/10 border border-white/5 rounded-2xl font-bold text-sm transition-all hover:scale-[1.02] shadow-lg group relative overflow-hidden">
                            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition"></div>
                            <span className="relative z-10 text-white flex justify-center items-center gap-2">{link.label}</span>
                          </a>
                        ))}
                      </div>
                    )}
                    
                    {/* Powered by Pulse is now INSIDE the scrollable area at the bottom */}
                    <div className="mt-8 text-center w-full pb-2">
                        <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold text-zinc-500 hover:text-white transition bg-black/40 px-4 py-2 rounded-full border border-white/5 backdrop-blur-md">
                          <PulseLogo className="w-3 h-3" /> Powered by Pulse
                        </Link>
                    </div>

                  </div>
              </div>
          </div>
        </div>
      ) : (
        // === BENTO GRID RENDER (DEFAULT) ===
        <div className={`h-screen w-screen text-white ${fontClass} overflow-hidden flex flex-col`}>
          <CursorEffects type={firebaseUser.cursorTrail} />
          <ViewCounter username={username} />

          <div className="fixed inset-0 z-0">
             {/* Layer 1: Base Background Image OR Background Video */}
             {firebaseUser.backgroundVideo ? (
                 <video src={firebaseUser.backgroundVideo} autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover opacity-60" />
             ) : (
                 <div className="absolute inset-0 bg-cover bg-center" style={backgroundStyle}></div>
             )}
             
             {/* Layer 2: Shaders */}
             <BackgroundShader 
                type={firebaseUser.shader} 
                primaryColor={firebaseUser.primary} 
                backgroundImage={firebaseUser.background || firebaseUser.banner} 
             />
             
             {/* Layer 3: Dark gradient overlay */}
             <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-black/80 pointer-events-none"></div>
          </div>

          {/* LOCKED TO EXACTLY H-SCREEN */}
          <div className="relative z-10 max-w-[1200px] w-full mx-auto p-4 md:p-8 lg:py-10 h-screen flex flex-col overflow-hidden">
            
            <div className="flex justify-between items-center mb-6 px-2 shrink-0">
               <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tighter hover:opacity-80 transition">
                 <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                    <PulseLogo className="w-4 h-4 text-white" />
                 </div>
                 Pulse
               </Link>
               <div className="flex items-center gap-3">
                  <ShareButton />
                  <a href={dashboardUrl} className="px-3 py-1.5 bg-[#1e1f22] border border-white/10 rounded-xl font-bold text-[10px] hover:bg-white hover:text-black transition flex items-center gap-2">
                     <Zap className="w-3 h-3 text-yellow-400 fill-current" /> Edit
                  </a>
               </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 min-h-0 pb-4">
              
              {/* LEFT SIDEBAR - Inherits min-h-0 and uses overflow-y-auto to scroll internally */}
              <div className="lg:col-span-4 h-full rounded-[32px] border border-white/5 shadow-2xl relative overflow-y-auto sleek-scrollbar" style={leftCardStyle}>
                
                <div className="h-28 bg-zinc-900 relative group">
                  <Image src={firebaseUser.banner} alt="Banner" fill className="object-cover group-hover:scale-105 transition duration-700" unoptimized />
                </div>
                
                <div className="px-6 pb-6 relative">
                  
                  <div className="relative -mt-14 mb-3 w-28 h-28 shrink-0">
                     <div className="absolute inset-0 rounded-full blur-xl opacity-40 z-0 animate-pulse" style={{ backgroundColor: firebaseUser.primary }}></div>

                     <AvatarDecoration type={firebaseUser.avatarDecoration}>
                       <div className="w-28 h-28 rounded-full bg-[#1e1f22] relative z-10 flex items-center justify-center">
                          <div className="relative w-[calc(100%-8px)] h-[calc(100%-8px)]">
                             <img src={avatarSource} alt="Avatar" className="w-full h-full rounded-full object-cover bg-zinc-900 relative z-10" />
                             {firebaseUser.discordDecoration && (
                                <img src={firebaseUser.discordDecoration} alt="Decoration" className="absolute inset-0 w-full h-full z-30 pointer-events-none object-contain scale-[1.2]" />
                             )}
                          </div>
                       </div>
                     </AvatarDecoration>
                     {/* CUSTOM TOOLTIP: Playing Now */}
                     {profile?.gameextrainfo && (
                       <div className="absolute bottom-1 right-1 group cursor-help z-20">
                          <div className="w-5 h-5 rounded-full border-[3px] border-[#1e1f22] bg-green-500"></div>
                          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-zinc-900 border border-white/10 rounded-lg text-[10px] font-bold text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all pointer-events-none shadow-xl scale-95 group-hover:scale-100">
                             Playing {profile.gameextrainfo}
                          </div>
                       </div>
                     )}
                  </div>

                  <div className="flex justify-between items-start mb-6 gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                         <h1 className={`text-3xl md:text-4xl font-black leading-relaxed py-1 truncate ${nameClasses.replace('mb-1', '')}`} style={nameStyle}>{displayName}</h1>
                         {/* VERIFIED BADGE */}
                         {firebaseUser.isVerified && (
                            <div className="relative group flex items-center justify-center shrink-0 cursor-help">
                               <BadgeCheck className="w-6 h-6 text-white fill-white/20 drop-shadow-[0_0_8px_rgba(255,255,255,0.4)] mt-1" />
                               <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-zinc-900 border border-white/10 rounded-md text-[10px] font-bold text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
                                  Verified
                               </div>
                            </div>
                         )}
                      </div>
                      
                      <div className="flex items-center gap-2 flex-wrap mt-1">
                        <p className="text-zinc-400 font-medium text-sm">@{username}</p>
                        
                        {parseInt(firebaseUser.views || "0") >= 0 && (
                           <div className="flex items-center gap-1.5 text-zinc-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded-lg text-[10px] font-bold tracking-wide">
                              <Eye className="w-3 h-3" /> {Number(firebaseUser.views || 0).toLocaleString()}
                           </div>
                        )}

                        {/* NEW UNIFIED BADGE PILL (Custom + Connections) */}
                        {hasBadges && (
                           <div className="flex items-center gap-3.5 bg-black/40 border border-white/10 px-4 py-1.5 rounded-full shadow-inner backdrop-blur-md ml-1">
                              
                              {userCustomBadges.map((badge, idx) => {
                                 const Icon = badge.icon;
                                 return (
                                    <div key={idx} className={`relative group flex items-center justify-center cursor-help ${badge.dropShadow || ''}`}>
                                       <Icon className={`w-4 h-4 ${badge.color} ${badge.fill || ''}`} />
                                       <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-zinc-900 border border-white/10 rounded-md text-[10px] font-bold text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
                                          {badge.tooltip}
                                       </div>
                                    </div>
                                 )
                              })}

                              {firebaseUser.steamId && (
                                 <div className="relative group flex items-center justify-center w-4 h-4 opacity-80 hover:opacity-100 transition cursor-help">
                                    <img src="https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/steam.svg" alt="Steam" className="w-full h-full object-contain invert" />
                                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-zinc-900 border border-white/10 rounded-md text-[10px] font-bold text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
                                       Steam Connected
                                    </div>
                                 </div>
                              )}

                              {firebaseUser.socials.discord_verified && (
                                 <div className="relative group flex items-center justify-center w-4 h-4 opacity-80 hover:opacity-100 transition cursor-help">
                                    <img src="https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/discord.svg" alt="Discord" className="w-full h-full object-contain invert" />
                                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-zinc-900 border border-white/10 rounded-md text-[10px] font-bold text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
                                       Discord Connected
                                    </div>
                                 </div>
                              )}
                           </div>
                        )}
                      </div>
                    </div>

                    {community && (
                      <Link href={`/c/${community.handle}`} className="shrink-0 group mt-1">
                         <div className="flex items-center gap-3 px-3 py-2 bg-black/40 hover:bg-white/5 border border-white/5 rounded-2xl transition shadow-lg relative overflow-hidden">
                             <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition duration-500"></div>
                             <div className="text-right relative z-10 hidden sm:block">
                                <p className="text-[9px] font-bold text-indigo-400/80 uppercase tracking-widest leading-none mb-1.5">Squad</p>
                                <p className="text-xs font-black text-white group-hover:text-indigo-400 transition truncate max-w-[100px] leading-none">{community.name}</p>
                             </div>
                             <div className="w-8 h-8 rounded-xl bg-zinc-800 overflow-hidden flex items-center justify-center shrink-0 border border-white/10 group-hover:scale-105 transition relative z-10 shadow-md">
                                {community.avatar ? <img src={community.avatar} alt="Logo" className="w-full h-full object-cover" /> : <Users className="w-4 h-4 text-zinc-400" />}
                             </div>
                         </div>
                      </Link>
                    )}
                  </div>

                  {profile?.gameextrainfo && (
                    <div className="mb-4 p-3 bg-black/40 rounded-xl border border-white/5 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400"><Gamepad2 className="w-5 h-5" /></div>
                        <div className="flex-1 min-w-0"><p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Playing now</p><p className="text-sm font-bold text-white truncate">{profile.gameextrainfo}</p></div>
                    </div>
                  )}

                  {musicData?.nowPlaying?.isPlaying && (
                    <div className="mb-6 p-3 bg-black/40 rounded-xl border border-[#1DB954]/20 flex items-center gap-3 group relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-[#1DB954]/5 to-transparent opacity-0 group-hover:opacity-100 transition duration-500"></div>
                        <div className="w-10 h-10 rounded-lg bg-[#1DB954]/10 flex items-center justify-center text-[#1DB954] overflow-hidden relative shrink-0 shadow-lg shadow-[#1DB954]/10">
                           {musicData.nowPlaying.albumArt ? <img src={musicData.nowPlaying.albumArt} className="w-full h-full object-cover" alt="Album" /> : <Music className="w-5 h-5" />}
                        </div>
                        <div className="flex-1 min-w-0 relative z-10">
                           <p className="text-[10px] font-bold text-[#1DB954] uppercase tracking-wider flex items-center gap-1.5 mb-0.5"><Music className="w-3 h-3" /> Listening on Spotify</p>
                           <a href={musicData.nowPlaying.url} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-white truncate block hover:underline leading-tight">{musicData.nowPlaying.title}</a>
                           <p className="text-xs text-zinc-400 truncate mt-0.5">{musicData.nowPlaying.artist}</p>
                        </div>
                        <div className="flex items-end gap-1 h-4 px-1 shrink-0">
                           <span className="w-1 bg-[#1DB954] rounded-full animate-pulse h-full"></span>
                           <span className="w-1 bg-[#1DB954] rounded-full animate-pulse h-2/3" style={{ animationDelay: '200ms' }}></span>
                           <span className="w-1 bg-[#1DB954] rounded-full animate-pulse h-4/5" style={{ animationDelay: '400ms' }}></span>
                        </div>
                    </div>
                  )}
                  
                  {firebaseUser.bio && (
                    <div className="mb-5 bg-black/20 p-4 rounded-xl border border-white/5">
                      <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">ABOUT ME</h3>
                      <div className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap font-medium">{firebaseUser.bio}</div>
                    </div>
                  )}

                  {firebaseUser.customLinks && firebaseUser.customLinks.length > 0 && (
                    <div className="mb-5">
                       <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">LINKS</h3>
                       <div className="space-y-2">
                         {firebaseUser.customLinks.map((link: any, idx: number) => (
                           <a key={idx} href={ensureProtocol(link.url)} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/5 hover:bg-white/10 transition group">
                             <div className="flex items-center gap-3">
                               <Globe className="w-4 h-4 text-zinc-400" />
                               <span className="font-bold text-sm text-zinc-300 group-hover:text-white transition">{link.label}</span>
                             </div>
                             <ArrowUpRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition" />
                           </a>
                         ))}
                       </div>
                    </div>
                  )}

                  {firebaseUser.gear && Object.values(firebaseUser.gear).some((val: any) => val && (val as string).trim() !== "") && (
                    <div className="mb-2">
                       <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">GEAR & SPECS</h3>
                       <div className="space-y-2">
                          {firebaseUser.gear.cpu && (
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-black/40 border border-white/5">
                               <Cpu className="w-4 h-4 text-zinc-400 shrink-0" />
                               <div className="min-w-0 flex-1"><p className="text-[9px] text-zinc-500 font-bold uppercase leading-none mb-1">CPU</p><p className="text-xs font-bold text-zinc-200 truncate">{firebaseUser.gear.cpu}</p></div>
                            </div>
                          )}
                          {firebaseUser.gear.gpu && (
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-black/40 border border-white/5">
                               <Cpu className="w-4 h-4 text-zinc-400 shrink-0" />
                               <div className="min-w-0 flex-1"><p className="text-[9px] text-zinc-500 font-bold uppercase leading-none mb-1">GPU</p><p className="text-xs font-bold text-zinc-200 truncate">{firebaseUser.gear.gpu}</p></div>
                            </div>
                          )}
                          {firebaseUser.gear.ram && (
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-black/40 border border-white/5">
                               <Cpu className="w-4 h-4 text-zinc-400 shrink-0" />
                               <div className="min-w-0 flex-1"><p className="text-[9px] text-zinc-500 font-bold uppercase leading-none mb-1">RAM</p><p className="text-xs font-bold text-zinc-200 truncate">{firebaseUser.gear.ram}</p></div>
                            </div>
                          )}
                          {firebaseUser.gear.monitor && (
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-black/40 border border-white/5">
                               <Monitor className="w-4 h-4 text-zinc-400 shrink-0" />
                               <div className="min-w-0 flex-1"><p className="text-[9px] text-zinc-500 font-bold uppercase leading-none mb-1">Monitor</p><p className="text-xs font-bold text-zinc-200 truncate">{firebaseUser.gear.monitor}</p></div>
                            </div>
                          )}
                          {firebaseUser.gear.mouse && (
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-black/40 border border-white/5">
                               <Mouse className="w-4 h-4 text-zinc-400 shrink-0" />
                               <div className="min-w-0 flex-1"><p className="text-[9px] text-zinc-500 font-bold uppercase leading-none mb-1">Mouse</p><p className="text-xs font-bold text-zinc-200 truncate">{firebaseUser.gear.mouse}</p></div>
                            </div>
                          )}
                          {firebaseUser.gear.keyboard && (
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-black/40 border border-white/5">
                               <Keyboard className="w-4 h-4 text-zinc-400 shrink-0" />
                               <div className="min-w-0 flex-1"><p className="text-[9px] text-zinc-500 font-bold uppercase leading-none mb-1">Keyboard</p><p className="text-xs font-bold text-zinc-200 truncate">{firebaseUser.gear.keyboard}</p></div>
                            </div>
                          )}
                          {firebaseUser.gear.headset && (
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-black/40 border border-white/5">
                               <Headphones className="w-4 h-4 text-zinc-400 shrink-0" />
                               <div className="min-w-0 flex-1"><p className="text-[9px] text-zinc-500 font-bold uppercase leading-none mb-1">Headset</p><p className="text-xs font-bold text-zinc-200 truncate">{firebaseUser.gear.headset}</p></div>
                            </div>
                          )}
                       </div>
                    </div>
                  )}
                  
                </div>
              </div>

              {/* RIGHT GRID - Inherits min-h-0 and uses overflow-y-auto to scroll internally */}
              <div className="lg:col-span-8 h-full overflow-y-auto sleek-scrollbar pb-6">
                <ProfileGrid user={firebaseUser} steam={steamData} spotify={musicData} />
              </div>

            </div>
          </div>
        </div>
      )}
    </EnterScreen>
  );
}