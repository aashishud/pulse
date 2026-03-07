"use client";

import { useState, useEffect } from 'react';
import { X, Swords, Target, Crosshair, Trophy, Users } from 'lucide-react';

interface ValorantModalProps {
  isOpen: boolean;
  onClose: () => void;
  valName: string;
  valTag: string;
  valRegion: string;
}

export default function ValorantModal({ isOpen, onClose, valName, valTag, valRegion }: ValorantModalProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    
    const fetchStats = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/valorant?name=${encodeURIComponent(valName)}&tag=${encodeURIComponent(valTag)}&region=${valRegion}`);
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error("Failed to fetch Valorant details:", err);
      }
      setLoading(false);
    };

    fetchStats();
  }, [isOpen, valName, valTag, valRegion]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-xl"
        onClick={onClose}
      />

      {/* Modal Container - Widened to 4xl to fit pixel fonts */}
      <div className="relative w-full max-w-4xl bg-[#0f1013] rounded-[32px] border border-white/10 overflow-hidden shadow-2xl shadow-black/50 transform animate-in fade-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
        
        {loading ? (
          <div className="h-96 flex flex-col items-center justify-center text-zinc-500 gap-4">
            <div className="w-10 h-10 border-4 border-zinc-800 border-t-red-500 rounded-full animate-spin" />
            <p className="font-black tracking-widest uppercase text-xs text-zinc-400">Syncing Combat Data...</p>
          </div>
        ) : data?.mmr ? (
          <>
            {/* Header: Player Card Background */}
            <div className="relative h-48 sm:h-56 w-full shrink-0">
              <img 
                src={data.account?.card?.wide || 'https://images.unsplash.com/photo-1614624532983-4ce03382d63d?q=80&w=1200'} 
                alt="Player Card" 
                className="absolute inset-0 w-full h-full object-cover opacity-40"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0f1013] via-[#0f1013]/40 to-transparent" />
              
              <button 
                onClick={onClose}
                className="absolute top-6 right-6 w-10 h-10 bg-black/50 hover:bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-all border border-white/5 z-10"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="absolute bottom-6 left-6 sm:bottom-8 sm:left-8 flex items-end gap-4 sm:gap-6 min-w-0 w-full pr-20">
                <div className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 rounded-2xl bg-[#0f1013] p-1 shadow-2xl border border-white/10 rotate-[-2deg]">
                  <img src={data.account?.card?.small} alt="Avatar" className="w-full h-full rounded-xl object-cover" />
                </div>
                <div className="mb-2 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-1 min-w-0">
                    <h2 className="text-2xl sm:text-4xl font-black text-white leading-none truncate max-w-full">{data.account?.name}</h2>
                    <span className="bg-white/10 text-white/60 px-2 py-0.5 rounded text-[10px] font-bold tracking-widest mt-1 shrink-0">#{data.account?.tag}</span>
                  </div>
                  <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] sm:text-xs flex items-center gap-2 truncate">
                    <Trophy className="w-3 h-3 text-red-500 shrink-0" /> Account Level {data.account?.account_level}
                  </p>
                </div>
              </div>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar">
              {/* Changed to lg:grid-cols-5 so it wraps on smaller screens to prevent overflow */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 sm:gap-8 min-w-0">
                
                {/* Left Side: Rank Stats & Top Agents (2/5) */}
                <div className="lg:col-span-2 space-y-6 min-w-0">
                  
                  {/* Rank Widget */}
                  <div>
                    <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4 truncate">Rank Intelligence</h3>
                    <div className="bg-white/5 border border-white/5 rounded-3xl p-6 sm:p-8 flex flex-col items-center justify-center relative overflow-hidden group min-w-0">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 blur-[60px] rounded-full group-hover:bg-red-500/20 transition-colors" />
                      
                      <img 
                        src={data.mmr?.images?.large} 
                        alt="Rank" 
                        className="w-24 h-24 sm:w-32 sm:h-32 mb-6 drop-shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-transform group-hover:scale-110 duration-500" 
                      />
                      <h4 className="text-xl sm:text-3xl font-black text-white uppercase mb-1 font-mono text-center truncate w-full">{data.mmr?.currenttierpatched}</h4>
                      <p className="text-zinc-500 font-bold text-[10px] tracking-widest uppercase mb-6 sm:mb-8 text-center truncate w-full">Competitive Standing</p>
                      
                      <div className="w-full space-y-2 sm:space-y-3">
                        <div className="flex justify-between items-end gap-2">
                          <span className="text-lg sm:text-xl font-black text-white font-mono shrink-0">{data.mmr?.ranking_in_tier}<span className="text-[10px] text-zinc-500 ml-1">RR</span></span>
                          <span className="text-[9px] font-black text-zinc-500 tracking-widest text-right">100 RR</span>
                        </div>
                        <div className="h-3 w-full bg-black/60 rounded-full overflow-hidden border border-white/5 p-0.5">
                          <div 
                            className="h-full bg-gradient-to-r from-red-600 via-red-500 to-pink-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.4)] transition-all duration-1000"
                            style={{ width: `${data.mmr?.ranking_in_tier}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Top Agents Widget */}
                  {data.topAgents && data.topAgents.length > 0 && (
                    <div>
                      <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2 truncate">
                        <Users className="w-3 h-3" /> Most Played Agents
                      </h3>
                      <div className="space-y-3">
                        {data.topAgents.map((agent: any, idx: number) => {
                          const winRate = Math.round((agent.wins / agent.count) * 100);
                          const kd = (agent.kills / (agent.deaths || 1)).toFixed(2);
                          
                          return (
                            <div key={idx} className="bg-white/5 border border-white/5 rounded-2xl p-3 flex items-center gap-3 sm:gap-4 min-w-0">
                              <img src={agent.image} alt={agent.name} className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-black/40 border border-white/5 shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs sm:text-sm font-black text-white uppercase truncate">{agent.name}</p>
                                <p className="text-[9px] sm:text-[10px] text-zinc-500 font-bold truncate">{agent.count} Match{agent.count !== 1 ? 'es' : ''}</p>
                              </div>
                              <div className="text-right shrink-0 pl-2 border-l border-white/5">
                                <p className="text-xs sm:text-sm font-black text-white font-mono">{kd} <span className="text-[9px] text-zinc-500 font-sans">KD</span></p>
                                <p className={`text-[9px] sm:text-[10px] font-bold ${winRate >= 50 ? 'text-emerald-400' : 'text-red-400'}`}>{winRate}% WR</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                </div>

                {/* Right Side: Match History (3/5) */}
                <div className="lg:col-span-3 space-y-6 min-w-0">
                  <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4 truncate">Tactical Log</h3>
                  
                  <div className="space-y-3 min-w-0">
                    {data.matches?.length > 0 ? data.matches.map((match: any, idx: number) => {
                      const player = match.players?.all_players?.find((p: any) => 
                        p.name.toLowerCase() === valName.toLowerCase() && p.tag.toLowerCase() === valTag.toLowerCase()
                      );
                      
                      if (!player) return null;

                      const isWin = player.team === 'Red' ? match.teams?.red?.has_won : match.teams?.blue?.has_won;
                      const statusColor = isWin ? 'text-emerald-400' : 'text-red-500';
                      const borderColor = isWin ? 'border-l-emerald-500' : 'border-l-red-500';
                      const bgGradient = isWin ? 'from-emerald-500/10' : 'from-red-500/10';

                      return (
                        <div key={idx} className={`flex items-center gap-3 sm:gap-5 p-3 sm:p-4 rounded-2xl border border-white/5 border-l-4 ${borderColor} bg-gradient-to-r ${bgGradient} to-transparent backdrop-blur-sm hover:translate-x-1 transition-transform min-w-0`}>
                          <div className="relative shrink-0">
                            <img src={player.assets?.agent?.small} alt="Agent" className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-black/40 border border-white/5 object-cover" />
                            <div className={`absolute -bottom-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 rounded-full border-2 border-[#0f1013] flex items-center justify-center ${isWin ? 'bg-emerald-500' : 'bg-red-500'}`}>
                              <Target className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-white" />
                            </div>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 min-w-0">
                              <p className="text-xs sm:text-sm font-black text-white uppercase tracking-wider truncate max-w-[100px] sm:max-w-[150px]">{match.metadata?.map}</p>
                              <span className="text-[8px] sm:text-[10px] text-zinc-500 font-bold px-1.5 py-0.5 bg-white/5 rounded uppercase shrink-0">{match.metadata?.mode}</span>
                            </div>
                            <p className="text-[9px] sm:text-[10px] text-zinc-400 font-bold mt-0.5 truncate">{match.metadata?.game_start_patched}</p>
                          </div>

                          <div className="text-right shrink-0">
                            <p className="text-sm sm:text-lg font-black text-white font-mono">
                              {player.stats?.kills}<span className="text-zinc-500">/</span>{player.stats?.deaths}<span className="text-zinc-500">/</span>{player.stats?.assists}
                            </p>
                            <p className={`text-[9px] sm:text-[10px] font-black tracking-widest ${statusColor}`}>
                              {isWin ? 'VICTORY' : 'DEFEAT'}
                            </p>
                          </div>
                        </div>
                      );
                    }) : (
                      <div className="text-center py-12 bg-white/5 rounded-3xl border border-dashed border-white/10 min-w-0">
                        <Crosshair className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
                        <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest truncate px-4">No Recent Deployments</p>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          </>
        ) : (
          <div className="p-8 sm:p-16 text-center">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <X className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-black text-white mb-2 uppercase tracking-tight">Signal Interrupted</h2>
            <p className="text-zinc-500 text-sm max-w-xs mx-auto mb-8">We couldn't retrieve the combat data. The profile might be private or the Riot API is offline.</p>
            <button onClick={onClose} className="px-8 py-3 bg-white text-black font-black rounded-xl hover:scale-105 transition active:scale-95 text-xs uppercase tracking-widest">Close Link</button>
          </div>
        )}
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.1);
        }
      `}</style>
    </div>
  );
}