"use client";

import { useState, useEffect } from 'react';
import {
  Trophy, Gamepad2, Link as LinkIcon, ExternalLink, 
  Swords, ArrowUpRight, Clock, Award, Music, ChevronRight, Video
} from 'lucide-react';
import ValorantModal from '@/components/ValorantModal';

const VerifiedBadge = () => (
  <span className="inline-flex ml-1.5 text-blue-400 align-middle" title="Verified Link">
    <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" /></svg>
  </span>
);

const ensureProtocol = (url: string) => {
  if (!url) return "#";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("mailto:")) return url;
  return `https://${url}`;
};

const getEmbedData = (rawUrl: string) => {
  if (!rawUrl) return null;
  try {
    let safeUrl = rawUrl.trim();
    if (!safeUrl.startsWith("http://") && !safeUrl.startsWith("https://")) {
        safeUrl = "https://" + safeUrl;
    }

    const parsedUrl = new URL(safeUrl);
    const hostname = parsedUrl.hostname.toLowerCase();
    const pathname = parsedUrl.pathname;

    if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
      let videoId = '';
      let isVertical = false;

      if (hostname.includes('youtu.be')) {
        videoId = pathname.slice(1);
      } else if (pathname.includes('/shorts/')) {
        videoId = pathname.split('/shorts/')[1];
        isVertical = true;
      } else if (pathname.includes('/live/')) {
         videoId = pathname.split('/live/')[1];
      } else {
        videoId = parsedUrl.searchParams.get('v') || '';
      }

      if (videoId) {
         videoId = videoId.split('?')[0].split('&')[0];
         return { url: `https://www.youtube.com/embed/${videoId}?autoplay=0`, isVertical };
      }
    }

    if (hostname.includes('twitch.tv')) {
      let clipId = '';
      if (hostname.includes('clips.twitch.tv')) {
        clipId = pathname.slice(1);
      } else if (pathname.includes('/clip/')) {
        clipId = pathname.split('/clip/')[1];
      }
      if (clipId) {
         clipId = clipId.split('?')[0];
         const domain = typeof window !== 'undefined' ? window.location.hostname : 'pulsegg.in';
         return { url: `https://clips.twitch.tv/embed?clip=${clipId}&parent=${domain}&autoplay=false`, isVertical: false };
      }
    }

    if (hostname.includes('medal.tv')) {
      const match = pathname.match(/\/clips\/([a-zA-Z0-9]+)/);
      if (match && match[1]) {
        return { url: `https://medal.tv/clip/${match[1]}?autoplay=0`, isVertical: false };
      }
    }
  } catch (e) {
    return null;
  }
  return null;
};

export default function ProfileGrid({
  user,
  steam: initialSteam,
  spotify 
}: {
  user: any,
  steam: any,
  spotify?: any
}) {
  const [activeTab, setActiveTab] = useState("overview");
  const [steam, setSteam] = useState(initialSteam);
  const [fullValorantData, setFullValorantData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const [isValorantModalOpen, setIsValorantModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const promises = [];

        if (user.steamId) {
          promises.push(
            fetch(`/api/steam?steamId=${user.steamId}`)
              .then(res => res.json())
              .then(data => setSteam((prev: any) => ({ ...prev, ...data })))
          );
        }

        if (user.gaming?.valorant?.name && user.gaming?.valorant?.tag) {
          promises.push(
            fetch(`/api/valorant?name=${encodeURIComponent(user.gaming.valorant.name)}&tag=${encodeURIComponent(user.gaming.valorant.tag)}&region=${user.gaming.valorant.region || 'na'}`)
              .then(res => res.json())
              .then(data => {
                  setSteam((prev: any) => ({ ...prev, valorantData: data.profile || data }));
                  setFullValorantData(data);
              })
          );
        }

        await Promise.all(promises);
      } catch (error) {
        console.error('Failed to fetch gaming data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (!hasFetched && (!steam.profile && (user.steamId || user.gaming?.valorant))) {
        setHasFetched(true);
        fetchData();
    }
  }, [user.steamId, user.gaming?.valorant, steam.profile, hasFetched]);

  const { profile, recentGames, level, gameCount, heroGameProgress, valorantData } = steam;
  const heroGame = recentGames?.[0];
  const isLightCard = user.primary?.toLowerCase() === '#ffffff' || user.primary?.toLowerCase() === 'white';
  
  // Force rigorous number parsing so sliders bind correctly 
  const opacity = user.cardOpacity !== undefined ? Number(user.cardOpacity) : 0.8;
  const blur = user.cardBlur !== undefined ? Number(user.cardBlur) : 10;
  
  function hexToRgba(hex: string, alpha: number) {
    if (!hex) return `rgba(30, 31, 34, ${alpha})`;
    hex = hex.replace('#', '');
    let r = 30, g = 31, b = 34;
    if (hex.length === 3) {
        r = parseInt(hex[0]+hex[0], 16);
        g = parseInt(hex[1]+hex[1], 16);
        b = parseInt(hex[2]+hex[2], 16);
    } else if (hex.length === 6) {
        r = parseInt(hex.slice(0, 2), 16);
        g = parseInt(hex.slice(2, 4), 16);
        b = parseInt(hex.slice(4, 6), 16);
    }
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  const cardStyle = { 
    backgroundColor: hexToRgba(user.primary || '#1e1f22', opacity),
    backdropFilter: `blur(${blur}px)`,
    WebkitBackdropFilter: `blur(${blur}px)`
  };

  let titleColor = "text-white";
  let subtitleColor = "text-zinc-300";
  let mutedColor = "text-zinc-500";
  let iconBg = "bg-white/5";
  let hoverIconBg = "group-hover:bg-white/10";

  if (isLightCard) {
    const shouldUseNameColor = user.nameEffect !== 'gradient' && user.nameColor !== 'white';
    if (shouldUseNameColor) {
      titleColor = `text-${user.nameColor}`;
      subtitleColor = `text-${user.nameColor} opacity-80`;
      mutedColor = `text-${user.nameColor} opacity-60`;
      iconBg = `bg-${user.nameColor} bg-opacity-10`;
      hoverIconBg = `group-hover:bg-${user.nameColor}/20`;
    } else {
      titleColor = "text-black";
      subtitleColor = "text-zinc-700";
      mutedColor = "text-zinc-500";
      iconBg = "bg-black/5";
      hoverIconBg = "group-hover:bg-black/10";
    }
  }

  const renderWidget = (id: string, key: string, size: string) => {
    const colSpanClass = size === 'full' ? 'col-span-1 md:col-span-2' : 'col-span-1';

    switch (id) {
      case 'hero':
        if (!heroGame) return null;
        return (
          <div key={key} className={`${colSpanClass} relative h-[240px] rounded-2xl overflow-hidden group shadow-xl`} style={{ border: '1px solid rgba(255,255,255,0.05)', ...cardStyle }}>
            <img
              src={`https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${heroGame.appid}/library_hero.jpg`}
              alt={heroGame.name}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-700 opacity-60 group-hover:opacity-80"
              onError={(e) => (e.currentTarget.style.display = 'none')}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-black/40 to-transparent"></div>

            <div className="absolute bottom-0 left-0 w-full p-5">
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

              {heroGameProgress !== null && (
                <div className="mt-3">
                  <div className="flex justify-between text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                    <span>Game Completion</span>
                    <span className="text-white">{heroGameProgress}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-black/50 rounded-full overflow-hidden border border-white/5">
                    <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-1000" style={{ width: `${heroGameProgress}%` }}></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 'spotify':
        if (!spotify) return null;
        return (
          <div key={key} style={cardStyle} className={`${colSpanClass} p-4 rounded-2xl border border-white/10 hover:border-white/20 transition h-full flex flex-col group min-h-[140px]`}>
            <div className="flex justify-between items-center mb-3">
              <div className={`p-2 rounded-xl bg-[#1DB954]/10 text-[#1DB954] transition`}><Music className="w-4 h-4" /></div>
              <p className={`text-[10px] font-bold uppercase tracking-widest ${mutedColor}`}>Monthly Top Tracks</p>
            </div>
            
            <div className="space-y-2.5 flex-1 min-h-0 overflow-x-hidden">
              {spotify.topTracks && spotify.topTracks.length > 0 ? (
                spotify.topTracks.map((track: any) => (
                  <a key={track.id} href={track.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 group/track hover:bg-white/5 p-1.5 -m-1.5 rounded-lg transition-all">
                    <div className="relative w-10 h-10 rounded-md overflow-hidden bg-zinc-800 shrink-0 shadow-sm flex items-center justify-center">
                      {track.albumArt ? <img src={track.albumArt} alt={track.title} className="w-full h-full object-cover" /> : <Music className={`w-4 h-4 ${mutedColor}`} />}
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover/track:opacity-100 transition">
                        <ExternalLink className="w-3 h-3 text-white" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-bold text-xs truncate transition ${titleColor}`}>{track.title}</p>
                      <p className={`text-[10px] truncate ${mutedColor}`}>{track.artist}</p>
                    </div>
                    <ChevronRight className={`w-3 h-3 ${mutedColor} group-hover/track:translate-x-1 transition`} />
                  </a>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center py-2">
                   <p className={`text-xs font-bold ${mutedColor}`}>No history found yet</p>
                </div>
              )}
            </div>
          </div>
        );

      case 'content':
        if (!user.socials?.youtube && !user.socials?.twitch && !user.steamId) return null;
        return (
          <div key={key} style={cardStyle} className={`${colSpanClass} rounded-2xl border border-white/10 overflow-hidden flex flex-col justify-center min-h-[140px] p-2.5 gap-2.5`}>
            {user.socials?.youtube && (
              <a
                href={user.socials.youtube.startsWith('http') ? user.socials.youtube : `https://youtube.com/${user.socials.youtube}`}
                target="_blank"
                className="flex-1 bg-gradient-to-r from-[#FF0000]/20 to-[#FF0000]/5 hover:from-[#FF0000]/40 hover:to-[#FF0000]/20 border border-[#FF0000]/30 rounded-xl p-3 flex items-center justify-between group transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#0a0a0c] border border-white/5 flex items-center justify-center shadow-lg group-hover:scale-110 transition shrink-0">
                     <img src="https://cdn.simpleicons.org/youtube/FF0000" alt="YouTube" className="w-5 h-5 object-contain" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-[#FF0000] uppercase tracking-wider leading-none mb-1">Subscribe</p>
                    <p className={`text-sm font-bold ${titleColor} truncate max-w-[120px] leading-none`}>YouTube</p>
                  </div>
                </div>
                <ExternalLink className={`w-3 h-3 ${mutedColor} group-hover:text-white`} />
              </a>
            )}
            {user.socials?.twitch && (
              <a
                href={`https://twitch.tv/${user.socials.twitch}`}
                target="_blank"
                className="flex-1 bg-gradient-to-r from-[#9146FF]/20 to-[#9146FF]/5 hover:from-[#9146FF]/40 hover:to-[#9146FF]/20 border border-[#9146FF]/30 rounded-xl p-3 flex items-center justify-between group transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#0a0a0c] border border-white/5 flex items-center justify-center shadow-lg group-hover:scale-110 transition shrink-0">
                     <img src="https://cdn.simpleicons.org/twitch/9146FF" alt="Twitch" className="w-5 h-5 object-contain" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-[#9146FF] uppercase tracking-wider leading-none mb-1">Watch Live</p>
                    <p className={`text-sm font-bold ${titleColor} truncate max-w-[120px] leading-none`}>Twitch</p>
                  </div>
                </div>
                <ExternalLink className={`w-3 h-3 ${mutedColor} group-hover:text-white`} />
              </a>
            )}
            {user.steamId && (
              <a
                href={`https://steamcommunity.com/profiles/${user.steamId}`}
                target="_blank"
                className="flex-1 bg-gradient-to-r from-[#66c0f4]/20 to-[#66c0f4]/5 hover:from-[#66c0f4]/40 hover:to-[#66c0f4]/20 border border-[#66c0f4]/30 rounded-xl p-3 flex items-center justify-between group transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#0a0a0c] border border-white/5 flex items-center justify-center shadow-lg group-hover:scale-110 transition shrink-0">
                     <img src="https://cdn.simpleicons.org/steam/66c0f4" alt="Steam" className="w-5 h-5 object-contain" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-[#66c0f4] uppercase tracking-wider leading-none mb-1">View Profile</p>
                    <p className={`text-sm font-bold ${titleColor} truncate max-w-[100px] leading-none`}>Steam</p>
                  </div>
                </div>
                <ExternalLink className={`w-3 h-3 ${mutedColor} group-hover:text-white`} />
              </a>
            )}
          </div>
        );

      case 'valorant':
        if (!valorantData) return null;

        let winRate = 54;
        let kd = "1.12";
        let hsPercent = 24;
        let topAgentImg = "https://media.valorant-api.com/agents/eb93336a-449b-9c1b-0a54-a891f7921d69/displayicon.png";

        if (fullValorantData && fullValorantData.matches && fullValorantData.matches.length > 0) {
            let totalKills = 0, totalDeaths = 0, totalWins = 0, totalMatches = 0;
            let totalHeadshots = 0, totalShots = 0;
            
            if (fullValorantData.topAgents && fullValorantData.topAgents.length > 0) {
               topAgentImg = fullValorantData.topAgents[0].image;
               fullValorantData.topAgents.forEach((agent: any) => {
                  totalKills += agent.kills;
                  totalDeaths += agent.deaths;
                  totalWins += agent.wins;
                  totalMatches += agent.count;
               });
            }

            fullValorantData.matches.forEach((match: any) => {
               const player = match.players?.all_players?.find((p: any) => 
                   p.name.toLowerCase() === user.gaming.valorant.name.toLowerCase() && 
                   p.tag.toLowerCase() === user.gaming.valorant.tag.toLowerCase()
               );
               if (player && player.stats) {
                   totalHeadshots += player.stats.headshots || 0;
                   totalShots += (player.stats.headshots || 0) + (player.stats.bodyshots || 0) + (player.stats.legshots || 0);
               }
            });

            if (totalMatches > 0) { winRate = Math.round((totalWins / totalMatches) * 100); }
            if (totalDeaths > 0) { kd = (totalKills / totalDeaths).toFixed(2); }
            if (totalShots > 0) { hsPercent = Math.round((totalHeadshots / totalShots) * 100); }
        }

        return (
          <div 
            key={key} 
            onClick={() => setIsValorantModalOpen(true)}
            style={cardStyle}
            className={`${colSpanClass} rounded-2xl p-4 border border-white/10 cursor-pointer hover:border-white/20 transition-all hover:scale-[1.02] shadow-xl relative overflow-hidden group min-h-[140px] flex flex-col justify-between`}
          >
            <div className="flex-1 flex flex-col justify-between min-w-0">
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div className={`px-2.5 py-1 rounded-md ${iconBg} ${titleColor} flex items-center gap-1.5 border border-white/5`}>
                    <Swords className="w-3 h-3" />
                    <span className="text-[9px] font-black tracking-widest uppercase">Valorant</span>
                  </div>
                  <div className="w-10 h-10 relative drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
                    {valorantData.images?.small ? <img src={valorantData.images.small} alt="Rank" className="w-full h-full object-contain" /> : <img src="https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/17/largeicon.png" alt="Rank" className="w-full h-full object-contain" />}
                  </div>
                </div>

                <div className="mb-0.5">
                  <span className={`text-[10px] font-black ${mutedColor} tracking-widest uppercase truncate block`}>
                    {valorantData.name}#{valorantData.tag}
                  </span>
                </div>
                <h3 className={`text-2xl font-black ${titleColor} uppercase tracking-wider font-mono leading-none truncate block`}>
                  {valorantData.currenttierpatched}
                </h3>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 mt-4 mb-4 bg-black/20 p-3 rounded-xl border border-white/5 w-full">
                 <div className="flex flex-col items-center">
                    <img src={topAgentImg} alt="Top Agent" className="w-8 h-8 rounded-lg bg-black/40 border border-white/10 object-cover shadow-sm" title="Top Agent" />
                 </div>
                 <div className="text-center">
                    <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-0.5">Win %</p>
                    <p className={`text-xs sm:text-sm font-black font-mono ${winRate >= 50 ? 'text-emerald-400' : 'text-red-400'} leading-tight`}>{winRate}%</p>
                 </div>
                 <div className="text-center">
                    <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-0.5">HS %</p>
                    <p className="text-xs sm:text-sm font-black font-mono text-white leading-tight">{hsPercent}%</p>
                 </div>
                 <div className="text-center">
                    <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-0.5">K/D</p>
                    <p className="text-xs sm:text-sm font-black font-mono text-white leading-tight">{kd}</p>
                 </div>
              </div>
            </div>

            <div className="w-full flex items-center gap-3 relative z-10 mt-auto pt-2">
              <div className="flex-1 h-1.5 bg-black/40 rounded-full overflow-hidden">
                <div className="h-full bg-[#ff4655] rounded-full" style={{ width: `${valorantData.ranking_in_tier}%` }} />
              </div>
              <span className={`text-[10px] font-black ${subtitleColor} tracking-wider shrink-0`}>{valorantData.ranking_in_tier} RR</span>
            </div>
          </div>
        );

      case 'connections':
      case 'library':
        const hasConnections = user.steamId || user.socials?.discord || user.gaming?.xbox || user.gaming?.epic || user.socials?.twitter || user.socials?.instagram;
        if (!hasConnections) return null;

        return (
          <div key={key} style={cardStyle} className={`${colSpanClass} p-4 rounded-2xl border border-white/10 hover:border-white/20 transition h-full flex flex-col relative overflow-hidden group min-h-[140px]`}>
             <h3 className={`text-[10px] font-black uppercase tracking-widest mb-3 flex items-center gap-2 ${mutedColor}`}>
               Connections
             </h3>
             <div className="flex flex-col gap-2 flex-1 min-h-0 overflow-x-hidden">
                 {user.steamId && (
                   <a href={`https://steamcommunity.com/profiles/${user.steamId}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-2.5 rounded-xl bg-black/20 border border-white/5 hover:bg-white/10 transition group/link shrink-0">
                     <div className="flex items-center gap-3">
                       <div className="w-8 h-8 bg-[#171a21] rounded-xl flex items-center justify-center shrink-0 border border-white/5 shadow-sm">
                         <img src="https://cdn.simpleicons.org/steam/white" alt="Steam" className="w-4 h-4 object-contain" />
                       </div>
                       <div className="min-w-0"><p className={`text-xs font-bold ${titleColor} leading-none mb-1`}>Steam</p><p className={`text-[10px] ${mutedColor} truncate leading-none`}>{level > 0 ? `Level ${level}` : 'Connected'}</p></div>
                     </div>
                     <ExternalLink className={`w-3 h-3 ${mutedColor} group-hover/link:text-white opacity-0 group-hover/link:opacity-100 transition`} />
                   </a>
                 )}

                 {user.socials?.discord && (
                   <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/20 border border-white/5 hover:bg-white/10 transition group/link shrink-0">
                     <div className="flex items-center gap-3">
                       <div className="w-8 h-8 bg-[#5865F2] rounded-xl flex items-center justify-center text-white shrink-0 border border-white/5 shadow-sm">
                         <img src="https://cdn.simpleicons.org/discord/white" alt="Discord" className="w-4 h-4 object-contain" />
                       </div>
                       <div className="min-w-0"><p className={`text-xs font-bold ${titleColor} leading-none mb-1`}>Discord</p><p className={`text-[10px] ${mutedColor} truncate leading-none`}>{user.socials.discord}</p></div>
                     </div>
                     {user.socials.discord_verified && <VerifiedBadge />}
                   </div>
                 )}

                 {user.gaming?.xbox && (
                   <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/20 border border-white/5 hover:bg-white/10 transition group/link shrink-0">
                     <div className="flex items-center gap-3">
                       <div className="w-8 h-8 bg-[#107C10] rounded-xl flex items-center justify-center text-white shrink-0 border border-white/5 shadow-sm">
                         <img src="https://api.iconify.design/simple-icons:xbox.svg?color=white" alt="Xbox" className="w-4 h-4 object-contain" />
                       </div>
                       <div className="min-w-0"><p className={`text-xs font-bold ${titleColor} leading-none mb-1`}>Xbox</p><p className={`text-[10px] ${mutedColor} truncate leading-none`}>{user.gaming.xbox}</p></div>
                     </div>
                   </div>
                 )}

                 {user.gaming?.epic && (
                   <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/20 border border-white/5 hover:bg-white/10 transition group/link shrink-0">
                     <div className="flex items-center gap-3">
                       <div className="w-8 h-8 bg-[#313131] rounded-xl flex items-center justify-center text-white shrink-0 border border-white/5 shadow-sm">
                         <img src="https://cdn.simpleicons.org/epicgames/white" alt="Epic Games" className="w-4 h-4 object-contain" />
                       </div>
                       <div className="min-w-0"><p className={`text-xs font-bold ${titleColor} leading-none mb-1`}>Epic Games</p><p className={`text-[10px] ${mutedColor} truncate leading-none`}>{user.gaming.epic}</p></div>
                     </div>
                   </div>
                 )}

                 {user.socials?.twitter && (
                   <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/20 border border-white/5 hover:bg-white/10 transition group/link shrink-0">
                     <div className="flex items-center gap-3">
                       <div className="w-8 h-8 bg-zinc-800 rounded-xl flex items-center justify-center shrink-0 border border-white/5 shadow-sm">
                         <img src="https://cdn.simpleicons.org/x/white" alt="X" className="w-4 h-4 object-contain" />
                       </div>
                       <div className="min-w-0"><p className={`text-xs font-bold ${titleColor} leading-none mb-1`}>Twitter</p><p className={`text-[10px] ${mutedColor} truncate leading-none`}>{user.socials.twitter}</p></div>
                     </div>
                   </div>
                 )}

                 {user.socials?.instagram && (
                   <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/20 border border-white/5 hover:bg-white/10 transition group/link shrink-0">
                     <div className="flex items-center gap-3">
                       <div className="w-8 h-8 bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] rounded-xl flex items-center justify-center shrink-0 border border-white/5 shadow-sm">
                         <img src="https://cdn.simpleicons.org/instagram/white" alt="Instagram" className="w-4 h-4 object-contain" />
                       </div>
                       <div className="min-w-0"><p className={`text-xs font-bold ${titleColor} leading-none mb-1`}>Instagram</p><p className={`text-[10px] ${mutedColor} truncate leading-none`}>{user.socials.instagram}</p></div>
                     </div>
                   </div>
                 )}
             </div>
          </div>
        );

      case 'stats':
        return (
          <div key={key} style={cardStyle} className={`${colSpanClass} p-4 rounded-2xl border border-white/10 hover:border-white/20 transition h-full flex flex-col justify-between group min-h-[140px]`}>
            <div className="flex justify-between items-start mb-3">
              <div className={`p-2 rounded-xl ${iconBg} ${hoverIconBg} transition ${titleColor}`}><Trophy className="w-4 h-4" /></div>
              <div className="text-right">
                <p className={`text-[10px] font-bold uppercase ${mutedColor}`}>Level</p>
                <p className={`text-2xl font-black ${titleColor}`}>{level}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <Gamepad2 className={`w-3 h-3 ${mutedColor}`} />
                  <span className={`text-[9px] font-bold uppercase tracking-widest ${mutedColor}`}>Owned</span>
                </div>
                <p className={`text-lg font-bold ${titleColor}`}>{gameCount}</p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1.5 mb-1 justify-end">
                  <Clock className={`w-3 h-3 ${mutedColor}`} />
                  <span className={`text-[9px] font-bold uppercase tracking-widest ${mutedColor}`}>Played</span>
                </div>
                <p className={`text-lg font-bold ${titleColor}`}>
                  {heroGame ? Math.round(heroGame.playtime_forever / 60) : 0}<span className="text-xs font-normal opacity-50 ml-1">h</span>
                </p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-white/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Award className={`w-3 h-3 ${mutedColor}`} />
                  <span className={`text-[9px] font-bold uppercase tracking-widest ${mutedColor}`}>Achievements</span>
                </div>
                <p className={`text-xs font-black ${titleColor}`}>{steam.totalAchievements || 0}</p>
              </div>
            </div>
          </div>
        );

      default: return null;
    }
  };

  return (
    <div className="space-y-4" suppressHydrationWarning>
      
      {/* Only show tabs if Clips exist */}
      {user.clips && user.clips.length > 0 && (
        <div className="flex items-center gap-6 px-2 mb-2 border-b border-white/5 pb-3">
          <button
            onClick={() => setActiveTab("overview")}
            className={`${activeTab === "overview" ? "text-white border-white" : "text-zinc-500 hover:text-white border-transparent"} font-bold transition border-b-2 pb-1`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("clips")}
            className={`${activeTab === "clips" ? "text-white border-white" : "text-zinc-500 hover:text-white border-transparent"} font-bold transition border-b-2 pb-1`}
          >
            Clips
          </button>
        </div>
      )}

      {activeTab === "overview" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(user.layout || []).map((widget: any, index: number) => {
            const id = widget.id || widget.mapValue?.fields?.id?.stringValue;
            const enabled = widget.enabled !== undefined ? widget.enabled : widget.mapValue?.fields?.enabled?.booleanValue;
            const size = widget.size || widget.mapValue?.fields?.size?.stringValue || 'half';
            
            if (!id || id === 'gear') return null;

            return enabled ? renderWidget(id, `${id}-${index}`, size) : null;
          })}
        </div>
      ) : (
        <div className="columns-1 md:columns-2 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
           {user.clips.map((clip: any, idx: number) => {
              const embedData = getEmbedData(clip.url);
              
              return (
                 <div key={idx} style={cardStyle} className="mb-4 border border-white/10 rounded-2xl overflow-hidden flex flex-col break-inside-avoid shadow-lg">
                    {embedData ? (
                       <div className={`w-full ${embedData.isVertical ? 'aspect-[9/16]' : 'aspect-video'} bg-black relative`}>
                          <iframe src={embedData.url} className="absolute inset-0 w-full h-full" frameBorder="0" allowFullScreen allow="autoplay; fullscreen" />
                       </div>
                    ) : (
                       <div className="w-full aspect-video bg-black/50 flex flex-col items-center justify-center p-6 text-center border-b border-white/5">
                          <Video className="w-8 h-8 text-zinc-600 mb-2" />
                          <p className="text-sm font-bold text-zinc-500">URL format unsupported</p>
                          <a href={clip.url} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-400 mt-2 hover:underline break-all max-w-full">
                             View Clip Link
                          </a>
                       </div>
                    )}
                    <div className="p-4 bg-black/40 flex items-center justify-between">
                       <p className={`font-bold text-sm ${titleColor} truncate`}>{clip.title || `Featured Clip ${idx + 1}`}</p>
                       <ExternalLink className={`w-4 h-4 ${mutedColor}`} />
                    </div>
                 </div>
              );
           })}
        </div>
      )}

      <ValorantModal 
        isOpen={isValorantModalOpen} 
        onClose={() => setIsValorantModalOpen(false)} 
        valName={user.gaming?.valorant?.name || ''} 
        valTag={user.gaming?.valorant?.tag || ''} 
        valRegion={user.gaming?.valorant?.region || 'na'} 
      />
    </div>
  );
}