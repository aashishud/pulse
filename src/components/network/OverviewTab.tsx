"use client";

import React, { useState } from 'react';
import { Activity, Landmark, TrendingUp, Zap, Clock, ShieldCheck, CheckCircle2, ArrowRight, Briefcase, Building2, Minus, Truck, Car, Cpu, Server, ShieldAlert, Fingerprint, AlertTriangle, AlertCircle, Rocket, X, PartyPopper, Lightbulb, LayoutDashboard, Users, Bot } from 'lucide-react';
import { AreaChart, Area, XAxis, ChartTooltip } from '@/components/ui/area-chart';
import { LOCATIONS } from '@/lib/network-data';
import { Filter } from 'bad-words';

let filter: any;
try {
  filter = new Filter();
} catch (error) {
  console.warn("Profanity filter failed to load:", error);
  filter = { isProfane: () => false }; 
}

const HUSTLER_JOBS = [
  { id: 'gig1', title: 'Food Delivery', type: 'sorter', difficulty: 'easy', pay: 50, cost: 20, timeLimit: 15, icon: Truck, minLevel: 1, desc: "Fast payout, low effort." },
  { id: 'gig2', title: 'Ride Share', type: 'sorter', difficulty: 'medium', pay: 120, cost: 40, timeLimit: 20, icon: Car, minLevel: 1, desc: "Requires quick sorting." },
  { id: 'gig3', title: 'Freelance Code', type: 'timing', difficulty: 'medium', pay: 250, cost: 60, timeLimit: 20, icon: Cpu, minLevel: 2, desc: "Sync the needle perfectly." },
  { id: 'gig4', title: 'Server Maintenance', type: 'timing', difficulty: 'hard', pay: 450, cost: 90, timeLimit: 25, icon: Server, minLevel: 2, desc: "Complex timing required." },
  { id: 'gig5', title: 'Penetration Test', type: 'memory', difficulty: 'medium', pay: 800, cost: 120, timeLimit: 25, icon: ShieldAlert, minLevel: 3, desc: "Memorize the firewall sequence." },
  { id: 'gig6', title: 'Zero-Day Bounty', type: 'memory', difficulty: 'hard', pay: 1500, cost: 180, timeLimit: 30, icon: Fingerprint, minLevel: 3, desc: "Long sequence memory." },
  { id: 'gig7', title: 'Corporate Heist', type: 'timing', difficulty: 'hard', pay: 3000, cost: 250, timeLimit: 30, icon: AlertTriangle, minLevel: 4, desc: "Extreme precision needed." }
];

const STARTUP_UPGRADES = [
  { id: 'ui_ux_overhaul', name: 'Viral Campaign', desc: '+15% Gross Revenue.', cost: 100000, minLevel: 1, icon: TrendingUp },
  { id: 'hr_department', name: 'Office Perks', desc: 'Reduces employee morale drain by 30%.', cost: 250000, minLevel: 2, icon: Users },
  { id: 'senior_engineers', name: 'Elite Developers', desc: '+50% Gross Revenue per workload.', cost: 500000, minLevel: 2, icon: Cpu },
  { id: 'premium_servers', name: 'Automated Systems', desc: 'Reduces base OpCost by 20% and dampens Labor Shortages.', cost: 1000000, minLevel: 3, icon: Server },
  { id: 'ai_algorithm', name: 'Next-Gen AI', desc: 'Doubles (2x) total Gross Revenue.', cost: 5000000, minLevel: 5, icon: Bot }
];

export default function OverviewTab({
   netWorth, balance, savingsBalance, assetValue, loanBalance, fico, playerPath, netWorthHistory, currentLocName, energy, ownedVehicles, setBalance, setEnergy, setActiveJob, saveGameState, handleSwitchPathClick, corporateLevel, currentRole, displaySalary, pendingSalary, monthlySalaryTarget, salaryProgressPercentage, handleClaimSalary, currentLocation, ownedProperties, startupData, setStartupData, locMultiplier, showAlert, showConfirm, showPrompt, nextTaxTime, taxCycleMinutes, marketEvent, energyBlockUntil, setEnergyBlockUntil
}: any) {
    
   const radius = 50;
   const circumference = Math.PI * radius; 
   const scorePercent = Math.max(0, Math.min(1, (fico - 300) / 550));
   const dashoffset = circumference - (scorePercent * circumference);

   const chartData = netWorthHistory.map((val: number, i: number) => ({ index: i, netWorth: val }));

   const getTaxTimeDisplay = () => {
      if (!nextTaxTime) return "00:00";
      const ms = Math.max(0, nextTaxTime - Date.now());
      const m = Math.floor(ms / 60000).toString().padStart(2, '0');
      const s = Math.floor((ms % 60000) / 1000).toString().padStart(2, '0');
      return `${m}:${s}`;
   };

   const [timeTick, setTimeTick] = useState(0);
   React.useEffect(() => {
      const i = setInterval(() => setTimeTick(t => t + 1), 1000);
      return () => clearInterval(i);
   }, []);

   // --- BRANDING, VC, & UPGRADE STATES ---
   const [tempName, setTempName] = useState("");
   const [tempTicker, setTempTicker] = useState("");
   const [showVCModal, setShowVCModal] = useState(false);
   const [showUpgradesModal, setShowUpgradesModal] = useState(false);

   const handleIncorporate = async () => {
       const cleanName = tempName.trim();
       const cleanTicker = tempTicker.trim();

       if (cleanName.length < 3) return showAlert("Error", "Company Name must be at least 3 characters.");
       if (cleanTicker.length < 2 || cleanTicker.length > 4) return showAlert("Error", "Ticker must be 2 to 4 characters.");

       if (filter.isProfane(cleanName) || filter.isProfane(cleanTicker)) {
           return showAlert("Profanity Detected", "Please choose an appropriate company name and ticker symbol. We keep it professional on Wall Street.");
       }

       const updates = { ...startupData, companyName: cleanName, ticker: cleanTicker.toUpperCase() };
       setStartupData(updates);
       saveGameState({ startup_data: updates });
   };

   const handleVCAccept = async (offer: number, equity: number) => {
       const newEquity = startupData.equityOwned - equity;
       const updates = { ...startupData, equityOwned: newEquity };
       setStartupData(updates);
       setBalance(balance + offer);
       saveGameState({ startup_data: updates, bank_balance: balance + offer });
       setShowVCModal(false);
       await showAlert("Investment Secured!", `You received $${offer.toLocaleString()} instantly, but you permanently gave up ${equity}% of your future net profits.`);
   };

   const handleBuybackEquity = async () => {
       const costPerPercent = 500000 * startupData.level;
       const missingEquity = 100 - startupData.equityOwned;
       if (missingEquity <= 0) return showAlert("Max Equity", "You already own 100% of your company.");

       const input = await showPrompt("Buy Back Equity", `You are missing ${missingEquity}% equity.\n\nVCs are demanding $${costPerPercent.toLocaleString()} per 1% to buy it back.\n\nHow much % do you want to buy back?`, "5");
       if (!input) return;

       const percentToBuy = parseInt(input);
       if (isNaN(percentToBuy) || percentToBuy <= 0) return showAlert("Error", "Invalid amount.");
       if (percentToBuy > missingEquity) return showAlert("Error", `You can only buy back up to ${missingEquity}%.`);

       const totalCost = percentToBuy * costPerPercent;
       if (balance < totalCost) return showAlert("Insufficient Funds", `You need $${totalCost.toLocaleString()} in liquid cash to buy back ${percentToBuy}%.`);

       const confirm = await showConfirm("Confirm Buyback", `Are you sure you want to spend $${totalCost.toLocaleString()} to regain ${percentToBuy}% equity?`);
       if (!confirm) return;

       const newEquity = startupData.equityOwned + percentToBuy;
       const newBal = balance - totalCost;
       
       setStartupData({ ...startupData, equityOwned: newEquity });
       setBalance(newBal);
       saveGameState({ startup_data: { ...startupData, equityOwned: newEquity }, bank_balance: newBal });
       showAlert("Equity Recovered!", `You successfully bought back ${percentToBuy}% of your company. You now own ${newEquity}%.`);
   };

   const handleBuyUpgrade = async (upgradeId: string, cost: number) => {
       if (balance < cost) return showAlert("Insufficient Funds", `You need $${cost.toLocaleString()} to fund this upgrade.`);
       
       const confirm = await showConfirm("Fund R&D", `Are you sure you want to spend $${cost.toLocaleString()} to integrate this upgrade into your company?`);
       if (!confirm) return;

       const newBal = balance - cost;
       const newUpgrades = [...(startupData.upgrades || []), upgradeId];
       const newSData = { ...startupData, upgrades: newUpgrades };

       setBalance(newBal);
       setStartupData(newSData);
       saveGameState({ bank_balance: newBal, startup_data: newSData });
       showAlert("Upgrade Acquired!", "Your R&D department has successfully integrated the new technology. Your multipliers have been updated.");
   };

   const safeSwitchPath = () => {
       if (playerPath === 'founder' && startupData?.equityOwned < 100) {
           showAlert("Shareholders Blocked Exit", "You cannot abandon your startup or switch careers while Venture Capitalists still own equity. You must buy back to 100% ownership before stepping down as CEO.");
           return;
       }
       handleSwitchPathClick();
   };

   const handleHostRetreat = async () => {
       if (energy < 150) return showAlert("Not Enough Energy", `You need at least 150 Energy to host a Corporate Retreat! Expand your company to increase your energy cap.`);
       
       const confirm = await showConfirm("Host Corporate Retreat", `Spend ALL your remaining Energy (${Math.floor(energy)}⚡) to throw a massive party for your employees?\n\nTheir morale will instantly jump to 100% and will lock there for 30 minutes, preventing any strikes regardless of how hard you overwork them! \n\nHOWEVER, you will be unable to regain any energy from food or sleep for 60 minutes!`);
       if (!confirm) return;

       const newBoostTime = Date.now() + (30 * 60000); 
       const newBlockTime = Date.now() + (60 * 60000); 
       const newSData = { ...startupData, morale: 100, is_strike: false, moraleBoostUntil: newBoostTime };

       setEnergy(0);
       setStartupData(newSData);
       setEnergyBlockUntil(newBlockTime);
       saveGameState({ energy: 0, startup_data: newSData, energy_block_until: newBlockTime });
       showAlert("Retreat Active! 🎉", "Morale is locked at 100% for 30 minutes. Time to aggressively crank up the workload for pure profit! (Energy locked for 60m)");
   };

   // --- MARKET EVENT & R&D UPGRADE MATH (SYNCED EXACTLY WITH BACKEND) ---
   let upgradeGrossMult = 1;
   if (startupData.upgrades?.includes('ui_ux_overhaul')) upgradeGrossMult += 0.15;
   if (startupData.upgrades?.includes('senior_engineers')) upgradeGrossMult += 0.50;
   if (startupData.upgrades?.includes('ai_algorithm')) upgradeGrossMult *= 2;

   let premiumServerMod = startupData.upgrades?.includes('premium_servers') ? 0.8 : 1.0;

   let grossMult = 1; let payrollCostMult = 1;
   if (marketEvent && Date.now() < marketEvent.expiresAt) {
       if (marketEvent.type === 'boom') grossMult = 1.5;
       if (marketEvent.type === 'recession') grossMult = 0.7;
       if (marketEvent.type === 'labor_shortage') {
           payrollCostMult = startupData.upgrades?.includes('premium_servers') ? 1.2 : 1.4;
       }
   }
   
   const estGross = startupData.workload * 15 * locMultiplier * startupData.level * grossMult * upgradeGrossMult;
   const estCost = (startupData.payroll * 10 * locMultiplier * startupData.level * payrollCostMult) + (100 * locMultiplier * startupData.level * premiumServerMod);
   let estNet = estGross - estCost;
   let vcCutAmt = 0;
   if (estNet > 0) {
       vcCutAmt = estNet * ((100 - startupData.equityOwned) / 100);
       estNet *= (startupData.equityOwned / 100);
   }

   return (
      <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
         
         {/* ACTIVE MARKET EVENT ALERT */}
         {marketEvent && Date.now() < marketEvent.expiresAt && playerPath === 'founder' && (
            <div className={`p-4 rounded-2xl flex items-center justify-between border animate-in slide-in-from-top-4 duration-500 shadow-lg ${marketEvent.type === 'boom' ? 'bg-emerald-500/10 border-emerald-500/30' : marketEvent.type === 'labor_shortage' ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                <div className="flex items-center gap-3">
                   <AlertCircle className={`w-5 h-5 ${marketEvent.type === 'boom' ? 'text-emerald-400' : marketEvent.type === 'labor_shortage' ? 'text-yellow-400' : 'text-red-400'}`} />
                   <div>
                       <p className={`text-[10px] font-bold uppercase tracking-widest mb-0.5 ${marketEvent.type === 'boom' ? 'text-emerald-500' : marketEvent.type === 'labor_shortage' ? 'text-yellow-500' : 'text-red-500'}`}>Global Market Alert</p>
                       <p className="text-sm font-bold text-white leading-none">{marketEvent.name}: {marketEvent.message}</p>
                   </div>
                </div>
                <div className="text-right">
                   <p className="text-[10px] font-mono text-zinc-400 uppercase">Ends in</p>
                   <p className="text-sm font-mono font-bold text-white">{Math.ceil((marketEvent.expiresAt - Date.now()) / 60000)}m</p>
                </div>
            </div>
         )}

         {/* R&D UPGRADES MODAL */}
         {showUpgradesModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
                <div className="bg-[#121214] border border-white/10 rounded-[32px] w-full max-w-4xl p-8 shadow-2xl relative overflow-hidden">
                    <button onClick={() => setShowUpgradesModal(false)} className="absolute top-6 right-6 p-2 bg-white/5 hover:bg-white/10 rounded-full transition text-zinc-400 hover:text-white"><X className="w-5 h-5"/></button>
                    
                    <div className="text-center mb-10">
                       <Lightbulb className="w-12 h-12 text-cyan-400 mx-auto mb-4 drop-shadow-[0_0_20px_rgba(34,211,238,0.4)]" />
                       <h2 className="text-4xl font-black text-white tracking-tight mb-2">R&D Department</h2>
                       <p className="text-zinc-400 text-sm max-w-lg mx-auto">Invest your liquid capital into permanent infrastructure and talent to heavily optimize your profit margins.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[50vh] overflow-y-auto pr-2">
                        {STARTUP_UPGRADES.map(upg => {
                            const isOwned = startupData.upgrades?.includes(upg.id);
                            const isLocked = startupData.level < upg.minLevel;

                            return (
                                <div key={upg.id} className={`bg-black/40 border rounded-2xl p-6 flex flex-col transition ${isOwned ? 'border-emerald-500/50 bg-emerald-500/5' : isLocked ? 'border-white/5 opacity-50 grayscale' : 'border-white/10 hover:border-cyan-500/30'}`}>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${isOwned ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' : 'bg-white/5 border-white/10 text-zinc-400'}`}>
                                            <upg.icon className="w-5 h-5" />
                                        </div>
                                        {isOwned && <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Acquired</span>}
                                    </div>
                                    
                                    <h4 className={`font-black text-lg mb-1 ${isOwned ? 'text-white' : 'text-zinc-300'}`}>{upg.name}</h4>
                                    <p className="text-xs text-zinc-500 mb-6 flex-1 leading-relaxed">{upg.desc}</p>
                                    
                                    {!isOwned && (
                                        isLocked ? (
                                            <div className="w-full py-3 bg-white/5 text-zinc-500 font-bold rounded-xl text-xs text-center uppercase tracking-widest">
                                                Unlocks at Lv. {upg.minLevel}
                                            </div>
                                        ) : (
                                            <button onClick={() => handleBuyUpgrade(upg.id, upg.cost)} className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl transition text-xs uppercase tracking-widest flex justify-between px-4 items-center shadow-[0_0_20px_rgba(34,211,238,0.15)]">
                                                <span>Fund</span>
                                                <span className="font-mono">${upg.cost.toLocaleString()}</span>
                                            </button>
                                        )
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
         )}

         {/* VC PITCH MODAL */}
         {showVCModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
                <div className="bg-[#121214] border border-white/10 rounded-[32px] w-full max-w-4xl p-8 shadow-2xl relative overflow-hidden">
                    <button onClick={() => setShowVCModal(false)} className="absolute top-6 right-6 p-2 bg-white/5 hover:bg-white/10 rounded-full transition text-zinc-400 hover:text-white"><X className="w-5 h-5"/></button>
                    
                    <div className="text-center mb-10">
                       <Rocket className="w-12 h-12 text-orange-400 mx-auto mb-4 drop-shadow-[0_0_20px_rgba(249,115,22,0.4)]" />
                       <h2 className="text-4xl font-black text-white tracking-tight mb-2">Venture Capital Offers</h2>
                       <p className="text-zinc-400 text-sm max-w-lg mx-auto">You currently own <strong className="text-white">{startupData.equityOwned}%</strong> of {startupData.companyName}. You can permanently trade equity for massive upfront cash to fund your expansion.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Offer 1: High Cash, High Equity */}
                        <div className="bg-black/40 border border-blue-500/20 rounded-3xl p-6 flex flex-col items-center text-center group hover:border-blue-500/50 hover:bg-blue-500/5 transition">
                            <Building2 className="w-8 h-8 text-blue-400 mb-4" />
                            <h3 className="font-black text-lg text-white mb-1">Apex Capital</h3>
                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-6">Aggressive Expansion</p>
                            
                            <p className="text-3xl font-black text-emerald-400 mb-1">${(12000000 * startupData.level).toLocaleString()}</p>
                            <p className="text-xs text-red-400 font-bold mb-6">for 40% Equity</p>
                            
                            <button onClick={() => handleVCAccept(12000000 * startupData.level, 40)} disabled={startupData.equityOwned < 50} className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-xl transition mt-auto">Accept Deal</button>
                        </div>

                        {/* Offer 2: Medium */}
                        <div className="bg-black/40 border border-purple-500/20 rounded-3xl p-6 flex flex-col items-center text-center group hover:border-purple-500/50 hover:bg-purple-500/5 transition">
                            <Activity className="w-8 h-8 text-purple-400 mb-4" />
                            <h3 className="font-black text-lg text-white mb-1">Cobalt Ventures</h3>
                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-6">Balanced Growth</p>
                            
                            <p className="text-3xl font-black text-emerald-400 mb-1">${(5000000 * startupData.level).toLocaleString()}</p>
                            <p className="text-xs text-red-400 font-bold mb-6">for 20% Equity</p>
                            
                            <button onClick={() => handleVCAccept(5000000 * startupData.level, 20)} disabled={startupData.equityOwned < 30} className="w-full py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold rounded-xl transition mt-auto">Accept Deal</button>
                        </div>

                        {/* Offer 3: Low Cash, Low Equity */}
                        <div className="bg-black/40 border border-emerald-500/20 rounded-3xl p-6 flex flex-col items-center text-center group hover:border-emerald-500/50 hover:bg-emerald-500/5 transition">
                            <Landmark className="w-8 h-8 text-emerald-400 mb-4" />
                            <h3 className="font-black text-lg text-white mb-1">Pulse Angel Fund</h3>
                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-6">Seed Preservation</p>
                            
                            <p className="text-3xl font-black text-emerald-400 mb-1">${(1500000 * startupData.level).toLocaleString()}</p>
                            <p className="text-xs text-red-400 font-bold mb-6">for 8% Equity</p>
                            
                            <button onClick={() => handleVCAccept(1500000 * startupData.level, 8)} disabled={startupData.equityOwned < 15} className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl transition mt-auto">Accept Deal</button>
                        </div>
                    </div>
                </div>
            </div>
         )}

         {/* =========================================
            ROW 1: NET WORTH & FICO SCORE
         ========================================= */}
         <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
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

            <div className="lg:col-span-4 bg-[#121214] border border-white/5 rounded-[32px] p-6 sm:p-8 flex flex-col items-center justify-center text-center shadow-2xl relative overflow-hidden">
               <div className="absolute top-6 left-6 text-left">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Credit System</p>
                  <p className="text-xs text-zinc-400">FICO Tracking</p>
               </div>
               
               <div className="relative mt-12 mb-4 w-48 h-24 overflow-hidden flex items-end justify-center">
                  <svg className="absolute bottom-0 w-full h-full overflow-visible" viewBox="0 0 120 60">
                     <path d="M 10 60 A 50 50 0 0 1 110 60" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="15" strokeLinecap="round" />
                  </svg>
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
                  
                  {!startupData.companyName ? (
                     /* BRANDING ONBOARDING SCREEN */
                     <div className="relative z-10 flex flex-col items-center justify-center py-12 text-center h-full">
                         <Building2 className="w-16 h-16 text-orange-400 mb-6" />
                         <h3 className="text-3xl font-black text-white mb-2 tracking-tight">Incorporate Your Startup</h3>
                         <p className="text-zinc-400 text-sm mb-8 max-w-sm">You have the capital. Now give it a name and a ticker symbol to hit the market.</p>
                         
                         <div className="w-full max-w-sm space-y-4 mb-8 text-left">
                            <div>
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1 block">Company Name</label>
                                <input type="text" value={tempName} onChange={e => setTempName(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500 transition-colors font-bold" placeholder="e.g. Sour Corporation" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1 block">Ticker Symbol (Max 4)</label>
                                <div className="flex items-center gap-3">
                                   <span className="text-xl font-black text-zinc-500">$</span>
                                   <input type="text" value={tempTicker} onChange={e => setTempTicker(e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4))} className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500 transition-colors font-black tracking-widest" placeholder="SOUR" />
                                </div>
                            </div>
                         </div>

                         <button onClick={handleIncorporate} className="px-8 py-4 bg-orange-600 hover:bg-orange-500 text-white font-black uppercase tracking-widest rounded-xl transition shadow-[0_0_30px_rgba(249,115,22,0.3)]">
                             Sign Papers
                         </button>
                     </div>
                  ) : (
                     /* NORMAL FOUNDER DASHBOARD */
                     <>
                        <div className="flex justify-between items-start mb-8 relative z-10">
                           <div>
                              <p className="text-[10px] font-bold uppercase tracking-widest text-orange-500 mb-1 flex items-center gap-2">Company Dashboard <span className="bg-orange-500/10 border border-orange-500/30 text-orange-400 px-2 py-0.5 rounded font-mono text-[9px]">${startupData.ticker}</span></p>
                              <h3 className="text-2xl font-black text-white">{startupData.companyName}</h3>
                           </div>
                           <button onClick={safeSwitchPath} className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-zinc-300 transition">Switch Path</button>
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
                              
                              <div className="bg-black/40 border border-white/5 rounded-2xl p-4 flex flex-col gap-3 mt-4">
                                 <div className="flex justify-between items-center mb-1">
                                    <div>
                                       <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-0.5">Business Scale</p>
                                       <p className="text-lg font-black text-white">Lv. {startupData.level}</p>
                                    </div>
                                    <div className="text-right flex flex-col items-end">
                                       <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-0.5">Your Equity</p>
                                       <p className="text-lg font-black text-emerald-400 leading-none">{startupData.equityOwned}%</p>
                                       {startupData.equityOwned < 100 && (
                                          <button onClick={handleBuybackEquity} className="mt-1.5 text-[8px] font-bold uppercase tracking-widest bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 hover:bg-emerald-500/20 transition shadow-sm">Buy Back</button>
                                       )}
                                    </div>
                                 </div>
                                 <div className="flex flex-col gap-2 mt-2">
                                    <button onClick={() => {
                                       const moneyCost = startupData.level * 25000;
                                       const energyCost = startupData.level * 50;
                                       if (balance < moneyCost) return showAlert("Insufficient Funds", `You need $${moneyCost.toLocaleString()} to expand!`);
                                       if (energy < energyCost) return showAlert("Insufficient Energy", `You need ${energyCost} Energy to manage this expansion!`);
                                       
                                       setActiveJob({ id: 'expansion', title: 'Expand Operations', isExpansion: true, gameType: 'timing', difficulty: 'hard', basePay: 0, requiredClicks: 0, timeLimit: 45, icon: Building2 });
                                       setEnergy(energy - energyCost);
                                       saveGameState({ energy: energy - energyCost });
                                    }} className="w-full py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-[10px] uppercase tracking-widest font-black transition flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20">
                                       <Building2 className="w-4 h-4" /> Expand (-${(startupData.level * 25).toLocaleString()}k / -{startupData.level * 50}⚡)
                                    </button>
                                    <div className="flex gap-2">
                                       <button onClick={() => setShowUpgradesModal(true)} className="flex-1 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-xl text-[9px] uppercase tracking-widest font-black transition flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(34,211,238,0.1)]">
                                          <Lightbulb className="w-3 h-3" /> R&D Dept
                                       </button>
                                       <button onClick={() => setShowVCModal(true)} className="flex-1 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-xl text-[9px] uppercase tracking-widest font-black transition flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(99,102,241,0.1)]">
                                          <Activity className="w-3 h-3" /> Pitch VCs
                                       </button>
                                    </div>
                                 </div>
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
                                 <div className="flex justify-between items-center mt-2">
                                     <p className="text-[9px] text-zinc-500 font-mono">
                                         Trend: {Date.now() < (startupData.moraleBoostUntil || 0) ? '🔒 Locked (Boosted)' : startupData.payroll > startupData.workload ? '↑ Rising' : startupData.payroll < startupData.workload ? '↓ Falling' : '→ Stable'}
                                     </p>
                                     {Date.now() < (startupData.moraleBoostUntil || 0) ? (
                                         <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 shadow-sm flex items-center gap-1">
                                             🎉 {Math.ceil(((startupData.moraleBoostUntil || 0) - Date.now()) / 60000)}m left
                                         </span>
                                     ) : (
                                         <button onClick={handleHostRetreat} className="text-[9px] font-bold uppercase tracking-widest text-yellow-400 hover:text-yellow-300 bg-yellow-500/10 hover:bg-yellow-500/20 px-2 py-0.5 rounded border border-yellow-500/20 transition shadow-sm flex items-center gap-1">
                                             <PartyPopper className="w-3 h-3" /> Retreat (150+ ⚡)
                                         </button>
                                     )}
                                 </div>
                              </div>

                              <div className="grid grid-cols-2 gap-4 mb-4">
                                 <div className="bg-black/20 border border-white/5 rounded-xl p-3 relative overflow-hidden">
                                    <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 mb-1 flex justify-between">Est. Gross/Min {upgradeGrossMult > 1 && <span className="text-cyan-400 font-mono">+{((upgradeGrossMult-1)*100).toFixed(0)}% R&D</span>}</p>
                                    <p className="text-emerald-400 font-mono font-bold text-sm">${estGross.toLocaleString('en-US', {minimumFractionDigits: 2})}</p>
                                 </div>
                                 <div className="bg-black/20 border border-white/5 rounded-xl p-3 relative overflow-hidden">
                                    <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 mb-1 flex justify-between">Est. Cost/Min {premiumServerMod < 1 && <span className="text-cyan-400 font-mono">-{((1-premiumServerMod)*100).toFixed(0)}% R&D</span>}</p>
                                    <p className="text-red-400 font-mono font-bold text-sm">-${estCost.toLocaleString('en-US', {minimumFractionDigits: 2})}</p>
                                 </div>
                              </div>

                              <div className="flex items-center justify-between">
                                 <div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-0.5">Company Treasury</p>
                                    <p className={`text-2xl font-black font-mono tracking-tight ${pendingSalary >= 0 ? 'text-emerald-400' : 'text-red-500'}`}>
                                       {pendingSalary >= 0 ? '+' : '-'}${Math.abs(pendingSalary).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </p>
                                    {vcCutAmt > 0 && <p className="text-[8px] font-mono text-zinc-500 tracking-widest uppercase mt-1">VC Cut: -${vcCutAmt.toLocaleString('en-US', {maximumFractionDigits:0})}/min</p>}
                                 </div>
                                 <button onClick={handleClaimSalary} className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-emerald-500/20 whitespace-nowrap">
                                    Claim Dividend
                                 </button>
                              </div>
                           </div>
                        </div>
                     </>
                  )}
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
                     <button onClick={safeSwitchPath} className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-zinc-300 transition">Switch Path</button>
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
                           if (energy < 100) return showAlert("Not Enough Energy", "You need 100 Energy to request a meeting!");
                           setActiveJob({ id: 'promo', title: 'Boss Task', isPromotion: true, gameType: 'memory', difficulty: 'hard', basePay: 0, requiredClicks: 120, timeLimit: 30, icon: Briefcase });
                           setEnergy(energy - 100); saveGameState({ energy: energy - 100 });
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
                  <button onClick={safeSwitchPath} className="px-6 py-3 bg-white text-black font-bold rounded-xl transition hover:bg-zinc-200">Select Career</button>
               </div>
            )}

            {playerPath === 'hustler' && (
               <div className="lg:col-span-8 bg-[#121214] border border-emerald-500/20 rounded-[32px] p-6 sm:p-8 flex flex-col shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-3xl rounded-full pointer-events-none transition-transform group-hover:scale-110"></div>
                  <div className="flex justify-between items-start mb-8 relative z-10">
                     <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 mb-1">Gig Economy</p>
                        <h3 className="text-2xl font-black text-white">The Street Hustler <span className="text-sm text-zinc-500 font-mono">(Lv.{corporateLevel})</span></h3>
                     </div>
                     <div className="flex gap-2">
                        <button onClick={() => {
                           if (energy < 100) return showAlert("Low Energy", "You need 100 Energy to attempt a Rank Up mission!");
                           setActiveJob({ id: 'hustle_promo', title: 'Street Boss Challenge', isPromotion: true, gameType: 'memory', difficulty: 'hard', basePay: 0, requiredClicks: 0, timeLimit: 30, icon: ShieldAlert });
                           setEnergy(energy - 100); saveGameState({ energy: energy - 100 });
                        }} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-emerald-500/20">
                           Rank Up (100⚡)
                        </button>
                        <button onClick={safeSwitchPath} className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-zinc-300 transition">Switch Path</button>
                     </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10 max-h-[300px] overflow-y-auto pr-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-white/20 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.1)_transparent]">
                     {HUSTLER_JOBS.map(job => {
                        const isLocked = corporateLevel < job.minLevel;
                        return (
                           <button key={job.id} onClick={() => {
                              if (isLocked) return showAlert("Locked", `You need Street Rep Level ${job.minLevel} to unlock this gig.`);
                              if (energy < job.cost) return showAlert("Not Enough Energy", `You need ${job.cost} Energy to work!`);
                              setActiveJob({ id: job.id, title: job.title, gameType: job.type, difficulty: job.difficulty, basePay: job.pay, timeLimit: job.timeLimit, icon: job.icon });
                              setEnergy(energy - job.cost); saveGameState({ energy: energy - job.cost });
                           }} className={`p-4 bg-black/40 border border-white/5 rounded-2xl text-left transition group/btn ${isLocked ? 'opacity-50 grayscale cursor-not-allowed' : 'hover:border-emerald-500/30'}`}>
                              <div className="flex justify-between items-center mb-2">
                                 <div className="flex items-center gap-2">
                                    <job.icon className={`w-4 h-4 ${isLocked ? 'text-zinc-500' : 'text-emerald-400'}`} />
                                    <span className="font-bold text-white group-hover/btn:text-emerald-400 transition">{job.title}</span>
                                 </div>
                                 <span className="text-[10px] font-mono bg-white/10 px-2 py-1 rounded text-zinc-300">-{job.cost} ⚡</span>
                              </div>
                              <div className="flex justify-between items-end">
                                 <p className="text-xs text-zinc-500">{isLocked ? `Unlocks at Lv.${job.minLevel}` : job.desc}</p>
                                 <p className="text-emerald-400 font-mono font-bold text-sm">${job.pay}</p>
                              </div>
                           </button>
                        )
                     })}
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