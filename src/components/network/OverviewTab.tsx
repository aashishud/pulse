"use client";

import React, { useState } from 'react';
import { Activity, Landmark, TrendingUp, Zap, Clock, ShieldCheck, CheckCircle2, ArrowRight, Briefcase, Building2, Minus } from 'lucide-react';
import { AreaChart, Area, XAxis, ChartTooltip } from '@/components/ui/area-chart';
import { LOCATIONS } from '@/lib/network-data';

export default function OverviewTab({
   netWorth, balance, savingsBalance, assetValue, loanBalance, fico, playerPath, netWorthHistory, currentLocName, energy, ownedVehicles, setBalance, setEnergy, setActiveJob, saveGameState, handleSwitchPathClick, corporateLevel, currentRole, displaySalary, pendingSalary, monthlySalaryTarget, salaryProgressPercentage, handleClaimSalary, currentLocation, ownedProperties, startupData, setStartupData, locMultiplier, showAlert, showConfirm, showPrompt, nextTaxTime, taxCycleMinutes
}: any) {
    
   // Handle FICO Score Arc Math
   const radius = 50;
   const circumference = Math.PI * radius; // Semi-circle
   const scorePercent = Math.max(0, Math.min(1, (fico - 300) / 550));
   const dashoffset = circumference - (scorePercent * circumference);

   const chartData = netWorthHistory.map((val: number, i: number) => ({
      index: i,
      netWorth: val
   }));

   // Format Tax Time
   const getTaxTimeDisplay = () => {
      if (!nextTaxTime) return "00:00";
      const ms = Math.max(0, nextTaxTime - Date.now());
      const m = Math.floor(ms / 60000).toString().padStart(2, '0');
      const s = Math.floor((ms % 60000) / 1000).toString().padStart(2, '0');
      return `${m}:${s}`;
   };

   // Force Re-Render for countdown
   const [timeTick, setTimeTick] = useState(0);
   React.useEffect(() => {
      const i = setInterval(() => setTimeTick(t => t + 1), 1000);
      return () => clearInterval(i);
   }, []);

   return (
      <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
         
         {/* =========================================
            ROW 1: NET WORTH & FICO SCORE
         ========================================= */}
         <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Main Net Worth Widget */}
            <div className="lg:col-span-8 bg-[#121214] border border-white/5 rounded-[32px] p-6 sm:p-8 flex flex-col shadow-2xl">
               <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
                  <div>
                     <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Total Combined Net Worth</p>
                     <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                        ${netWorth.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                     </h2>
                  </div>
                  <div className="flex flex-wrap gap-2">
                     <span className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-xs font-bold font-mono">
                        Cash: ${(balance + savingsBalance).toLocaleString('en-US')}
                     </span>
                     <span className="px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-lg text-xs font-bold font-mono">
                        Assets: ${assetValue.toLocaleString('en-US')}
                     </span>
                  </div>
               </div>

               {/* Responsive Chart Wrapper */}
               <div className="flex-1 min-h-[150px] sm:min-h-[200px] w-full"
                  style={{
                     "--chart-background": "transparent",
                     "--chart-foreground": "white",
                     "--chart-foreground-muted": "#a1a1aa",
                     "--chart-label": "#71717a",
                     "--chart-line-primary": "#34d399", 
                     "--chart-crosshair": "#3f3f46",
                     "--chart-grid": "rgba(255,255,255,0)",
                   } as React.CSSProperties}
               >
                  <AreaChart data={chartData} xDataKey="index" aspectRatio="auto" className="w-full h-full">
                     <Area dataKey="netWorth" fill="var(--chart-line-primary)" fillOpacity={0.15} strokeWidth={3} fadeEdges />
                     <ChartTooltip 
                        showCrosshair showDots 
                        rows={(point) => [{ color: "#34d399", label: "Net Worth", value: `$${(point.netWorth as number)?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` }]} 
                     />
                  </AreaChart>
               </div>
            </div>

            {/* FICO Score Widget */}
            <div className="lg:col-span-4 bg-[#121214] border border-white/5 rounded-[32px] p-6 sm:p-8 flex flex-col items-center justify-center text-center shadow-2xl relative overflow-hidden">
               <div className="absolute top-6 left-6 text-left">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Credit System</p>
                  <p className="text-xs text-zinc-400">FICO Tracking</p>
               </div>
               
               <div className="relative mt-12 mb-4 w-48 h-24 overflow-hidden flex items-end justify-center">
                  {/* Background Track */}
                  <svg className="absolute bottom-0 w-full h-full overflow-visible" viewBox="0 0 120 60">
                     <path d="M 10 60 A 50 50 0 0 1 110 60" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="15" strokeLinecap="round" />
                  </svg>
                  {/* Colored Arc */}
                  <svg className="absolute bottom-0 w-full h-full overflow-visible" viewBox="0 0 120 60">
                     <path 
                        d="M 10 60 A 50 50 0 0 1 110 60" 
                        fill="none" stroke="url(#ficoGrad)" strokeWidth="15" strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={dashoffset}
                        className="transition-all duration-1000 ease-out"
                     />
                     <defs>
                        <linearGradient id="ficoGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                           <stop offset="0%" stopColor="#ef4444" />
                           <stop offset="50%" stopColor="#facc15" />
                           <stop offset="100%" stopColor="#6366f1" />
                        </linearGradient>
                     </defs>
                  </svg>
                  
                  {/* Score Label inside Arc */}
                  <div className="absolute bottom-0 flex flex-col items-center translate-y-1">
                     <span className="text-3xl font-black text-white leading-none">{fico}</span>
                     <span className="text-[9px] font-bold uppercase tracking-widest text-indigo-400 mt-1">
                        {fico >= 800 ? 'Excellent' : fico >= 740 ? 'Very Good' : fico >= 670 ? 'Good' : fico >= 580 ? 'Fair' : 'Poor'}
                     </span>
                  </div>
               </div>
               
               <div className="flex justify-between w-full text-[10px] font-bold text-zinc-600 font-mono mt-2 px-6">
                  <span>300</span>
                  <span>850</span>
               </div>
            </div>
         </div>

         {/* =========================================
            ROW 2: CAREER HUB & TAXES
         ========================================= */}
         <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* --- CAREER WIDGET --- */}
            {playerPath === 'founder' && (
               <div className="lg:col-span-8 bg-[#121214] border border-orange-500/20 rounded-[32px] p-6 sm:p-8 flex flex-col shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 blur-3xl rounded-full pointer-events-none transition-transform group-hover:scale-110"></div>
                  
                  <div className="flex justify-between items-start mb-8 relative z-10">
                     <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-orange-500 mb-1">Company Dashboard</p>
                        <h3 className="text-2xl font-black text-white">Startup Tycoon</h3>
                     </div>
                     <button onClick={handleSwitchPathClick} className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-zinc-300 transition">Switch Path</button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10 flex-1">
                     <div className="space-y-6">
                        <div>
                           <div className="flex justify-between text-xs font-bold text-zinc-400 mb-2"><span>Employee Workload</span><span className="text-orange-400">{startupData.workload}%</span></div>
                           <input type="range" min="0" max="100" value={startupData.workload} onChange={(e) => setStartupData({...startupData, workload: parseInt(e.target.value)})} className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-white/10 accent-orange-500" />
                        </div>
                        <div>
                           <div className="flex justify-between text-xs font-bold text-zinc-400 mb-2"><span>Payroll Budget</span><span className="text-emerald-400">{startupData.payroll}%</span></div>
                           <input type="range" min="0" max="100" value={startupData.payroll} onChange={(e) => setStartupData({...startupData, payroll: parseInt(e.target.value)})} className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-white/10 accent-emerald-500" />
                        </div>
                        <div className="bg-black/40 border border-white/5 rounded-2xl p-4 flex justify-between items-center mt-4">
                           <div>
                              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Business Scale</p>
                              <p className="text-lg font-black text-white">Lv. {startupData.level}</p>
                           </div>
                           <button onClick={() => {
                              if (balance < (startupData.level * 25000)) return showAlert("Insufficient Funds", `You need $${(startupData.level * 25000).toLocaleString()} to expand!`);
                              setActiveJob({ id: 'expansion', title: 'Expand Operations', isExpansion: true, difficulty: 'hard', basePay: 0, requiredClicks: 150, timeLimit: 45, icon: Building2 });
                           }} className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-orange-500/20 flex items-center gap-2">
                              Expand ({startupData.level * 60} ⚡)
                           </button>
                        </div>
                     </div>

                     <div className="flex flex-col justify-between">
                        <div className="mb-4">
                           <div className="flex justify-between text-xs font-bold text-zinc-400 mb-2 uppercase tracking-widest">
                              <span>Company Morale</span>
                              <span className={startupData.morale > 70 ? "text-emerald-400" : startupData.morale > 30 ? "text-yellow-400" : "text-red-400"}>
                                 {Math.floor(startupData.morale)} / 100
                              </span>
                           </div>
                           <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden mb-1">
                              <div className={`h-full transition-all duration-300 ${startupData.morale > 70 ? "bg-emerald-500" : startupData.morale > 30 ? "bg-yellow-500" : "bg-red-500"}`} style={{ width: `${startupData.morale}%` }}></div>
                           </div>
                           <p className="text-[9px] text-zinc-500 font-mono">Trend: {startupData.payroll > startupData.workload ? '↑ Rising' : startupData.payroll < startupData.workload ? '↓ Falling' : '→ Stable'}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                           <div className="bg-black/20 border border-white/5 rounded-xl p-3">
                              <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Est. Gross/Min</p>
                              <p className="text-emerald-400 font-mono font-bold text-sm">${(startupData.workload * 15 * locMultiplier * startupData.level).toLocaleString('en-US', {minimumFractionDigits: 2})}</p>
                           </div>
                           <div className="bg-black/20 border border-white/5 rounded-xl p-3">
                              <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Est. Cost/Min</p>
                              <p className="text-red-400 font-mono font-bold text-sm">-${((startupData.payroll * 10 * locMultiplier * startupData.level) + (100 * locMultiplier * startupData.level)).toLocaleString('en-US', {minimumFractionDigits: 2})}</p>
                           </div>
                        </div>

                        <div className="flex items-center justify-between">
                           <div>
                              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Company Treasury</p>
                              <p className={`text-2xl font-black font-mono tracking-tight ${pendingSalary >= 0 ? 'text-emerald-400' : 'text-red-500'}`}>
                                 {pendingSalary >= 0 ? '+' : '-'}${Math.abs(pendingSalary).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </p>
                           </div>
                           <button onClick={handleClaimSalary} className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-emerald-500/20 whitespace-nowrap">
                              Claim Dividend
                           </button>
                        </div>
                     </div>
                  </div>
               </div>
            )}

            {playerPath === 'corporate' && (
               <div className="lg:col-span-8 bg-[#121214] border border-indigo-500/20 rounded-[32px] p-6 sm:p-8 flex flex-col shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-3xl rounded-full pointer-events-none transition-transform group-hover:scale-110"></div>
                  
                  <div className="flex justify-between items-start mb-8 relative z-10">
                     <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 mb-1">Corporate Dashboard</p>
                        <h3 className="text-2xl font-black text-white">{currentRole.title}</h3>
                     </div>
                     <button onClick={handleSwitchPathClick} className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-zinc-300 transition">Switch Path</button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8 relative z-10">
                     <div className="bg-black/20 border border-white/5 p-4 rounded-2xl">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Base Salary</p>
                        <p className="font-mono text-lg font-bold text-white">${currentRole.payPerMinute.toFixed(2)}<span className="text-xs text-zinc-500">/min</span></p>
                     </div>
                     <div className="bg-black/20 border border-white/5 p-4 rounded-2xl sm:col-span-2 flex items-center justify-between">
                        <div>
                           <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Next Promotion</p>
                           <p className="text-sm font-bold text-zinc-300">Level {corporateLevel + 1}</p>
                        </div>
                        <button onClick={() => {
                           setActiveJob({ id: 'promo', title: 'Boss Task', isPromotion: true, difficulty: 'hard', basePay: 0, requiredClicks: 120, timeLimit: 30, icon: Briefcase });
                        }} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-indigo-500/20">
                           Request Meeting (100⚡)
                        </button>
                     </div>
                  </div>

                  <div className="mt-auto relative z-10">
                     <div className="flex justify-between text-xs font-bold text-zinc-400 mb-2 uppercase tracking-widest">
                        <span>Monthly Target</span>
                        <span className="text-indigo-400 font-mono">${monthlySalaryTarget.toLocaleString()}</span>
                     </div>
                     <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden mb-4">
                        <div className="h-full bg-indigo-500 transition-all duration-300 relative" style={{ width: `${salaryProgressPercentage}%` }}>
                           <div className="absolute inset-0 bg-white/20 w-full animate-pulse"></div>
                        </div>
                     </div>
                     
                     <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                           <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Accrued Paycheck</p>
                           <p className="text-2xl font-black font-mono tracking-tight text-white">${pendingSalary.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        </div>
                        <button onClick={handleClaimSalary} disabled={pendingSalary < monthlySalaryTarget} className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-white/5 disabled:text-zinc-600 disabled:border-transparent text-white border border-indigo-500/30 rounded-xl text-xs font-bold transition shadow-lg shadow-indigo-500/20">
                           {pendingSalary < monthlySalaryTarget ? "Work Target Incomplete" : "Claim Paycheck"}
                        </button>
                     </div>
                  </div>
               </div>
            )}

            {!playerPath && (
               <div className="lg:col-span-8 bg-[#121214] border border-white/5 rounded-[32px] p-8 flex flex-col items-center justify-center text-center shadow-2xl">
                  <Briefcase className="w-12 h-12 text-zinc-600 mb-4" />
                  <h3 className="text-xl font-black text-white mb-2">No Career Path Selected</h3>
                  <p className="text-zinc-400 text-sm mb-6 max-w-md">Choose a career to start earning passive or active income in the Pulse Economy.</p>
                  <button onClick={handleSwitchPathClick} className="px-6 py-3 bg-white text-black font-bold rounded-xl transition hover:bg-zinc-200">Select Career</button>
               </div>
            )}

            {playerPath === 'hustler' && (
               <div className="lg:col-span-8 bg-[#121214] border border-emerald-500/20 rounded-[32px] p-6 sm:p-8 flex flex-col shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-3xl rounded-full pointer-events-none transition-transform group-hover:scale-110"></div>
                  <div className="flex justify-between items-start mb-8 relative z-10">
                     <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 mb-1">Gig Economy</p>
                        <h3 className="text-2xl font-black text-white">The Street Hustler</h3>
                     </div>
                     <button onClick={handleSwitchPathClick} className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-zinc-300 transition">Switch Path</button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
                     <button onClick={() => {
                        if (energy < 20) return showAlert("Not Enough Energy", "You need 20 Energy to work!");
                        setActiveJob({ id: 'gig1', title: 'Food Delivery', difficulty: 'easy', basePay: 50, requiredClicks: 20, timeLimit: 15, icon: Zap });
                        setEnergy(energy - 20); saveGameState({ energy: energy - 20 });
                     }} className="p-4 bg-black/40 border border-white/5 hover:border-emerald-500/30 rounded-2xl text-left transition group/btn">
                        <div className="flex justify-between items-center mb-2">
                           <span className="font-bold text-white group-hover/btn:text-emerald-400 transition">Food Delivery</span>
                           <span className="text-[10px] font-mono bg-white/10 px-2 py-1 rounded text-zinc-300">-20 ⚡</span>
                        </div>
                        <p className="text-xs text-zinc-500">Fast payout, low effort.</p>
                     </button>
                     <button onClick={() => {
                        if (energy < 50) return showAlert("Not Enough Energy", "You need 50 Energy to work!");
                        setActiveJob({ id: 'gig2', title: 'Freelance Code', difficulty: 'medium', basePay: 200, requiredClicks: 50, timeLimit: 20, icon: Briefcase });
                        setEnergy(energy - 50); saveGameState({ energy: energy - 50 });
                     }} className="p-4 bg-black/40 border border-white/5 hover:border-emerald-500/30 rounded-2xl text-left transition group/btn">
                        <div className="flex justify-between items-center mb-2">
                           <span className="font-bold text-white group-hover/btn:text-emerald-400 transition">Freelance Code</span>
                           <span className="text-[10px] font-mono bg-white/10 px-2 py-1 rounded text-zinc-300">-50 ⚡</span>
                        </div>
                        <p className="text-xs text-zinc-500">Medium payout, requires speed.</p>
                     </button>
                  </div>
               </div>
            )}

            {/* --- TAXES WIDGET --- */}
            <div className="lg:col-span-4 bg-[#121214] border border-white/5 rounded-[32px] p-6 sm:p-8 flex flex-col shadow-2xl">
               <div className="flex justify-between items-start mb-6">
                  <div>
                     <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">System</p>
                     <h3 className="text-lg font-bold text-white">Daily Upkeep (Taxes)</h3>
                  </div>
                  <Clock className="w-5 h-5 text-zinc-600" />
               </div>

               <div className="bg-black/40 border border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center text-center mb-6">
                  <span className="text-3xl font-black font-mono text-white tracking-tight">{getTaxTimeDisplay()}</span>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 mt-1">To Next Tax Cut</span>
               </div>

               <div className="space-y-3 mt-auto">
                  <div className="flex justify-between items-center">
                     <span className="text-xs font-bold text-zinc-400">Rent ({currentLocName})</span>
                     {ownedProperties.length > 0 ? (
                        <span className="text-xs font-bold text-emerald-400">Waived</span>
                     ) : (
                        <span className="text-xs font-bold font-mono text-red-400">-${(LOCATIONS[currentLocation]?.rent || 0).toLocaleString()}</span>
                     )}
                  </div>
                  <div className="flex justify-between items-center">
                     <span className="text-xs font-bold text-zinc-400">Living Costs</span>
                     <span className="text-xs font-bold font-mono text-red-400">-${(LOCATIONS[currentLocation]?.living || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                     <span className="text-xs font-bold text-zinc-400">Est. Tax ({(LOCATIONS[currentLocation]?.tax * 100).toFixed(0)}%)</span>
                     <span className="text-xs font-bold font-mono text-red-400">
                        {playerPath === 'hustler' ? "Calculated on Job" : `-${((pendingSalary || 0) * LOCATIONS[currentLocation]?.tax).toLocaleString('en-US', {maximumFractionDigits:2})}`}
                     </span>
                  </div>
                  
                  <div className="h-px bg-white/10 my-1"></div>
                  
                  <div className="flex justify-between items-center">
                     <span className="text-xs font-bold text-white">Total Est. Cut</span>
                     <span className="text-sm font-bold font-mono text-red-500">
                        -${((ownedProperties.length > 0 ? 0 : (LOCATIONS[currentLocation]?.rent || 0)) + (LOCATIONS[currentLocation]?.living || 0) + (playerPath !== 'hustler' ? ((pendingSalary || 0) * LOCATIONS[currentLocation]?.tax) : 0)).toLocaleString('en-US', {maximumFractionDigits:2})}
                     </span>
                  </div>
               </div>
            </div>
         </div>

      </div>
   );
}