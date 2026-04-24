"use client";

import React, { useEffect, useState } from 'react';
import { Trophy, Crown, Medal, Award, TrendingUp, AlertCircle, RefreshCw, Briefcase, Building2, User } from 'lucide-react';

interface LeaderboardUser {
   rank: number;
   displayName: string;
   playerPath: string;
   totalNetWorth: number;
   cash: number;
   assets: number;
}

export default function LeaderboardTab() {
   const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState('');

   const fetchLeaderboard = async () => {
      try {
         const res = await fetch('/api/game/leaderboard');
         const data = await res.json();
         if (!res.ok) throw new Error(data.error || "Unknown server error.");
         
         const ranked = (data.leaderboard || []).map((u: any, i: number) => ({ ...u, rank: i + 1 }));
         setLeaderboard(ranked);
         setError('');
      } catch (err: any) {
         setError(err.message);
      } finally {
         setLoading(false);
      }
   };

   useEffect(() => {
      fetchLeaderboard();
      const interval = setInterval(fetchLeaderboard, 60000); 
      return () => clearInterval(interval);
   }, []);

   const getPathInfo = (path: string) => {
       switch(path) {
           case 'hustler': return { icon: <User className="w-4 h-4" />, color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20' };
           case 'corporate': return { icon: <Briefcase className="w-4 h-4" />, color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20' };
           case 'founder': return { icon: <Building2 className="w-4 h-4" />, color: 'text-fuchsia-400', bg: 'bg-fuchsia-400/10', border: 'border-fuchsia-400/20' };
           default: return { icon: <User className="w-4 h-4" />, color: 'text-zinc-400', bg: 'bg-zinc-400/10', border: 'border-zinc-400/20' };
       }
   };

   const formatMoney = (val: number) => {
       if (val >= 1e9) return `$${(val / 1e9).toFixed(2)}B`;
       if (val >= 1e6) return `$${(val / 1e6).toFixed(2)}M`;
       return `$${val.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
   };

   if (loading && leaderboard.length === 0) {
       return (
           <div className="max-w-6xl mx-auto flex flex-col items-center justify-center py-32 space-y-4">
               <RefreshCw className="w-12 h-12 text-indigo-400 animate-spin" />
               <p className="text-zinc-400 font-bold tracking-widest uppercase text-sm">Querying Global Markets...</p>
           </div>
       );
   }

   const topThree = leaderboard.slice(0, 3);
   const theRest = leaderboard.slice(3, 100);

   return (
      <div className="max-w-6xl mx-auto space-y-12 pb-20 animate-in fade-in duration-700">
         
         <div className="text-center space-y-4">
             <div className="inline-flex items-center justify-center gap-3 bg-amber-500/10 border border-amber-500/30 px-6 py-2 rounded-full mb-2">
                 <Trophy className="w-5 h-5 text-amber-400" />
                 <span className="text-amber-300 font-bold uppercase tracking-widest text-sm text-[11px]">Global Rankings</span>
             </div>
             <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter drop-shadow-lg">The 1 Percent</h2>
             <p className="text-zinc-400 max-w-xl mx-auto">Verified cryptographically. True Net worth is calculated live including active real estate, vehicles, and raw stock assets.</p>
         </div>

         {error && (
             <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-2xl flex items-center gap-3">
                 <AlertCircle className="w-5 h-5" />
                 <p className="font-bold text-sm">Failed to refresh live data: {error}</p>
             </div>
         )}

         {/* PODIUM */}
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end mt-16 md:mt-24">
            
            {/* Rank 2 - Silver */}
            {topThree[1] && (
                <div className="order-2 md:order-1 bg-gradient-to-b from-zinc-800/40 to-black/40 border border-zinc-500/30 rounded-t-3xl p-6 relative flex flex-col items-center shadow-[0_-10px_40px_rgba(161,161,170,0.1)] pt-12">
                    <div className="absolute -top-6 w-12 h-12 bg-zinc-800 border-2 border-zinc-400 rounded-full flex items-center justify-center text-zinc-300 font-black text-xl shadow-lg shadow-zinc-500/20 z-10">2</div>
                    <Medal className="w-8 h-8 text-zinc-400 mb-4" />
                    <h3 className="text-2xl font-black text-white mb-2">{topThree[1].displayName}</h3>
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-md border text-[10px] uppercase font-bold tracking-widest mb-6 ${getPathInfo(topThree[1].playerPath).bg} ${getPathInfo(topThree[1].playerPath).color} ${getPathInfo(topThree[1].playerPath).border}`}>
                        {getPathInfo(topThree[1].playerPath).icon} {topThree[1].playerPath}
                    </div>
                    <div className="w-full bg-black/40 rounded-2xl p-4 border border-white/5 text-center">
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">True Net Worth</p>
                        <p className="text-3xl font-black font-mono text-zinc-300">{formatMoney(topThree[1].totalNetWorth)}</p>
                    </div>
                </div>
            )}

            {/* Rank 1 - Gold */}
            {topThree[0] && (
                <div className="order-1 md:order-2 bg-gradient-to-b from-amber-500/20 to-black/60 border border-amber-500/40 rounded-t-[40px] p-8 md:p-6 lg:p-8 relative flex flex-col items-center shadow-[0_-20px_50px_rgba(251,191,36,0.15)] z-20 md:scale-110 md:-translate-y-4 pt-16">
                    <div className="absolute -top-8 w-16 h-16 bg-amber-500 border-4 border-amber-200 rounded-full flex items-center justify-center text-white font-black text-3xl shadow-xl shadow-amber-500/40 z-10">1</div>
                    <Crown className="w-12 h-12 text-amber-400 mb-4 drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]" />
                    <h3 className="text-3xl font-black text-white mb-2">{topThree[0].displayName}</h3>
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-md border text-[10px] uppercase font-bold tracking-widest mb-8 ${getPathInfo(topThree[0].playerPath).bg} ${getPathInfo(topThree[0].playerPath).color} ${getPathInfo(topThree[0].playerPath).border}`}>
                        {getPathInfo(topThree[0].playerPath).icon} {topThree[0].playerPath}
                    </div>
                    <div className="w-full bg-black/60 rounded-2xl p-5 border border-amber-500/20 text-center shadow-inner">
                        <p className="text-xs text-amber-500/70 font-bold uppercase tracking-widest mb-1">True Net Worth</p>
                        <p className="text-4xl font-black font-mono text-amber-400 drop-shadow-md">{formatMoney(topThree[0].totalNetWorth)}</p>
                    </div>
                </div>
            )}

            {/* Rank 3 - Bronze */}
            {topThree[2] && (
                <div className="order-3 md:order-3 bg-gradient-to-b from-orange-800/30 to-black/40 border border-orange-700/30 rounded-t-3xl p-6 relative flex flex-col items-center shadow-[0_-10px_40px_rgba(194,65,12,0.1)] pt-12">
                    <div className="absolute -top-5 w-10 h-10 bg-orange-900 border-2 border-orange-500 rounded-full flex items-center justify-center text-orange-200 font-black text-lg shadow-lg shadow-orange-900/40 z-10">3</div>
                    <Award className="w-8 h-8 text-orange-500 mb-4" />
                    <h3 className="text-xl font-black text-white mb-2">{topThree[2].displayName}</h3>
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-md border text-[10px] uppercase font-bold tracking-widest mb-6 ${getPathInfo(topThree[2].playerPath).bg} ${getPathInfo(topThree[2].playerPath).color} ${getPathInfo(topThree[2].playerPath).border}`}>
                        {getPathInfo(topThree[2].playerPath).icon} {topThree[2].playerPath}
                    </div>
                    <div className="w-full bg-black/40 rounded-2xl p-4 border border-white/5 text-center">
                        <p className="text-[10px] text-orange-500/70 font-bold uppercase tracking-widest mb-1">True Net Worth</p>
                        <p className="text-2xl font-black font-mono text-orange-400">{formatMoney(topThree[2].totalNetWorth)}</p>
                    </div>
                </div>
            )}

         </div>

         {/* THE REST OF THE BOARD */}
         {theRest.length > 0 && (
             <div className="bg-[#121214] border border-white/5 rounded-[32px] overflow-hidden shadow-2xl">
                 <div className="px-8 py-5 border-b border-white/5 bg-black/20 flex items-center justify-between">
                     <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Global Participants</h4>
                     <button onClick={fetchLeaderboard} className="text-xs flex items-center gap-2 font-bold text-indigo-400 hover:text-indigo-300 transition bg-indigo-500/10 px-3 py-1.5 rounded-full border border-indigo-500/20">
                         <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} /> Sync Network
                     </button>
                 </div>
                 <div className="divide-y divide-white/5">
                     {theRest.map((user) => (
                         <div key={user.rank} className="flex items-center justify-between px-8 py-5 hover:bg-white/[0.02] transition-colors group">
                             <div className="flex items-center gap-6">
                                 <div className="w-8 text-center font-mono font-bold text-zinc-500 group-hover:text-white transition-colors">
                                     #{user.rank}
                                 </div>
                                 <div>
                                     <p className="text-lg font-bold text-white mb-1 group-hover:text-indigo-400 transition-colors">{user.displayName}</p>
                                     <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] uppercase font-bold tracking-widest ${getPathInfo(user.playerPath).color}`}>
                                         {getPathInfo(user.playerPath).icon} {user.playerPath}
                                     </div>
                                 </div>
                             </div>
                             <div className="text-right">
                                 <p className="text-xl font-black font-mono text-white mb-1">{formatMoney(user.totalNetWorth)}</p>
                                 <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                                     Cash: <span className="text-emerald-400 font-mono">{formatMoney(user.cash)}</span>
                                 </p>
                             </div>
                         </div>
                     ))}
                 </div>
             </div>
         )}
      </div>
   );
}
