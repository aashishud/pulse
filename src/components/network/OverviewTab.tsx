"use client";

import React, { useState, useEffect } from 'react';
import { 
  Activity, Landmark, TrendingUp, Zap, Clock, ShieldCheck, CheckCircle2, 
  ArrowRight, Briefcase, Building2, Minus, Truck, Car, Cpu, Server, 
  ShieldAlert, Fingerprint, AlertTriangle, AlertCircle, Rocket, X, 
  PartyPopper, Lightbulb, LayoutDashboard, Users, Bot, Globe, ChevronRight 
} from 'lucide-react';
import { AreaChart, Area, XAxis, ChartTooltip } from '@/components/ui/area-chart';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { LOCATIONS } from '@/lib/network-data';
import { Filter } from 'bad-words';

let filter: any; 
try { 
  filter = new Filter(); 
} catch (e) { 
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

const RND_TREES = [
  { 
    baseId: 'viral', name: 'Viral Campaigns', icon: TrendingUp, tiers: [ 
      { id: 'viral_1', lvl: 1, cost: 100000, desc: '+15% Gross Rev' }, 
      { id: 'viral_2', lvl: 5, cost: 500000, desc: '+40% Gross Rev' }, 
      { id: 'viral_3', lvl: 10, cost: 2000000, desc: '+80% Gross Rev' }, 
      { id: 'viral_4', lvl: 15, cost: 10000000, desc: '+150% Gross Rev' } 
    ] 
  },
  { 
    baseId: 'hr', name: 'Office Perks', icon: Users, tiers: [ 
      { id: 'hr_1', lvl: 2, cost: 250000, desc: '-30% Morale Drain' }, 
      { id: 'hr_2', lvl: 6, cost: 1000000, desc: '-50% Morale Drain' }, 
      { id: 'hr_3', lvl: 12, cost: 5000000, desc: '-80% Morale Drain' } 
    ] 
  },
  { 
    baseId: 'dev', name: 'Elite Developers', icon: Cpu, tiers: [ 
      { id: 'dev_1', lvl: 2, cost: 500000, desc: '+50% Gross Rev' }, 
      { id: 'dev_2', lvl: 8, cost: 2500000, desc: '+120% Gross Rev' }, 
      { id: 'dev_3', lvl: 18, cost: 15000000, desc: '+300% Gross Rev' } 
    ] 
  },
  { 
    baseId: 'server', name: 'Automated Systems', icon: Server, tiers: [ 
      { id: 'server_1', lvl: 3, cost: 1000000, desc: '-20% Base Cost' }, 
      { id: 'server_2', lvl: 9, cost: 5000000, desc: '-40% Base Cost' }, 
      { id: 'server_3', lvl: 20, cost: 25000000, desc: '-60% Base Cost' } 
    ] 
  },
  { 
    baseId: 'ai', name: 'Next-Gen AI', icon: Bot, tiers: [ 
      { id: 'ai_1', lvl: 5, cost: 5000000, desc: '2x Multiplier' }, 
      { id: 'ai_2', lvl: 15, cost: 25000000, desc: '4x Multiplier' }, 
      { id: 'ai_3', lvl: 25, cost: 100000000, desc: '8x Multiplier' } 
    ] 
  },
  { 
    baseId: 'qc', name: 'Quantum Infrastructure', icon: Zap, tiers: [ 
      { id: 'qc_1', lvl: 10, cost: 25000000, desc: '3x Multiplier' }, 
      { id: 'qc_2', lvl: 22, cost: 150000000, desc: '6x Multiplier' }, 
      { id: 'qc_3', lvl: 30, cost: 500000000, desc: '15x Multiplier' } 
    ] 
  }
];

const MA_TARGETS = [
  { id: 'acq_rival', name: 'Rival Tech Startup', lvl: 10, cost: 50000000, desc: 'A swift hostile takeover.', effect: '+50% Gross Revenue Multiplier' },
  { id: 'acq_data', name: 'Data Analytics Firm', lvl: 15, cost: 250000000, desc: 'Absorb their proprietary models.', effect: '+100% Gross Revenue Multiplier' },
  { id: 'acq_log', name: 'Global Logistics Corp', lvl: 20, cost: 1000000000, desc: 'Control the physical supply chain.', effect: '+200% Gross Revenue Multiplier' },
  { id: 'acq_social', name: 'Social Media Empire', lvl: 25, cost: 10000000000, desc: 'Harvest billions of active users.', effect: '+400% Gross Revenue Multiplier' },
  { id: 'acq_bank', name: 'Silicon Valley Bank', lvl: 30, cost: 50000000000, desc: 'You are now too big to fail.', effect: '+900% Gross Revenue Multiplier' }
];

function AnimatedFicoChart({ fico, size = 240, strokeWidth = 16 }: { fico: number, size?: number, strokeWidth?: number }) {
  const scorePercent = Math.max(0, Math.min(1, (fico - 300) / 550)) * 100; 
  const radius = size * 0.38; 
  const center = size / 2; 
  const circumference = Math.PI * radius; 
  const innerLineRadius = radius - strokeWidth - 6;

  const animatedValue = useMotionValue(0); 
  const offset = useTransform(animatedValue, [0, 100], [circumference, 0]); 
  const progressAngle = useTransform(animatedValue, [0, 100], [-Math.PI, 0]);
   
  useEffect(() => { 
    const controls = animate(animatedValue, scorePercent, { duration: 2, ease: "easeOut" }); 
    return controls.stop; 
  }, [scorePercent, animatedValue]);
   
  const rating = fico >= 800 ? 'Excellent' : fico >= 740 ? 'Very Good' : fico >= 670 ? 'Good' : fico >= 580 ? 'Fair' : 'Poor';
  const ratingColor = fico >= 800 ? 'text-indigo-400' : fico >= 740 ? 'text-indigo-300' : fico >= 670 ? 'text-emerald-400' : fico >= 580 ? 'text-yellow-400' : 'text-red-400';
   
  return (
    <div className="relative flex flex-col items-center justify-end mt-12 mb-4" style={{ width: size, height: center + 20 }}>
      <svg width={size} height={center + 20} viewBox={`0 0 ${size} ${center + 20}`} className="overflow-visible absolute bottom-8">
        <defs>
          <linearGradient id="ficoBaseGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.2" />
            <stop offset="50%" stopColor="#facc15" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.2" />
          </linearGradient>
          <linearGradient id="ficoGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="50%" stopColor="#facc15" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
          <filter id="dropshadow-fico" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#000000" floodOpacity="0.4" />
          </filter>
        </defs>
        
        <path 
          d={`M ${center - innerLineRadius} ${center} A ${innerLineRadius} ${innerLineRadius} 0 0 1 ${center + innerLineRadius} ${center}`} 
          fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" strokeLinecap="round" strokeDasharray="4 6" 
        />
        <path 
          d={`M ${center - radius} ${center} A ${radius} ${radius} 0 0 1 ${center + radius} ${center}`} 
          fill="none" stroke="url(#ficoBaseGrad)" strokeWidth={strokeWidth} strokeLinecap="round" 
        />
        <motion.path 
          d={`M ${center - radius} ${center} A ${radius} ${radius} 0 0 1 ${center + radius} ${center}`} 
          fill="none" stroke="url(#ficoGrad)" strokeWidth={strokeWidth} strokeLinecap="round" 
          strokeDasharray={circumference} style={{ strokeDashoffset: offset }} filter="url(#dropshadow-fico)" 
        />
        
        {/* Animated Needle and Dot */}
        <motion.line 
          x1={useTransform(progressAngle, (a) => center + Math.cos(a) * (radius - strokeWidth / 2)) as any} 
          y1={useTransform(progressAngle, (a) => center + Math.sin(a) * (radius - strokeWidth / 2)) as any} 
          x2={useTransform(progressAngle, (a) => center + Math.cos(a) * (radius + strokeWidth / 2 + 12)) as any} 
          y2={useTransform(progressAngle, (a) => center + Math.sin(a) * (radius + strokeWidth / 2 + 12)) as any} 
          stroke="#ffffff" strokeWidth="3" strokeLinecap="round" filter="url(#dropshadow-fico)" 
        />
        <motion.circle 
          cx={useTransform(progressAngle, (a) => center + Math.cos(a) * (radius + strokeWidth / 2 + 12)) as any} 
          cy={useTransform(progressAngle, (a) => center + Math.sin(a) * (radius + strokeWidth / 2 + 12)) as any} 
          r="4" fill="#ffffff" filter="url(#dropshadow-fico)" 
        />
      </svg>
      <div className="absolute bottom-0 flex flex-col items-center">
        <motion.span className="text-5xl font-black text-white leading-none tracking-tight drop-shadow-md">
          {useTransform(animatedValue, (latest) => Math.round(300 + (latest / 100) * 550))}
        </motion.span>
        <span className={`text-[10px] font-bold uppercase tracking-widest mt-1.5 ${ratingColor} drop-shadow-sm`}>
          {rating}
        </span>
      </div>
    </div>
  );
}

// Ensure all missing props are included in the component signature
export default function OverviewTab({ 
  netWorth, balance, savingsBalance, loanAccountBalance, assetValue, loanBalance, 
  fico, playerPath, netWorthHistory, currentLocName, energy, ownedVehicles, 
  setBalance, setSavingsBalance, setLoanAccountBalance, setEnergy, setActiveJob, saveGameState, 
  handleSwitchPathClick, corporateLevel, currentRole, displaySalary, pendingSalary, 
  monthlySalaryTarget, salaryProgressPercentage, handleClaimSalary, currentLocation, 
  ownedProperties, startupData, setStartupData, locMultiplier, getStartupMultipliers, 
  showAlert, showConfirm, showPrompt, nextTaxTime, taxCycleMinutes, marketEvent, 
  energyBlockUntil, setEnergyBlockUntil, showAccountSelect 
}: any) {
  
  const chartData = netWorthHistory.map((val: number, i: number) => ({ index: i, netWorth: val }));
  
  const getTaxTimeDisplay = () => { 
    if (!nextTaxTime) return "00:00"; 
    const ms = Math.max(0, nextTaxTime - Date.now()); 
    const m = Math.floor(ms / 60000).toString().padStart(2, '0'); 
    const s = Math.floor((ms % 60000) / 1000).toString().padStart(2, '0'); 
    return `${m}:${s}`; 
  };
  
  const [timeTick, setTimeTick] = useState(0); 
  
  useEffect(() => { 
    const i = setInterval(() => setTimeTick(t => t + 1), 1000); 
    return () => clearInterval(i); 
  }, []);

  const [tempName, setTempName] = useState(""); 
  const [tempTicker, setTempTicker] = useState("");
  const [showVCModal, setShowVCModal] = useState(false); 
  const [showUpgradesModal, setShowUpgradesModal] = useState(false); 
  const [showMAModal, setShowMAModal] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);

  const handleClaimWrapper = async () => {
     setIsClaiming(true);
     await handleClaimSalary();
     setIsClaiming(false);
  };

  const handleIncorporate = async () => {
    const cleanName = tempName.trim(); 
    const cleanTicker = tempTicker.trim();
    if (cleanName.length < 3) return showAlert("Error", "Company Name must be at least 3 characters.");
    if (cleanTicker.length < 2 || cleanTicker.length > 4) return showAlert("Error", "Ticker must be 2 to 4 characters.");
    if (filter.isProfane(cleanName) || filter.isProfane(cleanTicker)) return showAlert("Profanity Detected", "Please choose an appropriate company name and ticker symbol. We keep it professional on Wall Street.");
    
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
    await showAlert("Investment Secured!", `Received $${offer.toLocaleString()} for ${equity}% equity.`);
  };

  const handleBuybackEquity = async () => {
    const costPerPercent = 500000 * startupData.level; 
    const missingEquity = 100 - startupData.equityOwned;
    if (missingEquity <= 0) return showAlert("Max Equity", "You already own 100% of your company.");
    
    const input = await showPrompt(
      "Buy Back Equity", 
      `Missing ${missingEquity}% equity.\nVCs demand $${costPerPercent.toLocaleString()} per 1%.\nHow much % to buy back?`, 
      "5"
    ); 
    if (!input) return;
    
    const ptb = parseInt(input); 
    if (isNaN(ptb) || ptb <= 0) return showAlert("Error", "Invalid amount."); 
    if (ptb > missingEquity) return showAlert("Error", `Can only buy back up to ${missingEquity}%.`);
    
    const totalCost = ptb * costPerPercent; 
    if (balance < totalCost) return showAlert("Insufficient Funds", `Need $${totalCost.toLocaleString()} to buy back ${ptb}%.`);
    
    const confirm = await showConfirm("Confirm Buyback", `Spend $${totalCost.toLocaleString()} to regain ${ptb}% equity?`); 
    if (!confirm) return;
    
    const newEquity = startupData.equityOwned + ptb; 
    const newBal = balance - totalCost;
    setStartupData({ ...startupData, equityOwned: newEquity }); 
    setBalance(newBal); 
    saveGameState({ startup_data: { ...startupData, equityOwned: newEquity }, bank_balance: newBal });
    showAlert("Equity Recovered!", `Successfully bought back ${ptb}%. You now own ${newEquity}%.`);
  };

  const handleBuyUpgrade = async (tierId: string, cost: number) => {
    if (balance < cost) return showAlert("Insufficient Funds", `Need $${cost.toLocaleString()} for this R&D upgrade.`);
    
    const cf = await showConfirm("Fund R&D", `Spend $${cost.toLocaleString()} to integrate this upgrade?`); 
    if (!cf) return;
    
    const nb = balance - cost; 
    const nu = [...(startupData.upgrades || []), tierId]; 
    const ns = { ...startupData, upgrades: nu };
    setBalance(nb); 
    setStartupData(ns); 
    saveGameState({ bank_balance: nb, startup_data: ns }); 
    showAlert("Upgrade Acquired!", "R&D successfully integrated.");
  };

  const handleAcquisition = async (acqId: string, cost: number) => {
    const accs = [
      { id: "1", initials: "CA", name: "Current Account", details: `Available: $${balance.toLocaleString()}` }, 
      { id: "2", initials: "SV", name: "Savings Vault", details: `Available: $${(savingsBalance || 0).toLocaleString()}` }, 
      { id: "3", initials: "LA", name: "Loan Account", details: `Available: $${(loanAccountBalance || 0).toLocaleString()}` }
    ];
    
    const ch = await showAccountSelect("Hostile Takeover", `Acquiring for $${cost.toLocaleString()}.`, cost, accs); 
    if (!ch) return;
    
    let nb = balance;
    let ns = savingsBalance || 0;
    let nl = loanAccountBalance || 0;
    
    if (ch === "1") { 
      if(balance < cost) return showAlert("Error","Insufficient funds."); 
      nb -= cost; 
    } else if (ch === "2") { 
      if(ns < cost) return showAlert("Error","Insufficient funds."); 
      ns -= cost; 
    } else if (ch === "3") { 
      if(nl < cost) return showAlert("Error","Insufficient funds."); 
      nl -= cost; 
    }
    
    const na = [...(startupData.acquisitions || []), acqId]; 
    const nsd = { ...startupData, acquisitions: na };
    
    setBalance(nb); 
    if (setSavingsBalance) setSavingsBalance(ns); 
    if (setLoanAccountBalance) setLoanAccountBalance(nl); 
    setStartupData(nsd);
    
    saveGameState({ bank_balance: nb, savings_balance: ns, loan_account_balance: nl, startup_data: nsd });
    setShowMAModal(false); 
    showAlert("Takeover Successful!", "The acquisition was successful. Your global market share and revenue limits have drastically increased.");
  };

  const safeSwitchPath = () => { 
    if (playerPath === 'founder' && startupData?.equityOwned < 100) {
      return showAlert("Shareholders Blocked Exit", "Cannot abandon startup while VCs own equity. Buy back to 100% first."); 
    }
    handleSwitchPathClick(); 
  };

  const handleHostRetreat = async () => {
    if (energy < 150) return showAlert("Not Enough Energy", `Need at least 150 Energy to host Corporate Retreat!`);
    
    const cf = await showConfirm(
      "Host Corporate Retreat", 
      `Spend ALL Energy (${Math.floor(energy)}⚡) to throw a party?\nMorale locks at 100% for 30m.\nEnergy locked for 60m.`
    ); 
    if (!cf) return;
    
    const bT = Date.now() + (30 * 60000); 
    const bk = Date.now() + (60 * 60000); 
    const nS = { ...startupData, morale: 100, is_strike: false, moraleBoostUntil: bT };
    
    setEnergy(0); 
    setStartupData(nS); 
    setEnergyBlockUntil(bk); 
    saveGameState({ energy: 0, startup_data: nS, energy_block_until: bk });
    showAlert("Retreat Active! 🎉", "Morale locked at 100% for 30m. Energy locked for 60m.");
  };

  const mults = playerPath === 'founder' && startupData.companyName ? getStartupMultipliers(startupData, marketEvent) : { finalGross: 1, finalCost: 1, baseCostMod: 1, moraleRetain: 0 };
  const estGross = playerPath === 'founder' ? (startupData.workload * 15 * locMultiplier * startupData.level * mults.finalGross) : 0;
  const estCost = playerPath === 'founder' ? ((startupData.payroll * 10 * locMultiplier * startupData.level * mults.finalCost) + (100 * locMultiplier * startupData.level * mults.baseCostMod)) : 0;
  let estNet = estGross - estCost; 
  let vcCutAmt = 0; 
  if (estNet > 0) { 
    vcCutAmt = estNet * ((100 - startupData.equityOwned) / 100); 
    estNet *= (startupData.equityOwned / 100); 
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
      {marketEvent && Date.now() < marketEvent.expiresAt && playerPath === 'founder' && (
        <div className={`p-4 rounded-2xl flex items-center justify-between border animate-in slide-in-from-top-4 duration-500 shadow-lg ${marketEvent.type === 'boom' ? 'bg-emerald-500/10 border-emerald-500/30' : marketEvent.type === 'labor_shortage' ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
          <div className="flex items-center gap-3">
            <AlertCircle className={`w-5 h-5 ${marketEvent.type === 'boom' ? 'text-emerald-400' : marketEvent.type === 'labor_shortage' ? 'text-yellow-400' : 'text-red-400'}`} />
            <div>
              <p className={`text-[10px] font-bold uppercase tracking-widest mb-0.5 ${marketEvent.type === 'boom' ? 'text-emerald-500' : marketEvent.type === 'labor_shortage' ? 'text-yellow-500' : 'text-red-500'}`}>
                Global Market Alert
              </p>
              <p className="text-sm font-bold text-white leading-none">{marketEvent.name}: {marketEvent.message}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-mono text-zinc-400 uppercase">Ends in</p>
            <p className="text-sm font-mono font-bold text-white">{Math.ceil((marketEvent.expiresAt - Date.now()) / 60000)}m</p>
          </div>
        </div>
      )}

      {showUpgradesModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-[#121214] border border-white/10 rounded-[32px] w-full max-w-5xl p-8 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
            <button onClick={() => setShowUpgradesModal(false)} className="absolute top-6 right-6 p-2 bg-white/5 hover:bg-white/10 rounded-full transition text-zinc-400 hover:text-white">
              <X className="w-5 h-5"/>
            </button>
            <div className="text-center mb-10 shrink-0">
              <Lightbulb className="w-12 h-12 text-cyan-400 mx-auto mb-4 drop-shadow-[0_0_20px_rgba(34,211,238,0.4)]" />
              <h2 className="text-4xl font-black text-white tracking-tight mb-2">R&D Department</h2>
              <p className="text-zinc-400 text-sm max-w-lg mx-auto">Invest your liquid capital into permanent infrastructure and talent. Higher startup levels unlock deeper research tiers.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto pr-2 pb-6 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full">
              {RND_TREES.map(tree => {
                const ownedTiers = tree.tiers.filter(t => startupData.upgrades?.includes(t.id));
                const maxed = ownedTiers.length === tree.tiers.length;
                const nextTier = maxed ? tree.tiers[tree.tiers.length - 1] : tree.tiers[ownedTiers.length];
                const isLocked = !maxed && startupData.level < nextTier.lvl;
                
                return (
                  <div key={tree.baseId} className={`bg-black/40 border rounded-2xl p-6 flex flex-col transition ${maxed ? 'border-emerald-500/50 bg-emerald-500/5' : isLocked ? 'border-white/5 opacity-50 grayscale' : 'border-white/10 hover:border-cyan-500/30 shadow-[0_0_20px_rgba(34,211,238,0.05)]'}`}>
                    <div className="flex justify-between items-start mb-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${maxed ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400'}`}>
                        <tree.icon className="w-5 h-5" />
                      </div>
                      {maxed && (
                        <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3"/> Maxed
                        </span>
                      )}
                    </div>
                    <h4 className={`font-black text-lg mb-1 ${maxed ? 'text-white' : 'text-zinc-200'}`}>
                      {tree.name} <span className="text-zinc-500 font-mono text-sm ml-1">[{maxed ? tree.tiers.length : ownedTiers.length}/{tree.tiers.length}]</span>
                    </h4>
                    <p className="text-xs text-zinc-400 mb-6 flex-1 leading-relaxed border-l-2 border-white/10 pl-3">
                      Next Tier: {nextTier.desc}
                    </p>
                    
                    {!maxed && (
                      isLocked ? (
                        <div className="w-full py-3 bg-white/5 text-zinc-500 font-bold rounded-xl text-[10px] text-center uppercase tracking-widest">
                          Unlocks at Lv. {nextTier.lvl}
                        </div>
                      ) : (
                        <button 
                          onClick={() => handleBuyUpgrade(nextTier.id, nextTier.cost)} 
                          className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl transition text-[10px] uppercase tracking-widest flex justify-between px-4 items-center shadow-[0_0_20px_rgba(34,211,238,0.15)]"
                        >
                          <span>Research Tier {ownedTiers.length + 1}</span>
                          <span className="font-mono">${nextTier.cost.toLocaleString()}</span>
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

      {showMAModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-[#121214] border border-white/10 rounded-[32px] w-full max-w-4xl p-8 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
            <button onClick={() => setShowMAModal(false)} className="absolute top-6 right-6 p-2 bg-white/5 hover:bg-white/10 rounded-full transition text-zinc-400 hover:text-white">
              <X className="w-5 h-5"/>
            </button>
            <div className="text-center mb-10 shrink-0">
              <Building2 className="w-12 h-12 text-red-500 mx-auto mb-4 drop-shadow-[0_0_20px_rgba(239,68,68,0.4)]" />
              <h2 className="text-4xl font-black text-white tracking-tight mb-2">Mergers & Acquisitions</h2>
              <p className="text-zinc-400 text-sm max-w-lg mx-auto">Use your personal wealth to buy out competitors. Target acquired companies provide massive, permanent global multipliers.</p>
            </div>
            
            <div className="space-y-4 overflow-y-auto pr-2 pb-6 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full">
              {MA_TARGETS.map(tgt => {
                const isOwned = startupData.acquisitions?.includes(tgt.id);
                const isLocked = startupData.level < tgt.lvl;
                
                return (
                  <div key={tgt.id} className={`p-5 border rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition ${isOwned ? 'bg-emerald-500/5 border-emerald-500/30' : isLocked ? 'bg-black/40 border-white/5 opacity-50 grayscale' : 'bg-black/40 border-white/10 hover:border-red-500/30'}`}>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h4 className={`font-black text-lg ${isOwned ? 'text-emerald-400' : 'text-white'}`}>{tgt.name}</h4>
                        {isOwned && (
                          <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded">
                            Acquired
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-400 mb-2">{tgt.desc}</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-1 rounded inline-block">
                        {tgt.effect}
                      </p>
                    </div>
                    
                    <div className="w-full md:w-auto shrink-0">
                      {!isOwned && (
                        isLocked ? (
                          <div className="px-6 py-3 bg-white/5 text-zinc-500 font-bold rounded-xl text-[10px] text-center uppercase tracking-widest">
                            Unlocks at Lv. {tgt.lvl}
                          </div>
                        ) : (
                          <button 
                            onClick={() => handleAcquisition(tgt.id, tgt.cost)} 
                            className="w-full md:w-auto px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition text-[10px] uppercase tracking-widest flex justify-between gap-4 items-center shadow-[0_0_20px_rgba(239,68,68,0.2)]"
                          >
                            <span>Hostile Takeover</span>
                            <span className="font-mono">${tgt.cost.toLocaleString()}</span>
                          </button>
                        )
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {showVCModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-[#121214] border border-white/10 rounded-[32px] w-full max-w-4xl p-8 shadow-2xl relative overflow-hidden">
            <button onClick={() => setShowVCModal(false)} className="absolute top-6 right-6 p-2 bg-white/5 hover:bg-white/10 rounded-full transition text-zinc-400 hover:text-white">
              <X className="w-5 h-5"/>
            </button>
            <div className="text-center mb-10">
              <Rocket className="w-12 h-12 text-orange-400 mx-auto mb-4 drop-shadow-[0_0_20px_rgba(249,115,22,0.4)]" />
              <h2 className="text-4xl font-black text-white tracking-tight mb-2">Venture Capital Offers</h2>
              <p className="text-zinc-400 text-sm max-w-lg mx-auto">You currently own <strong className="text-white">{startupData.equityOwned}%</strong> of {startupData.companyName}. You can permanently trade equity for massive upfront cash to fund your expansion.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-black/40 border border-blue-500/20 rounded-3xl p-6 flex flex-col items-center text-center group hover:border-blue-500/50 hover:bg-blue-500/5 transition">
                <Building2 className="w-8 h-8 text-blue-400 mb-4" />
                <h3 className="font-black text-lg text-white mb-1">Apex Capital</h3>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-6">Aggressive Expansion</p>
                <p className="text-3xl font-black text-emerald-400 mb-1">${(12000000 * startupData.level).toLocaleString()}</p>
                <p className="text-xs text-red-400 font-bold mb-6">for 40% Equity</p>
                <button onClick={() => handleVCAccept(12000000 * startupData.level, 40)} disabled={startupData.equityOwned < 50} className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-xl transition mt-auto">Accept Deal</button>
              </div>
              
              <div className="bg-black/40 border border-purple-500/20 rounded-3xl p-6 flex flex-col items-center text-center group hover:border-purple-500/50 hover:bg-purple-500/5 transition">
                <Activity className="w-8 h-8 text-purple-400 mb-4" />
                <h3 className="font-black text-lg text-white mb-1">Cobalt Ventures</h3>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-6">Balanced Growth</p>
                <p className="text-3xl font-black text-emerald-400 mb-1">${(5000000 * startupData.level).toLocaleString()}</p>
                <p className="text-xs text-red-400 font-bold mb-6">for 20% Equity</p>
                <button onClick={() => handleVCAccept(5000000 * startupData.level, 20)} disabled={startupData.equityOwned < 30} className="w-full py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold rounded-xl transition mt-auto">Accept Deal</button>
              </div>
              
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
                Cash: ${(balance + (savingsBalance || 0)).toLocaleString('en-US')}
              </span>
              <span className="px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-lg text-xs font-bold font-mono">
                Assets: ${assetValue.toLocaleString('en-US')}
              </span>
            </div>
          </div>

          <div 
            className="flex-1 min-h-[150px] sm:min-h-[200px] w-full" 
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
                showCrosshair 
                showDots 
                rows={(point) => [{ 
                  color: "#34d399", 
                  label: "Net Worth", 
                  value: `$${(point.netWorth as number)?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
                }]} 
              />
            </AreaChart>
          </div>
        </div>

        <div className="lg:col-span-4 bg-[#121214] border border-white/5 rounded-[32px] p-6 sm:p-8 flex flex-col items-center justify-center text-center shadow-2xl relative overflow-hidden">
          <div className="absolute top-6 left-6 text-left z-10">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Credit System</p>
            <p className="text-xs text-zinc-400">FICO Tracking</p>
          </div>
          
          <AnimatedFicoChart fico={fico} size={240} strokeWidth={18} />
          
          <div className="flex justify-between w-full text-[10px] font-bold text-zinc-600 font-mono px-6 max-w-[260px] mx-auto z-10">
            <span>300</span>
            <span>850</span>
          </div>
        </div>
      </div>

      {/* =========================================
        ROW 2: CAREER HUB & TAXES
      ========================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {playerPath === 'founder' && (
          <div className="lg:col-span-8 bg-[#121214] border border-orange-500/20 rounded-[32px] p-6 sm:p-8 flex flex-col shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 blur-3xl rounded-full pointer-events-none transition-transform group-hover:scale-110"></div>
            
            {!startupData.companyName ? (
              <div className="relative z-10 flex flex-col items-center justify-center py-12 text-center h-full">
                <Building2 className="w-16 h-16 text-orange-400 mb-6" />
                <h3 className="text-3xl font-black text-white mb-2 tracking-tight">Incorporate Your Startup</h3>
                <p className="text-zinc-400 text-sm mb-8 max-w-sm">You have the capital. Now give it a name and a ticker symbol to hit the market.</p>
                <div className="w-full max-w-sm space-y-4 mb-8 text-left">
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1 block">Company Name</label>
                    <input 
                      type="text" 
                      value={tempName} 
                      onChange={e => setTempName(e.target.value)} 
                      className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500 transition-colors font-bold" 
                      placeholder="e.g. Sour Corporation" 
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1 block">Ticker Symbol (Max 4)</label>
                    <div className="flex items-center gap-3">
                      <span className="text-xl font-black text-zinc-500">$</span>
                      <input 
                        type="text" 
                        value={tempTicker} 
                        onChange={e => setTempTicker(e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4))} 
                        className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500 transition-colors font-black tracking-widest" 
                        placeholder="SOUR" 
                      />
                    </div>
                  </div>
                </div>
                <button 
                  onClick={handleIncorporate} 
                  className="px-8 py-4 bg-orange-600 hover:bg-orange-500 text-white font-black uppercase tracking-widest rounded-xl transition shadow-[0_0_30px_rgba(249,115,22,0.3)]"
                >
                  Sign Papers
                </button>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-start mb-8 relative z-10">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-orange-500 mb-1 flex items-center gap-2">
                      Company Dashboard <span className="bg-orange-500/10 border border-orange-500/30 text-orange-400 px-2 py-0.5 rounded font-mono text-[9px]">${startupData.ticker}</span>
                    </p>
                    <h3 className="text-2xl font-black text-white">{startupData.companyName}</h3>
                  </div>
                  <button 
                    onClick={safeSwitchPath} 
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-zinc-300 transition"
                  >
                    Switch Path
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10 flex-1">
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between text-xs font-bold text-zinc-400 mb-2">
                        <span>Employee Workload</span>
                        <span className="text-orange-400">{startupData.workload}%</span>
                      </div>
                      <input 
                        type="range" min="0" max="100" 
                        value={startupData.workload} 
                        onChange={(e) => setStartupData({...startupData, workload: parseInt(e.target.value)})} 
                        className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-white/10 accent-orange-500" 
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs font-bold text-zinc-400 mb-2">
                        <span>Payroll Budget</span>
                        <span className="text-emerald-400">{startupData.payroll}%</span>
                      </div>
                      <input 
                        type="range" min="0" max="100" 
                        value={startupData.payroll} 
                        onChange={(e) => setStartupData({...startupData, payroll: parseInt(e.target.value)})} 
                        className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-white/10 accent-emerald-500" 
                      />
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
                            <button 
                              onClick={handleBuybackEquity} 
                              className="mt-1.5 text-[8px] font-bold uppercase tracking-widest bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 hover:bg-emerald-500/20 transition shadow-sm"
                            >
                              Buy Back
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 mt-2">
                        <button 
                          onClick={() => { 
                            const mc = startupData.level * 25000; 
                            const ec = startupData.level * 50; 
                            if (balance < mc) return showAlert("Insufficient Funds", `Need $${mc.toLocaleString()} to expand!`); 
                            if (energy < ec) return showAlert("Insufficient Energy", `Need ${ec} Energy!`); 
                            
                            setActiveJob({ 
                              id: 'expansion', title: 'Expand Operations', isExpansion: true, 
                              gameType: 'timing', difficulty: 'hard', basePay: 0, 
                              requiredClicks: 0, timeLimit: 45, icon: Building2 
                            }); 
                            setEnergy(energy - ec); 
                            setBalance(balance - mc); 
                            saveGameState({ energy: energy - ec, bank_balance: balance - mc }); 
                          }} 
                          className="w-full py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-[10px] uppercase tracking-widest font-black transition flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20"
                        >
                          <Building2 className="w-4 h-4" /> Expand (-${(startupData.level * 25).toLocaleString()}k / -{startupData.level * 50}⚡)
                        </button>
                        
                        <div className="flex gap-2">
                          <button 
                            onClick={() => setShowUpgradesModal(true)} 
                            className="flex-1 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-xl text-[9px] uppercase tracking-widest font-black transition flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(34,211,238,0.1)]"
                          >
                            <Lightbulb className="w-3 h-3" /> R&D Dept
                          </button>
                          {startupData.level >= 10 && (
                            <button 
                              onClick={() => setShowMAModal(true)} 
                              className="flex-1 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 rounded-xl text-[9px] uppercase tracking-widest font-black transition flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(239,68,68,0.1)]"
                            >
                              <Globe className="w-3 h-3" /> M&A
                            </button>
                          )}
                          <button 
                            onClick={() => setShowVCModal(true)} 
                            className="flex-1 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-xl text-[9px] uppercase tracking-widest font-black transition flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(99,102,241,0.1)]"
                          >
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
                        <div 
                          className={`h-full transition-all duration-300 ${startupData.morale > 70 ? "bg-emerald-500" : startupData.morale > 30 ? "bg-yellow-500" : "bg-red-500"}`} 
                          style={{ width: `${startupData.morale}%` }}
                        />
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
                          <button 
                            onClick={handleHostRetreat} 
                            className="text-[9px] font-bold uppercase tracking-widest text-yellow-400 hover:text-yellow-300 bg-yellow-500/10 hover:bg-yellow-500/20 px-2 py-0.5 rounded border border-yellow-500/20 transition shadow-sm flex items-center gap-1"
                          >
                            <PartyPopper className="w-3 h-3" /> Retreat (150+ ⚡)
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-black/20 border border-white/5 rounded-xl p-3 relative overflow-hidden">
                        <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 mb-1 flex justify-between">
                          Est. Gross/Min {mults.finalGross > 1 && <span className="text-cyan-400 font-mono">+{Math.round((mults.finalGross-1)*100)}% Mod</span>}
                        </p>
                        <p className="text-emerald-400 font-mono font-bold text-sm">
                          ${estGross.toLocaleString('en-US', {minimumFractionDigits: 2})}
                        </p>
                      </div>
                      <div className="bg-black/20 border border-white/5 rounded-xl p-3 relative overflow-hidden">
                        <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 mb-1 flex justify-between">
                          Est. Cost/Min {mults.baseCostMod < 1 && <span className="text-cyan-400 font-mono">-{Math.round((1-mults.baseCostMod)*100)}% R&D</span>}
                        </p>
                        <p className="text-red-400 font-mono font-bold text-sm">
                          -${estCost.toLocaleString('en-US', {minimumFractionDigits: 2})}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-0.5">Company Treasury</p>
                        <p className={`text-2xl font-black font-mono tracking-tight ${pendingSalary >= 0 ? 'text-emerald-400' : 'text-red-500'}`}>
                          {pendingSalary >= 0 ? '+' : '-'}${Math.abs(pendingSalary).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        {vcCutAmt > 0 && (
                          <p className="text-[8px] font-mono text-zinc-500 tracking-widest uppercase mt-1">
                            VC Cut: -${vcCutAmt.toLocaleString('en-US', {maximumFractionDigits:0})}/min
                          </p>
                        )}
                      </div>
                      <button 
                        onClick={handleClaimWrapper} 
                        disabled={isClaiming}
                        className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 disabled:text-emerald-300 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-emerald-500/20 whitespace-nowrap"
                      >
                        {isClaiming ? "Processing..." : "Claim Dividend"}
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
                <h3 className="text-2xl font-black text-white">{currentRole?.title || "Employee"}</h3>
              </div>
              <button 
                onClick={safeSwitchPath} 
                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-zinc-300 transition"
              >
                Switch Path
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8 relative z-10">
              <div className="bg-black/20 border border-white/5 p-4 rounded-2xl">
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Base Salary</p>
                <p className="font-mono text-lg font-bold text-white">
                  ${currentRole?.payPerMinute.toFixed(2) || "0.00"}
                  <span className="text-xs text-zinc-500">/min</span>
                </p>
              </div>
              <div className="bg-black/20 border border-white/5 p-4 rounded-2xl sm:col-span-2 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Next Promotion</p>
                  <p className="text-sm font-bold text-zinc-300">Level {corporateLevel + 1}</p>
                </div>
                <button 
                  onClick={() => { 
                    if (energy < 100) return showAlert("Not Enough Energy", "Need 100 Energy!"); 
                    setActiveJob({ 
                      id: 'promo', title: 'Boss Task', isPromotion: true, gameType: 'memory', 
                      difficulty: 'hard', basePay: 0, requiredClicks: 120, timeLimit: 30, icon: Briefcase 
                    }); 
                    setEnergy(energy - 100); 
                    saveGameState({ energy: energy - 100 }); 
                  }} 
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-indigo-500/20"
                >
                  Request Meeting (100⚡)
                </button>
              </div>
            </div>

            <div className="mt-auto relative z-10">
              <div className="flex justify-between text-xs font-bold text-zinc-400 mb-2 uppercase tracking-widest">
                <span>Monthly Target</span>
                <span className="text-indigo-400 font-mono">${monthlySalaryTarget?.toLocaleString() || "0"}</span>
              </div>
              <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden mb-4">
                <div 
                  className="h-full bg-indigo-500 transition-all duration-300 relative" 
                  style={{ width: `${salaryProgressPercentage}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 w-full animate-pulse"></div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Accrued Paycheck</p>
                  <p className="text-2xl font-black font-mono tracking-tight text-white">
                    ${pendingSalary.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <button 
                  onClick={handleClaimWrapper} 
                  disabled={pendingSalary < monthlySalaryTarget || isClaiming} 
                  className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-white/5 disabled:text-zinc-600 disabled:border-transparent text-white border border-indigo-500/30 rounded-xl text-xs font-bold transition shadow-lg shadow-indigo-500/20"
                >
                  {isClaiming ? "Processing..." : pendingSalary < monthlySalaryTarget ? "Work Target Incomplete" : "Claim Paycheck"}
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
            <button 
              onClick={safeSwitchPath} 
              className="px-6 py-3 bg-white text-black font-bold rounded-xl transition hover:bg-zinc-200"
            >
              Select Career
            </button>
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
                <button 
                  onClick={() => { 
                    if (energy < 100) return showAlert("Low Energy", "Need 100 Energy!"); 
                    setActiveJob({ 
                      id: 'hustle_promo', title: 'Street Boss Challenge', isPromotion: true, gameType: 'memory', 
                      difficulty: 'hard', basePay: 0, requiredClicks: 0, timeLimit: 30, icon: ShieldAlert 
                    }); 
                    setEnergy(energy - 100); 
                    saveGameState({ energy: energy - 100 }); 
                  }} 
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-emerald-500/20"
                >
                  Rank Up (100⚡)
                </button>
                <button 
                  onClick={safeSwitchPath} 
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-zinc-300 transition"
                >
                  Switch Path
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10 max-h-[300px] overflow-y-auto pr-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-white/20 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.1)_transparent]">
              {HUSTLER_JOBS.map(job => {
                const isLocked = corporateLevel < job.minLevel;
                return (
                  <button 
                    key={job.id} 
                    onClick={() => { 
                      if (isLocked) return showAlert("Locked", `Need Street Rep Level ${job.minLevel}.`); 
                      if (energy < job.cost) return showAlert("Not Enough Energy", `Need ${job.cost} Energy to work!`); 
                      setActiveJob({ 
                        id: job.id, title: job.title, gameType: job.type, difficulty: job.difficulty, 
                        basePay: job.pay, timeLimit: job.timeLimit, icon: job.icon 
                      }); 
                      setEnergy(energy - job.cost); 
                      saveGameState({ energy: energy - job.cost }); 
                    }} 
                    className={`p-4 bg-black/40 border border-white/5 rounded-2xl text-left transition group/btn ${isLocked ? 'opacity-50 grayscale cursor-not-allowed' : 'hover:border-emerald-500/30'}`}
                  >
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

        {/* TAXES WIDGET (Always visible) */}
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