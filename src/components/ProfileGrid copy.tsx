"use client";

import { useState, useEffect } from 'react';
import {
  Trophy, Gamepad2, Link as LinkIcon, ExternalLink, LayoutGrid,
  Youtube, Twitch, Swords, Globe, ArrowUpRight, Clock, Award, Loader2,
  Cpu, Mouse, Keyboard, Monitor, Headphones, Music, ChevronRight
} from 'lucide-react';

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
  const [loading, setLoading] = useState(false);

  // Theme Helpers
  const isLightCard = user.primary?.toLowerCase() === '#ffffff' || user.primary?.toLowerCase() === 'white';
  const cardStyle = { backgroundColor: `${user.primary}E6` };

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

  const {
    profile,
    recentGames,
    level,
    gameCount,
    heroGameProgress,
    valorantData
  } = steam;

  const heroGame = recentGames?.[0];
  const otherGames = recentGames?.slice(1) || [];

  const renderWidget = (id: string, key: string, size: string) => {
    const colSpanClass = size === 'full' ? 'col-span-1 md:col-span-2' : 'col-span-1';

    switch (id) {
      case 'hero':
        if (!heroGame) return null;
        return (
          <div key={key} className={`${colSpanClass} relative h-[260px] rounded-2xl overflow-hidden group border border-white/10 bg-zinc-900 shadow-xl`}>
            <img
              src={`https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${heroGame.appid}/library_hero.jpg`}
              alt={heroGame.name}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-700 opacity-60 group-hover:opacity-80"
              onError={(e) => (e.currentTarget.style.display = 'none')}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-black/40 to-transparent"></div>
            <div className="absolute bottom-0 left-0 w-full p-6">
              <h2 className="text-2xl md:text-3xl font-black text-white leading-tight line-clamp-1">{heroGame.name}</h2>
              <p className="text-sm text-zinc-300 font-medium mt-1">{Math.round(heroGame.playtime_2weeks / 60 * 10) / 10} hours past 2 weeks</p>
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

      case 'spotify':
        if (!spotify || !spotify.topTracks || spotify.topTracks.length === 0) return null;
        return (
          <div key={key} style={cardStyle} className={`${colSpanClass} backdrop-blur-md p-5 rounded-2xl border border-white/10 hover:border-white/20 transition h-full flex flex-col group min-h-[160px]`}>
            <div className="flex justify-between items-center mb-4">
              <div className={`p-2.5 rounded-xl bg-[#1DB954]/10 text-[#1DB954] transition`}>
                <Music className="w-4 h-4" />
              </div>
              <p className={`text-[10px] font-bold uppercase tracking-widest ${mutedColor}`}>Monthly Top Tracks</p>
            </div>
            <div className="space-y-3 flex-1">
              {spotify.topTracks.map((track: any, i: number) => (
                <a key={track.id} href={track.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 group/track hover:bg-white/5 p-1 -m-1 rounded-lg transition-all">
                  <div className="relative w-10 h-10 rounded-md overflow-hidden bg-zinc-800 shrink-0 shadow-sm">
                    <img src={track.albumArt} alt={track.title} className="w-full h-full object-cover" />
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
              ))}
            </div>
          </div>
        );

      case 'content':
        if (!user.socials.youtube && !user.socials.twitch && !user.steamId) return null;
        return (
          <div key={key} style={cardStyle} className={`${colSpanClass} backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden flex flex-col justify-center min-h-[140px] p-2 gap-2`}>
            {user.socials.youtube && (
              <a href={ensureProtocol(user.socials.youtube)} target="_blank" className="flex-1 bg-[#FF0000]/10 border border-[#FF0000]/30 rounded-xl p-3 flex items-center justify-between group transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white text-[#FF0000] flex items-center justify-center shadow-lg group-hover:scale-110 transition"><Youtube className="w-4 h-4 fill-current" /></div>
                  <div><p className="text-[10px] font-bold text-[#FF0000] uppercase tracking-wider">YouTube</p></div>
                </div>
                <ExternalLink className={`w-3 h-3 ${mutedColor}`} />
              </a>
            )}
            {user.socials.twitch && (
              <a href={`https://twitch.tv/${user.socials.twitch}`} target="_blank" className="flex-1 bg-[#9146FF]/10 border border-[#9146FF]/30 rounded-xl p-3 flex items-center justify-between group transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white text-[#9146FF] flex items-center justify-center shadow-lg group-hover:scale-110 transition"><Twitch className="w-4 h-4 fill-current" /></div>
                  <div><p className="text-[10px] font-bold text-[#9146FF] uppercase tracking-wider">Twitch</p></div>
                </div>
                <ExternalLink className={`w-3 h-3 ${mutedColor}`} />
              </a>
            )}
          </div>
        );

      case 'valorant':
        if (!valorantData) return null;
        return (
          <div key={key} style={cardStyle} className={`${colSpanClass} backdrop-blur-md p-5 rounded-2xl border border-white/10 hover:border-white/20 transition h-full flex flex-col justify-between group min-h-[140px] relative overflow-hidden`}>
            <div className="flex justify-between items-start relative z-10">
              <div className={`p-2.5 rounded-xl ${iconBg} ${titleColor} flex items-center gap-2`}><Swords className="w-4 h-4" /><span className="text-[10px] font-bold uppercase tracking-wider">Valorant</span></div>
              {valorantData.images?.small && (
                <img src={valorantData.images.small} style={{ width: 40, height: 40 }} alt="Rank" />
              )}
            </div>
            <div className="relative z-10 mt-4">
              <p className={`text-[10px] font-bold uppercase tracking-widest ${mutedColor} mb-1`}>{valorantData.name}#{valorantData.tag}</p>
              <p className={`text-xl font-black ${titleColor} mb-2`}>{valorantData.currenttierpatched}</p>
              <div className="w-full h-1.5 bg-black/20 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-red-500 to-pink-500" style={{ width: `${valorantData.ranking_in_tier}%` }}></div></div>
            </div>
          </div>
        );

      case 'stats':
        return (
          <div key={key} style={cardStyle} className={`${colSpanClass} backdrop-blur-md p-5 rounded-2xl border border-white/10 hover:border-white/20 transition h-full flex flex-col justify-between group min-h-[160px]`}>
            <div className="flex justify-between items-start mb-4">
              <div className={`p-2.5 rounded-xl ${iconBg} ${titleColor}`}><Trophy className="w-4 h-4" /></div>
              <div className="text-right"><p className={`text-[10px] font-bold uppercase ${mutedColor}`}>Level</p><p className={`text-2xl font-black ${titleColor}`}>{level}</p></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><span className={`text-[10px] font-bold uppercase tracking-widest ${mutedColor} block mb-1`}>Owned</span><p className={`text-xl font-bold ${titleColor}`}>{gameCount}</p></div>
              <div className="text-right"><span className={`text-[10px] font-bold uppercase tracking-widest ${mutedColor} block mb-1`}>Played</span><p className={`text-xl font-bold ${titleColor}`}>{heroGame ? Math.round(heroGame.playtime_forever / 60) : 0}h</p></div>
            </div>
          </div>
        );

      case 'library':
        return otherGames.length > 0 ? (
          <div key={key} style={cardStyle} className={`${colSpanClass} backdrop-blur-md rounded-2xl border border-white/10 p-5 h-full overflow-hidden min-h-[140px]`}>
            <h3 className={`text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2 ${mutedColor}`}><LayoutGrid className="w-3 h-3" /> Library</h3>
            <div className="space-y-3">
              {otherGames.slice(0, 3).map((game: any) => (
                <div key={game.appid} className="flex items-center gap-3 group cursor-default">
                  <div className="relative w-8 h-8 rounded-md overflow-hidden bg-zinc-800 shrink-0">
                    <img src={`https://media.steampowered.com/steamcommunity/public/images/apps/${game.appid}/${game.img_icon_url}.jpg`} alt={game.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-bold text-xs truncate transition ${subtitleColor}`}>{game.name}</p>
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
    <div className="space-y-6" suppressHydrationWarning>
      <div className="flex items-center gap-6 px-4">
        <button onClick={() => setActiveTab("overview")} className={`${activeTab === "overview" ? "text-white border-b-2 border-white" : `text-zinc-500 hover:text-white`} font-bold transition pb-1`}>Overview</button>
        <button onClick={() => setActiveTab("about")} className={`${activeTab === "about" ? "text-white border-b-2 border-white" : `text-zinc-500 hover:text-white`} font-bold transition pb-1`}>About Me</button>
      </div>

      {activeTab === "overview" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 auto-rows-min">
          {(user.layout || []).map((widget: any, index: number) => {
            const id = widget.id || widget.mapValue?.fields?.id?.stringValue;
            const enabled = widget.enabled !== undefined ? widget.enabled : widget.mapValue?.fields?.enabled?.booleanValue;
            const size = widget.size || widget.mapValue?.fields?.size?.stringValue || 'half';
            if (!id || id === 'gear') return null;
            return enabled ? renderWidget(id, `${id}-${index}`, size) : null;
          })}
        </div>
      ) : (
        <div className="space-y-4">
          <div style={cardStyle} className="backdrop-blur-md p-6 rounded-2xl border border-white/10">
            <h3 className={`text-sm font-bold uppercase tracking-wider mb-4 ${mutedColor}`}>Biography</h3>
            <p className={`whitespace-pre-wrap leading-relaxed ${subtitleColor}`}>{user.bio || "No bio yet."}</p>
          </div>

          {/* Custom Links */}
          {user.customLinks && user.customLinks.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {user.customLinks.map((link: any, idx: number) => (
                <a
                  key={idx}
                  href={ensureProtocol(link.url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={cardStyle}
                  className={`flex items-center justify-between p-4 rounded-xl border border-white/10 hover:border-white/30 transition group ${subtitleColor} hover:text-white`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${iconBg} group-hover:bg-white/20 transition`}>
                      <Globe className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-sm">{link.label}</span>
                  </div>
                  <ArrowUpRight className="w-4 h-4 opacity-50 group-hover:opacity-100 transition" />
                </a>
              ))}
            </div>
          )}

          {/* Hardware & Gear Section */}
          {user.gear && Object.values(user.gear).some((val: any) => val && (val as string).trim() !== "") && (
             <div style={cardStyle} className="backdrop-blur-md p-6 rounded-2xl border border-white/10 mt-4">
                <h3 className={`text-sm font-bold uppercase tracking-wider mb-6 ${mutedColor} flex items-center gap-2`}>
                   <Cpu className="w-4 h-4" /> Setup & Gear
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-4">
                   {user.gear.cpu && (
                      <div className="flex items-start gap-3">
                         <div className={`p-2 rounded-lg ${iconBg} shrink-0`}><Cpu className={`w-4 h-4 ${titleColor}`} /></div>
                         <div><p className={`text-[10px] font-bold uppercase ${mutedColor}`}>CPU</p><p className={`text-sm font-bold ${titleColor}`}>{user.gear.cpu}</p></div>
                      </div>
                   )}
                   {user.gear.gpu && (
                      <div className="flex items-start gap-3">
                         <div className={`p-2 rounded-lg ${iconBg} shrink-0`}><Cpu className={`w-4 h-4 ${titleColor}`} /></div>
                         <div><p className={`text-[10px] font-bold uppercase ${mutedColor}`}>GPU</p><p className={`text-sm font-bold ${titleColor}`}>{user.gear.gpu}</p></div>
                      </div>
                   )}
                   {user.gear.ram && (
                      <div className="flex items-start gap-3">
                         <div className={`p-2 rounded-lg ${iconBg} shrink-0`}><Cpu className={`w-4 h-4 ${titleColor}`} /></div>
                         <div><p className={`text-[10px] font-bold uppercase ${mutedColor}`}>RAM</p><p className={`text-sm font-bold ${titleColor}`}>{user.gear.ram}</p></div>
                      </div>
                   )}
                   {user.gear.monitor && (
                      <div className="flex items-start gap-3">
                         <div className={`p-2 rounded-lg ${iconBg} shrink-0`}><Monitor className={`w-4 h-4 ${titleColor}`} /></div>
                         <div><p className={`text-[10px] font-bold uppercase ${mutedColor}`}>Monitor</p><p className={`text-sm font-bold ${titleColor}`}>{user.gear.monitor}</p></div>
                      </div>
                   )}
                   {user.gear.mouse && (
                      <div className="flex items-start gap-3">
                         <div className={`p-2 rounded-lg ${iconBg} shrink-0`}><Mouse className={`w-4 h-4 ${titleColor}`} /></div>
                         <div><p className={`text-[10px] font-bold uppercase ${mutedColor}`}>Mouse</p><p className={`text-sm font-bold ${titleColor}`}>{user.gear.mouse}</p></div>
                      </div>
                   )}
                   {user.gear.keyboard && (
                      <div className="flex items-start gap-3">
                         <div className={`p-2 rounded-lg ${iconBg} shrink-0`}><Keyboard className={`w-4 h-4 ${titleColor}`} /></div>
                         <div><p className={`text-[10px] font-bold uppercase ${mutedColor}`}>Keyboard</p><p className={`text-sm font-bold ${titleColor}`}>{user.gear.keyboard}</p></div>
                      </div>
                   )}
                   {user.gear.headset && (
                      <div className="flex items-start gap-3">
                         <div className={`p-2 rounded-lg ${iconBg} shrink-0`}><Headphones className={`w-4 h-4 ${titleColor}`} /></div>
                         <div><p className={`text-[10px] font-bold uppercase ${mutedColor}`}>Headset</p><p className={`text-sm font-bold ${titleColor}`}>{user.gear.headset}</p></div>
                      </div>
                   )}
                </div>
             </div>
          )}
        </div>
      )}
    </div>
  );
}