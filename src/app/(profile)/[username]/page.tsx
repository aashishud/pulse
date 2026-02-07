import { getSteamProfile, getRecentlyPlayed, getSteamLevel, getOwnedGamesCount, getGameProgress } from '@/lib/steam';
import { getValorantProfile } from '@/lib/valorant';
import { Sparkles, Gamepad2, Trophy, Clock, MapPin, Link as LinkIcon, ExternalLink, Ghost, Music, LayoutGrid, Zap, Swords, Youtube, Twitch, Globe, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Inter, Space_Grotesk, Press_Start_2P, Cinzel } from 'next/font/google';
import ShareButton from '@/components/ShareButton';
import { Metadata } from 'next';
import BadgeRack from '@/components/BadgeRack';
import AvatarDecoration from '@/components/AvatarDecoration';
import CursorEffects from '@/components/CursorEffects';
import ProfileGrid from '@/components/ProfileGrid';
import GGButton from '@/components/GGButton';

// Load Fonts
const inter = Inter({ subsets: ['latin'], display: 'swap' });
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], display: 'swap' });
const pressStart = Press_Start_2P({ weight: '400', subsets: ['latin'], display: 'swap' });
const cinzel = Cinzel({ subsets: ['latin'], display: 'swap' });

// Ensure fresh data on every request so Likes/Status updates immediately
export const revalidate = 0;

interface Props {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  return {
    title: `${username} | Pulse`,
    description: `Check out ${username}'s gaming profile on Pulse.`,
    metadataBase: new URL('https://pulsegg.in'),
  };
}

async function getFirebaseUser(username: string) {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${username}`;

  try {
    // Revalidate 0 ensures we get the latest GGs count
    const res = await fetch(url, { next: { revalidate: 0 } });
    if (!res.ok) return null;

    const data = await res.json();
    const fields = data.fields;

    const isVerified = (field: any) => field?.booleanValue || false;

    // Helper to get array from Firestore map
    const getMapArray = (field: any) => {
      return field?.arrayValue?.values?.map((v: any) => {
        const map = v.mapValue.fields;
        return {
          label: map.label.stringValue,
          url: map.url.stringValue
        }
      }) || [];
    };

    // Default Layout
    const defaultLayout = [
      { mapValue: { fields: { id: { stringValue: "hero" }, enabled: { booleanValue: true }, size: { stringValue: 'full' } } } },
      { mapValue: { fields: { id: { stringValue: "content" }, enabled: { booleanValue: true }, size: { stringValue: 'half' } } } },
      { mapValue: { fields: { id: { stringValue: "stats" }, enabled: { booleanValue: true }, size: { stringValue: 'half' } } } },
      { mapValue: { fields: { id: { stringValue: "valorant" }, enabled: { booleanValue: true }, size: { stringValue: 'half' } } } },
      { mapValue: { fields: { id: { stringValue: "library" }, enabled: { booleanValue: true }, size: { stringValue: 'half' } } } },
    ];

    return {
      // Pass the username as ID for the GG button to know which doc to update
      id: username,
      ggs: fields.ggs?.integerValue ? parseInt(fields.ggs.integerValue) : 0,
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
      bio: fields.bio?.stringValue || "",
      customLinks: getMapArray(fields.customLinks),
      layout: fields.layout?.arrayValue?.values || defaultLayout,
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
    <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" /></svg>
  </span>
);

export default async function ProfilePage({ params }: Props) {
  const { username } = await params;
  const firebaseUser = await getFirebaseUser(username);

  // Use NEXT_PUBLIC_ROOT_DOMAIN which should be set in Coolify
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'www.pulsegg.in';
  const protocol = 'https'; // Always use https in production

  const dashboardUrl = `${protocol}://${rootDomain}/dashboard`;
  const homeUrl = `${protocol}://${rootDomain}`;
  const signupUrl = `${protocol}://${rootDomain}/signup?handle=${username}`;

  if (!firebaseUser) {
    return (
      <div className="min-h-screen bg-[#0a0a0c] text-white flex flex-col items-center justify-center font-sans p-4">
        <h1 className="text-4xl font-black mb-2 tracking-tight">@{username}</h1>
        <p className="text-zinc-500 mb-8">This handle is available.</p>
        <a href={signupUrl} className="bg-white text-black px-8 py-3 rounded-lg font-bold hover:bg-zinc-200 transition">Claim Handle</a>
      </div>
    );
  }

  // Generate Badges Logic
  const badges = [];
  if (firebaseUser.steamId) badges.push('steam');
  if (firebaseUser.socials.discord_verified) badges.push('discord');

  // Fetch Steam & Valorant Data
  let profile = null;
  let recentGames: any[] = [];
  let level = 0;
  let gameCount = 0;
  let heroGameProgress = null;
  let valorantData = null;

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

  const [
    steamProfile,
    steamGames,
    steamLevel,
    steamGameCount,
    valProfile
  ] = await Promise.all(promises);

  profile = steamProfile;
  recentGames = steamGames || [];
  level = steamLevel || 0;
  gameCount = steamGameCount || 0;
  valorantData = valProfile;

  if (recentGames.length > 0 && firebaseUser.steamId) {
    heroGameProgress = await getGameProgress(firebaseUser.steamId, recentGames[0].appid);
  }

  const joinDate = profile?.timecreated ? new Date(profile.timecreated * 1000) : new Date();
  const yearsOnSteam = new Date().getFullYear() - joinDate.getFullYear();

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

  // Prepare Steam Data prop for Client Component
  const steamData = {
    profile: steamProfile,
    recentGames: steamGames || [],
    level: steamLevel || 0,
    gameCount: steamGameCount || 0,
    heroGameProgress,
    valorantData: valProfile,
    totalAchievements: "1,204" // Hardcoded as placeholder for now, pending API expansion
  };

  return (
    <div className={`min-h-screen bg-[#111214] text-white ${fontClass} overflow-x-hidden`} suppressHydrationWarning>
      <CursorEffects type={firebaseUser.cursorTrail} />

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
                  <AvatarDecoration type={firebaseUser.avatarDecoration}>
                    <div className="w-32 h-32 rounded-full p-1.5 bg-[#1e1f22] relative z-10">
                      <Image src={avatarSource} alt="Avatar" fill className="rounded-full object-cover bg-zinc-900" unoptimized />
                    </div>
                  </AvatarDecoration>
                  {profile?.gameextrainfo && (
                    <div className="absolute bottom-2 right-2 w-6 h-6 rounded-full border-[4px] border-[#1e1f22] bg-green-500 z-20" title="Online"></div>
                  )}
                </div>

                <div className="mb-2">
                  <h1 className={nameClasses} style={nameStyle}>{displayName}</h1>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-zinc-400 font-medium">@{username}</p>
                    <BadgeRack badgeList={badges} />
                  </div>
                </div>

                {/* GG BUTTON PLACEMENT */}
                <div className="mb-6">
                  <GGButton targetUserId={firebaseUser.id} initialCount={firebaseUser.ggs} />
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
                  {firebaseUser.steamId && <div className="flex items-center justify-between group"><div className="flex items-center gap-3"><div className="w-8 h-8 bg-[#171a21] rounded flex items-center justify-center"><svg className="w-5 h-5 fill-white" viewBox="0 0 24 24"><path d="M11.979 0C5.352 0 .002 5.35.002 11.95c0 5.63 3.863 10.33 9.056 11.59-.115-.815-.04-1.637.28-2.392l.84-2.81c-.244-.765-.333-1.683-.153-2.61.547-2.66 3.102-4.32 5.714-3.715 2.613.604 4.234 3.25 3.687 5.91-.4 1.94-2.022 3.355-3.86 3.593l-.865 2.92c4.467-1.35 7.9-5.26 8.3-9.98.028-.27.042-.54.042-.814C23.956 5.35 18.605 0 11.98 0zm6.54 12.35c.78.18 1.265.98 1.085 1.776-.18.797-.97.94-1.75.76-.78-.18-1.264-.98-1.085-1.776.18-.798.97-.94 1.75-.76zm-5.46 3.7c-.035 1.54 1.06 2.87 2.53 3.11l.245-.82c-.815-.224-1.423-1.04-1.396-1.99.027-.95.7-1.706 1.543-1.83l.255-.86c-1.472.03-2.65 1.13-3.176 2.39zm-3.045 2.5c-.755.12-1.395-.385-1.43-1.127-.035-.742.53-1.413 1.285-1.532.755-.12 1.394.385 1.43 1.127.034.74-.53 1.41-1.285 1.53z" /></svg></div><div><p className="text-sm font-bold">Steam</p><p className="text-[10px] md:text-xs text-zinc-500">{level > 0 ? `Level ${level}` : 'Connected'}</p></div></div><VerifiedBadge /></div>}
                  {firebaseUser.socials.discord && <div className="flex items-center justify-between group"><div className="flex items-center gap-3"><div className="w-8 h-8 bg-[#5865F2] rounded flex items-center justify-center text-white"><svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" /></svg></div><div><p className="text-sm font-bold">Discord</p><p className="text-[10px] md:text-xs text-zinc-500">{firebaseUser.socials.discord}</p></div></div>{firebaseUser.socials.discord_verified && <VerifiedBadge />}</div>}
                  {firebaseUser.gaming.xbox && <div className="flex items-center justify-between group"><div className="flex items-center gap-3"><div className="w-8 h-8 bg-[#107C10] rounded flex items-center justify-center font-bold text-xs">X</div><div><p className="text-sm font-bold">Xbox</p><p className="text-xs text-zinc-500">{firebaseUser.gaming.xbox}</p></div></div></div>}
                  {firebaseUser.gaming.epic && <div className="flex items-center justify-between group"><div className="flex items-center gap-3"><div className="w-8 h-8 bg-[#313131] rounded flex items-center justify-center font-bold text-xs">E</div><div><p className="text-sm font-bold">Epic Games</p><p className="text-xs text-zinc-500">{firebaseUser.gaming.epic}</p></div></div></div>}
                  {firebaseUser.socials.twitter && <div className="flex items-center justify-between group"><div className="flex items-center gap-3"><div className="w-8 h-8 bg-zinc-800 rounded flex items-center justify-center"><svg className="w-3 h-3 fill-white" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg></div><div><p className="text-sm font-bold">Twitter</p><p className="text-xs text-zinc-500">{firebaseUser.socials.twitter}</p></div></div></div>}
                  {firebaseUser.socials.instagram && <div className="flex items-center justify-between group"><div className="flex items-center gap-3"><div className="w-8 h-8 bg-zinc-800 rounded flex items-center justify-center"><svg className="w-3 h-3 fill-white" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg></div><div><p className="text-sm font-bold">Instagram</p><p className="text-xs text-zinc-500">{firebaseUser.socials.instagram}</p></div></div></div>}
                </div>
              </div>
            </div>
          </div>

          {/* WIDGET BOARD (Right Column) - Handled by Client Component */}
          <div className="lg:col-span-8">
            <ProfileGrid user={firebaseUser} steam={steamData} />
          </div>

        </div>
      </div>
    </div>
  );
}