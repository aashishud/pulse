"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { 
  Activity, Building2, Briefcase, Car, Globe, Trophy, 
  MapPin, Zap, ChevronDown, CreditCard, ArrowUpRight, 
  Clock, Server, Coffee, Truck, MousePointerClick,
  Timer, Lock, CheckCircle2, Loader2, LogOut, X,
  Landmark, PiggyBank, ArrowRightLeft, Shield, Plane, Home
} from 'lucide-react';
import Link from 'next/link';

// ============================================================================
// GAME CONFIGURATION (LOCATIONS & REAL ESTATE)
// ============================================================================
const LOCATIONS: Record<string, any> = {
  bali: { name: "Bali", tax: 0.10, rent: 30, living: 15, multiplier: 0.5, perk: "Low Cost of Living" },
  london: { name: "London", tax: 0.25, rent: 120, living: 50, multiplier: 1.2, perk: "Balanced Lifestyle" },
  new_york: { name: "New York", tax: 0.38, rent: 300, living: 100, multiplier: 2.5, perk: "High Salary Multiplier" },
  zurich: { name: "Zurich", tax: 0.15, rent: 600, living: 200, multiplier: 1.0, perk: "The Banking Capital" },
  dubai: { name: "Dubai", tax: 0.00, rent: 800, living: 300, multiplier: 1.8, perk: "Tax Haven (0%)" }
};

const REAL_ESTATE: Record<string, { id: string, name: string, price: number }[]> = {
  bali: [
    { id: "bali_1", name: "Bamboo Hut", price: 5000 },
    { id: "bali_2", name: "Beach Shack", price: 15000 },
    { id: "bali_3", name: "Jungle Retreat", price: 50000 },
    { id: "bali_4", name: "Beachfront Villa", price: 150000 },
    { id: "bali_5", name: "Private Island", price: 5000000 },
  ],
  london: [
    { id: "lon_1", name: "Studio Flat", price: 50000 },
    { id: "lon_2", name: "City Apartment", price: 450000 },
    { id: "lon_3", name: "Thames Townhouse", price: 1200000 },
    { id: "lon_4", name: "Mayfair Penthouse", price: 3500000 },
    { id: "lon_5", name: "Historic Manor", price: 10000000 },
  ],
  new_york: [
    { id: "ny_1", name: "Brooklyn Loft", price: 200000 },
    { id: "ny_2", name: "Manhattan Penthouse", price: 1200000 },
    { id: "ny_3", name: "Tribeca Townhouse", price: 4000000 },
    { id: "ny_4", name: "Central Park Tower", price: 15000000 },
    { id: "ny_5", name: "Hamptons Estate", price: 35000000 },
  ],
  zurich: [
    { id: "zur_1", name: "Alpine Cabin", price: 100000 },
    { id: "zur_2", name: "Lakeview Apartment", price: 800000 },
    { id: "zur_3", name: "Alpine Chateau", price: 2800000 },
    { id: "zur_4", name: "Executive Villa", price: 8000000 },
    { id: "zur_5", name: "Swiss Castle", price: 25000000 },
  ],
  dubai: [
    { id: "dub_1", name: "Marina Apartment", price: 300000 },
    { id: "dub_2", name: "Palm Jumeirah Mansion", price: 3500000 },
    { id: "dub_3", name: "Burj Khalifa Penthouse", price: 12000000 },
    { id: "dub_4", name: "Emirates Palace", price: 40000000 },
    { id: "dub_5", name: "Artificial World Island", price: 150000000 },
  ]
};

// ============================================================================
// SHARED MICRO-COMPONENTS
// ============================================================================
const PulseLogo = ({ className = "w-6 h-6" }) => (
  <div className="relative inline-flex items-center justify-center">
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M10 28L14 4H22L28 10V14L22 20H16L14.5 28H10Z" fill="currentColor" />
      <path d="M16 9H20L22 11V13L20 15H15L16 9Z" fill="#000000" />
    </svg>
    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-[1.5px] border-black animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]"></span>
  </div>
);

const FicoRadialChart = ({ score }: { score: number }) => {
  const min = 300;
  const max = 850;
  const percentage = Math.max(0, Math.min(1, (score - min) / (max - min)));
  const strokeDasharray = 126; 
  const strokeDashoffset = strokeDasharray - (strokeDasharray * percentage);

  let label = "POOR";
  let colorClass = "text-red-400";
  if (score >= 580) { label = "FAIR"; colorClass = "text-orange-400"; }
  if (score >= 670) { label = "GOOD"; colorClass = "text-yellow-400"; }
  if (score >= 740) { label = "VERY GOOD"; colorClass = "text-emerald-400"; }
  if (score >= 800) { label = "EXCELLENT"; colorClass = "text-indigo-400"; }

  return (
    <div className="relative w-full aspect-[2/1] flex flex-col items-center justify-end overflow-hidden mt-4">
      <svg viewBox="0 0 100 55" className="w-full h-full overflow-visible drop-shadow-[0_0_15px_rgba(99,102,241,0.2)]">
        <defs>
          <linearGradient id="ficoGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="40%" stopColor="#eab308" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
        </defs>
        <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#27272a" strokeWidth="8" strokeLinecap="round" />
        <path 
          d="M 10 50 A 40 40 0 0 1 90 50" 
          fill="none" 
          stroke="url(#ficoGrad)" 
          strokeWidth="8" 
          strokeLinecap="round" 
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-1500 ease-out"
        />
      </svg>
      <div className="absolute bottom-0 flex flex-col items-center">
        <span className="text-3xl font-black font-mono tracking-tighter text-white">{Math.floor(score)}</span>
        <span className={`text-[10px] font-bold tracking-widest uppercase ${colorClass}`}>{label}</span>
      </div>
      <div className="absolute bottom-1 w-full flex justify-between px-4 text-[9px] font-mono tracking-widest text-zinc-500">
        <span>300</span>
        <span>850</span>
      </div>
    </div>
  );
};

const NetWorthChart = ({ data = [] }: { data?: number[] }) => {
  const safeData = data.length > 1 ? data : [0, Math.max(100, data[0] || 100)];
  const max = Math.max(...safeData, 100);
  const min = Math.min(...safeData, 0);
  const range = max - min || 1;
  
  const mappedScaled = safeData.map((val, i) => ({
     x: (i / (safeData.length - 1)) * 400,
     y: 100 - ((val - min) / range) * 80
  }));

  let d2 = `M${mappedScaled[0].x},${mappedScaled[0].y} `;
  for (let i = 0; i < mappedScaled.length - 1; i++) {
    const cp1x = mappedScaled[i].x + (mappedScaled[i+1].x - mappedScaled[i].x) / 2;
    const cp1y = mappedScaled[i].y;
    const cp2x = mappedScaled[i].x + (mappedScaled[i+1].x - mappedScaled[i].x) / 2;
    const cp2y = mappedScaled[i+1].y;
    d2 += `C${cp1x},${cp1y} ${cp2x},${cp2y} ${mappedScaled[i+1].x},${mappedScaled[i+1].y} `;
  }

  const areaD = `${d2} L400,120 L0,120 Z`;
  
  return (
    <div className="w-full h-40 mt-6 relative">
      <svg viewBox="0 0 400 120" className="w-full h-full preserve-3d" preserveAspectRatio="none">
        <defs>
          <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(16, 185, 129, 0.2)" />
            <stop offset="100%" stopColor="rgba(16, 185, 129, 0)" />
          </linearGradient>
        </defs>
        <path d="M0,30 L400,30 M0,70 L400,70" stroke="#ffffff10" strokeWidth="1" strokeDasharray="4 4" />
        <path d={areaD} fill="url(#chartFill)" />
        <path d={d2} fill="none" stroke="#10b981" strokeWidth="3" className="drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
      </svg>
    </div>
  );
};

const ActiveJobModal = ({ job, onClose, onComplete }: { job: any, onClose: () => void, onComplete: (success: boolean, timeRemaining: number) => void }) => {
  const [clicks, setClicks] = useState(0);
  const [timeLeft, setTimeLeft] = useState(job.timeLimit);
  const [isStarted, setIsStarted] = useState(false);

  useEffect(() => {
    if (!isStarted || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev: number) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isStarted]);

  useEffect(() => {
    if (isStarted && timeLeft <= 0) {
       onComplete(false, 0); 
    }
  }, [timeLeft, isStarted]);

  const handleClick = () => {
    if (!isStarted) setIsStarted(true);
    const newClicks = clicks + 1;
    setClicks(newClicks);
    if (newClicks >= job.clicksRequired) {
       onComplete(true, timeLeft);
    }
  };

  const progress = Math.min(100, (clicks / job.clicksRequired) * 100);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
       <div className="bg-[#121214] border border-white/10 rounded-[32px] p-8 w-full max-w-md shadow-2xl flex flex-col items-center text-center relative overflow-hidden">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 mb-4 shadow-inner">
             <MousePointerClick className="w-8 h-8 text-indigo-400" />
          </div>
          <h2 className="text-2xl font-black text-white mb-2">{job.title}</h2>
          <p className="text-zinc-400 text-sm mb-6 max-w-xs leading-relaxed">
            {isStarted ? "Keep clicking to complete the task before time runs out!" : "Click the button below to start the timer."}
          </p>
          <div className="w-full flex justify-between items-center mb-2 px-1">
             <div className="flex items-center gap-2 font-mono text-zinc-300 font-bold"><Timer className="w-4 h-4 text-red-400" /> {timeLeft}s</div>
             <div className="font-mono text-zinc-300 font-bold">{clicks} / {job.clicksRequired}</div>
          </div>
          <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden mb-8 border border-white/5">
             <div className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-100" style={{ width: `${progress}%` }}></div>
          </div>
          <button onClick={handleClick} className="w-full py-12 rounded-2xl bg-white/5 border-2 border-white/10 hover:bg-white/10 hover:border-white/20 active:scale-95 transition-all text-2xl font-black flex items-center justify-center select-none shadow-xl">
             {isStarted ? "WORK!" : "START JOB"}
          </button>
       </div>
    </div>
  );
};

// ============================================================================
// MODULAR TAB COMPONENTS
// ============================================================================

const OverviewTab = ({ netWorth, balance, savingsBalance, loanAccountBalance, assetValue, loanBalance, fico, playerPath, netWorthHistory }: any) => (
  <>
    <div className="lg:col-span-2 bg-[#121214] border border-white/5 rounded-[24px] p-6 shadow-2xl relative overflow-hidden flex flex-col justify-between group hover:border-white/10 transition-colors">
      <div className="absolute top-0 right-0 p-6 opacity-5"><Building2 className="w-32 h-32" /></div>
      <div className="relative z-10 flex justify-between items-start">
        <div>
          <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">The Central Bank</h3>
          <p className="text-xs font-medium text-zinc-400 mb-2">Total Combined Net Worth</p>
          <h2 className="text-5xl font-black font-mono tracking-tighter text-white drop-shadow-md transition-all duration-300">
            ${Number(netWorth).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h2>
        </div>
      </div>
      
      {/* Mini Breakdown (Emphasized Cash) */}
      <div className="relative z-10 mt-6 flex flex-col gap-3">
        <div className="flex items-center">
          <span className="text-emerald-400 font-black text-xl md:text-2xl bg-emerald-500/10 px-4 py-2 rounded-xl border border-emerald-500/20 drop-shadow-md">
            Cash: ${(Number(balance) + Number(savingsBalance)).toLocaleString('en-US')}
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs md:text-sm font-mono font-bold pl-2 opacity-80 flex-wrap">
          <span className="text-indigo-400 flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5"/> Assets: ${Number(assetValue).toLocaleString('en-US')}</span>
          {loanAccountBalance > 0 && <span className="text-orange-400 flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5"/> Loan Acc: ${Number(loanAccountBalance).toLocaleString('en-US')}</span>}
          {loanBalance > 0 && <span className="text-red-400 flex items-center gap-1.5"><ArrowUpRight className="w-3.5 h-3.5"/> Debt: -${Number(loanBalance).toLocaleString('en-US')}</span>}
        </div>
      </div>

      <NetWorthChart data={netWorthHistory} />
    </div>

    <div className="bg-[#121214] border border-white/5 rounded-[24px] p-6 shadow-2xl relative overflow-hidden flex flex-col items-center justify-center group [perspective:1000px] hover:border-white/10 transition-colors">
      <h3 className="absolute top-6 left-6 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">ServantCard™</h3>
      <div className="w-full max-w-[240px] aspect-[1.586/1] mt-6 rounded-2xl p-5 flex flex-col justify-between text-white relative shadow-[0_20px_40px_rgba(0,0,0,0.4)] transition-transform duration-500 ease-out group-hover:rotate-x-[5deg] group-hover:rotate-y-[-10deg] group-hover:scale-105 bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#111827] border border-white/10 backdrop-blur-md overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 transform -translate-x-full group-hover:translate-x-full"></div>
          <div className="flex justify-between items-start relative z-10">
            <div className="flex items-center gap-2 opacity-80"><Zap className="w-4 h-4" /><span className="font-bold text-sm tracking-tight">Pulse</span></div>
            <CreditCard className="w-5 h-5 opacity-50" />
          </div>
          <div className="relative z-10">
            <p className="text-[8px] uppercase tracking-widest text-indigo-200 mb-1 opacity-80">Class</p>
            <p className="font-mono text-lg font-bold tracking-widest uppercase">{playerPath}</p>
          </div>
      </div>
    </div>

    <div className="bg-[#121214] border border-white/5 rounded-[24px] p-6 shadow-2xl flex flex-col justify-between group hover:border-white/10 transition-colors">
      <div>
        <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Credit System</h3>
        <p className="text-xs font-medium text-zinc-400">FICO Score Tracking</p>
      </div>
      <FicoRadialChart score={fico} />
    </div>
  </>
);

const HustlerPath = ({ balance, energy, setBalance, setEnergy, setActiveJob, saveGameState, handleSwitchPathClick }: any) => (
  <div className="lg:col-span-2 bg-[#121214] border border-emerald-500/20 rounded-[24px] p-6 shadow-[0_0_30px_rgba(16,185,129,0.05)] flex flex-col justify-between">
    <div className="flex justify-between items-center mb-6">
      <div>
        <h3 className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Active Income</h3>
        <p className="text-lg font-black text-white">The Street Hustle</p>
      </div>
      <button onClick={handleSwitchPathClick} className="text-[10px] uppercase tracking-widest bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg font-bold transition-colors">
        Switch Path
      </button>
    </div>
    
    <div className="grid grid-cols-2 gap-3">
      <button 
        onClick={() => {
            if (energy < 15) return alert("Not enough energy! Buy coffee.");
            const newEnergy = Number(energy) - 15;
            setEnergy(newEnergy);
            saveGameState({ energy: newEnergy });
            setActiveJob({ title: "Deliver Food", basePay: 15.00, clicksRequired: 30, timeLimit: 10, isPromotion: false });
        }}
        className="flex items-center gap-3 bg-black/40 hover:bg-emerald-500/10 border border-white/5 hover:border-emerald-500/30 p-4 rounded-xl transition-all group text-left"
      >
        <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 group-hover:scale-110 transition-transform">
          <Truck className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <h4 className="font-bold text-sm text-white">Deliver Food</h4>
          <p className="text-[10px] font-mono text-zinc-500">Pays <span className="text-emerald-400">$15</span> • Costs <span className="text-yellow-400">15⚡</span></p>
        </div>
      </button>

      <button 
        onClick={() => {
            if (balance < 5) return alert("Not enough money!");
            const newBal = Number(balance) - 5;
            const newEnergy = Math.min(100, Number(energy) + 25);
            setBalance(newBal);
            setEnergy(newEnergy);
            saveGameState({ bank_balance: newBal, energy: newEnergy });
        }}
        className="flex items-center gap-3 bg-black/40 hover:bg-yellow-500/10 border border-white/5 hover:border-yellow-500/30 p-4 rounded-xl transition-all group text-left"
      >
        <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20 group-hover:scale-110 transition-transform">
          <Coffee className="w-5 h-5 text-yellow-400" />
        </div>
        <div>
          <h4 className="font-bold text-sm text-white">Buy Coffee</h4>
          <p className="text-[10px] font-mono text-zinc-500">Costs <span className="text-red-400">$5</span> • Restores <span className="text-yellow-400">25⚡</span></p>
        </div>
      </button>
    </div>
  </div>
);

const CorporatePath = ({ corporateLevel, energy, currentRole, displaySalary, pendingSalary, monthlySalaryTarget, salaryProgressPercentage, setEnergy, setActiveJob, saveGameState, handleClaimSalary, handleSwitchPathClick }: any) => (
  <div className="lg:col-span-2 bg-[#121214] border border-indigo-500/20 rounded-[24px] p-6 shadow-[0_0_30px_rgba(99,102,241,0.05)] flex flex-col justify-between">
    <div className="flex justify-between items-center mb-6">
      <div>
        <h3 className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Passive Income</h3>
        <p className="text-lg font-black text-white">Corporate Ladder</p>
      </div>
      <button onClick={handleSwitchPathClick} className="text-[10px] uppercase tracking-widest bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg font-bold transition-colors">
        Switch Path
      </button>
    </div>
    
    <div className="flex flex-col gap-4 bg-black/40 border border-white/5 rounded-xl p-4">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shrink-0">
          <Server className="w-6 h-6 text-indigo-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-base text-white leading-tight truncate">{currentRole.title}</h4>
          <p className="text-xs font-mono text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Salary: ${currentRole.payPerMinute.toFixed(2)} / min</p>
        </div>
        <button 
          onClick={() => {
              if (energy < 50) return alert("You need 50 energy to ask for a raise!");
              const newEnergy = Number(energy) - 50;
              setEnergy(newEnergy);
              saveGameState({ energy: newEnergy });
              const clicksReq = 80 + (corporateLevel * 10);
              setActiveJob({ title: "Boss Task (Hard)", basePay: 0, clicksRequired: clicksReq, timeLimit: 10, isPromotion: true });
          }}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition shadow-lg shrink-0"
        >
          Ask For Raise
        </button>
      </div>

      <div className="pt-4 border-t border-white/5">
        <div className="flex justify-between items-end mb-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Pending Salary (1 Month)</p>
              <p className="text-sm font-mono font-bold text-indigo-400">
                  ${Number(displaySalary).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-zinc-600 text-xs">/ ${monthlySalaryTarget.toLocaleString('en-US')}</span>
              </p>
            </div>
            <button 
              onClick={handleClaimSalary}
              disabled={Number(displaySalary) < monthlySalaryTarget}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:text-zinc-600 text-white text-xs font-bold rounded-lg transition border border-white/10 disabled:border-transparent"
            >
              Claim Paycheck
            </button>
        </div>
        <div className="w-full h-1.5 bg-black/50 rounded-full overflow-hidden border border-white/5">
            <div className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 transition-all duration-1000" style={{ width: `${salaryProgressPercentage}%` }}></div>
        </div>
      </div>
    </div>
  </div>
);

const DailyUpkeep = ({ pendingSalary, playerPath, currentLocation, ownedProperties }: any) => {
  const [timeLeft, setTimeLeft] = useState("23:59:59");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setHours(24, 0, 0, 0);
      const diff = tomorrow.getTime() - now.getTime();
      
      const h = Math.floor((diff / (1000 * 60 * 60)) % 24).toString().padStart(2, '0');
      const m = Math.floor((diff / 1000 / 60) % 60).toString().padStart(2, '0');
      const s = Math.floor((diff / 1000) % 60).toString().padStart(2, '0');
      
      setTimeLeft(`${h}:${m}:${s}`);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const locStats = LOCATIONS[currentLocation] || LOCATIONS.bali;
  
  // If they own ANY property in their current location, rent is waived!
  const ownsHome = ownedProperties.some((id: string) => REAL_ESTATE[currentLocation]?.find((p: any) => p.id === id));
  const rent = ownsHome ? 0 : locStats.rent;
  const living = locStats.living;
  
  const estTax = playerPath === 'corporate' ? (Number(pendingSalary) * locStats.tax) : 0;
  const total = rent + living + estTax;

  return (
    <div className="lg:col-span-2 bg-[#121214] border border-white/5 rounded-[24px] p-6 shadow-2xl flex flex-col justify-between hover:border-white/10 transition-colors">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">System</h3>
          <p className="text-sm font-bold text-white">Daily Upkeep (Taxes)</p>
        </div>
        <Clock className="w-4 h-4 text-zinc-500" />
      </div>
      
      <div className="text-center bg-black/40 border border-white/5 rounded-xl p-4 mb-4">
        <span className="text-2xl font-black font-mono tracking-tighter text-white">
          {mounted ? timeLeft : "23:59:59"}
        </span>
        <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-1">To Midnight Auto-Cut</p>
      </div>

      <div className="space-y-2 text-xs font-mono">
         <div className="flex justify-between border-b border-white/5 pb-1">
           <span className="text-zinc-400">Rent ({locStats.name})</span>
           {ownsHome ? (
              <span className="text-emerald-400 font-bold">Waived (Owner)</span>
           ) : (
              <span className="text-red-400">-${rent.toFixed(2)}</span>
           )}
         </div>
         <div className="flex justify-between border-b border-white/5 pb-1">
           <span className="text-zinc-400">Living & Groceries</span>
           <span className="text-red-400">-${living.toFixed(2)}</span>
         </div>
         <div className="flex justify-between border-b border-white/5 pb-1">
           <span className="text-zinc-400">Income Tax ({(locStats.tax * 100).toFixed(0)}%)</span>
           <span className={estTax > 0 ? "text-red-400" : "text-zinc-500"}>-${estTax.toFixed(2)}</span>
         </div>
         <div className="flex justify-between pt-1">
           <span className="font-bold text-white">Total Est. Cut</span>
           <span className="font-bold text-red-400">-${total.toFixed(2)}</span>
         </div>
      </div>
    </div>
  );
};

const BankingTab = ({ 
  balance, 
  savingsBalance, 
  loanBalance, 
  loanAccountBalance,
  fico, 
  selectedBank, 
  accountNumber,
  transferAmount, 
  setTransferAmount, 
  handleBankSelect, 
  handleTransfer, 
  handleTakeLoan, 
  handleRepayLoan 
}: any) => {
  const [loanInput, setLoanInput] = useState("");

  if (!selectedBank) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4 tracking-tight">Select a Financial Institution</h2>
            <p className="text-zinc-400 max-w-xl mx-auto">To store your wealth and earn interest, you must open an account. Choose wisely, as your bank dictates your financial perks.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button onClick={() => handleBankSelect('bop')} className="bg-[#121214] border border-white/10 hover:border-blue-500/50 p-8 rounded-3xl text-left flex flex-col group transition-all shadow-xl hover:shadow-[0_0_30px_rgba(59,130,246,0.15)]">
              <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400 mb-6 border border-blue-500/20 group-hover:scale-110 transition-transform"><Landmark className="w-6 h-6" /></div>
              <h3 className="text-xl font-black text-white mb-2">Bank of Pulse (BoP)</h3>
              <p className="text-sm text-zinc-400 mb-6">Beginner-friendly. No hidden account fees, straightforward banking.</p>
              <div className="mt-auto space-y-2 text-xs font-mono">
                  <div className="flex justify-between border-b border-white/5 pb-2"><span className="text-zinc-500">Account Fee</span><span className="text-emerald-400">$0 / day</span></div>
                  <div className="flex justify-between pt-1"><span className="text-zinc-500">Savings APY</span><span className="text-zinc-300">0.0%</span></div>
              </div>
            </button>
            <button onClick={() => handleBankSelect('maze')} className="bg-[#121214] border border-white/10 hover:border-red-500/50 p-8 rounded-3xl text-left flex flex-col group transition-all shadow-xl hover:shadow-[0_0_30px_rgba(239,68,68,0.15)]">
              <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-400 mb-6 border border-red-500/20 group-hover:scale-110 transition-transform"><Building2 className="w-6 h-6" /></div>
              <h3 className="text-xl font-black text-white mb-2">Maze Bank</h3>
              <p className="text-sm text-zinc-400 mb-6">The Investor's choice. High account fees, but free stock trading included.</p>
              <div className="mt-auto space-y-2 text-xs font-mono">
                  <div className="flex justify-between border-b border-white/5 pb-2"><span className="text-zinc-500">Account Fee</span><span className="text-red-400">-$50 / day</span></div>
                  <div className="flex justify-between pt-1"><span className="text-zinc-500">Trading Fee</span><span className="text-emerald-400">0%</span></div>
              </div>
            </button>
            <button onClick={() => handleBankSelect('swells')} className="bg-[#121214] border border-white/10 hover:border-emerald-500/50 p-8 rounded-3xl text-left flex flex-col group transition-all shadow-xl hover:shadow-[0_0_30px_rgba(16,185,129,0.15)]">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400 mb-6 border border-emerald-500/20 group-hover:scale-110 transition-transform"><PiggyBank className="w-6 h-6" /></div>
              <h3 className="text-xl font-black text-white mb-2">Swells Cargo</h3>
              <p className="text-sm text-zinc-400 mb-6">The Saver's choice. Highest APY on savings, but brutal interest rates on loans.</p>
              <div className="mt-auto space-y-2 text-xs font-mono">
                  <div className="flex justify-between border-b border-white/5 pb-2"><span className="text-zinc-500">Savings APY</span><span className="text-emerald-400">5.0% Daily</span></div>
                  <div className="flex justify-between pt-1"><span className="text-zinc-500">Loan Interest</span><span className="text-red-400">25% Brutal</span></div>
              </div>
            </button>
            <button onClick={() => handleBankSelect('capital_none')} className="bg-[#121214] border border-white/10 hover:border-indigo-500/50 p-8 rounded-3xl text-left flex flex-col group transition-all shadow-xl hover:shadow-[0_0_30px_rgba(99,102,241,0.15)]">
              <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 mb-6 border border-indigo-500/20 group-hover:scale-110 transition-transform"><Shield className="w-6 h-6" /></div>
              <h3 className="text-xl font-black text-white mb-2">Capital None</h3>
              <p className="text-sm text-zinc-400 mb-6">The Credit builder. Easiest bank to raise your FICO score and get high-limit loans.</p>
              <div className="mt-auto space-y-2 text-xs font-mono">
                  <div className="flex justify-between border-b border-white/5 pb-2"><span className="text-zinc-500">Credit Growth</span><span className="text-emerald-400">2x Speed</span></div>
                  <div className="flex justify-between pt-1"><span className="text-zinc-500">Loan Limit</span><span className="text-emerald-400">High</span></div>
              </div>
            </button>
        </div>
      </div>
    );
  }

  // Capital none multiplies FICO by 200 for loans, others multiply by 50
  const maxLoan = selectedBank === 'capital_none' ? fico * 200 : fico * 50;
  const availableCredit = Math.max(0, maxLoan - loanBalance);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-[#121214] border border-white/10 rounded-3xl p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5"><Landmark className="w-48 h-48" /></div>
          
          <div className="relative z-10 w-full flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Active Institution</p>
              <h2 className="text-3xl font-black text-white capitalize">{selectedBank.replace('_', ' ')}</h2>
            </div>
            <button 
              onClick={() => handleBankSelect(null)} 
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl transition border border-white/10 backdrop-blur-md"
            >
              Switch Bank
            </button>
          </div>
          
          <div className="relative z-10 w-full bg-black/40 p-4 rounded-2xl border border-white/5 flex justify-between items-center">
             <div>
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1">Secure Account Number</p>
                <p className="font-mono text-sm tracking-widest text-indigo-300">
                   {accountNumber ? accountNumber.match(/.{1,5}/g)?.join('-') : 'Generating...'}
                </p>
             </div>
             <Shield className="w-5 h-5 text-zinc-600" />
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#121214] border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden group hover:border-emerald-500/30 transition-colors">
            <div className="flex justify-between items-start mb-8">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2"><CreditCard className="w-4 h-4 text-emerald-400"/> Current Account</h3>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">Liquid Cash</p>
                </div>
            </div>
            <h2 className="text-3xl font-black font-mono tracking-tighter text-white">
                ${Number(balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h2>
          </div>
          <div className="bg-[#121214] border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden group hover:border-indigo-500/30 transition-colors">
            <div className="flex justify-between items-start mb-8">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2"><PiggyBank className="w-4 h-4 text-indigo-400"/> Savings Vault</h3>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">Earning Interest</p>
                </div>
            </div>
            <h2 className="text-3xl font-black font-mono tracking-tighter text-white">
                ${Number(savingsBalance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h2>
          </div>
          <div className="bg-[#121214] border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden group hover:border-orange-500/30 transition-colors">
            <div className="flex justify-between items-start mb-8">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2"><Briefcase className="w-4 h-4 text-orange-400"/> Loan Account</h3>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">Borrowed Funds</p>
                </div>
            </div>
            <h2 className="text-3xl font-black font-mono tracking-tighter text-white">
                ${Number(loanAccountBalance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h2>
          </div>
      </div>

      {/* Financial Interfaces Stacked */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          
          {/* Transfer Interface */}
          <div className="bg-black/40 border border-white/5 rounded-3xl p-8 shadow-inner">
            <h3 className="text-lg font-black text-white mb-6 text-center">Transfer Funds</h3>
            <p className="text-xs text-zinc-500 text-center mb-4">Move money between Current and Savings. Loan funds cannot be transferred to prevent network abuse.</p>
            <div className="flex flex-col items-center gap-6">
                <div className="relative w-full max-w-xs">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-400 font-mono">$</div>
                  <input 
                    type="number" 
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    className="w-full bg-[#121214] border border-white/10 rounded-2xl py-3.5 pl-8 pr-4 text-white font-mono text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                    placeholder="0.00"
                  />
                </div>
                <div className="flex w-full gap-3">
                  <button onClick={() => handleTransfer('to_savings')} className="flex-1 bg-white/5 hover:bg-indigo-500/20 text-white font-bold py-3.5 rounded-xl border border-white/10 hover:border-indigo-500/30 transition-all text-xs flex items-center justify-center gap-2">
                      <ArrowRightLeft className="w-4 h-4" /> To Savings
                  </button>
                  <button onClick={() => handleTransfer('to_current')} className="flex-1 bg-white/5 hover:bg-emerald-500/20 text-white font-bold py-3.5 rounded-xl border border-white/10 hover:border-emerald-500/30 transition-all text-xs flex items-center justify-center gap-2">
                      <ArrowRightLeft className="w-4 h-4" /> To Current
                  </button>
                </div>
            </div>
          </div>

          {/* Loan & Credit Interface */}
          <div className="bg-black/40 border border-white/5 rounded-3xl p-8 shadow-inner">
            <h3 className="text-lg font-black text-white mb-2 text-center">Credit Line & Loans</h3>
            <p className="text-[10px] text-zinc-500 text-center mb-6 uppercase tracking-widest font-bold">
                Available Credit: <span className="text-emerald-400">${availableCredit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </p>
            
            <div className="flex justify-between items-center mb-6 bg-white/5 p-4 rounded-2xl border border-white/10">
                <div>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1">Outstanding Balance</p>
                  <p className="text-xl font-black text-red-400 font-mono">${Number(loanBalance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
            </div>
            
            <div className="flex flex-col items-center gap-4">
                <div className="relative w-full max-w-xs">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-400 font-mono">$</div>
                  <input 
                    type="number" 
                    value={loanInput}
                    onChange={(e) => setLoanInput(e.target.value)}
                    className="w-full bg-[#121214] border border-white/10 rounded-2xl py-3.5 pl-8 pr-4 text-white font-mono text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                    placeholder="0.00"
                  />
                </div>
                <div className="flex w-full gap-3">
                  <button onClick={() => { handleTakeLoan(loanInput); setLoanInput(''); }} className="flex-1 bg-white/5 hover:bg-orange-500/20 text-white font-bold py-3.5 rounded-xl border border-white/10 hover:border-orange-500/30 transition-all text-xs">
                      Take Loan
                  </button>
                  <button onClick={() => { handleRepayLoan(loanInput); setLoanInput(''); }} className="flex-1 bg-white/5 hover:bg-emerald-500/20 text-white font-bold py-3.5 rounded-xl border border-white/10 hover:border-emerald-500/30 transition-all text-xs">
                      Repay
                  </button>
                </div>
            </div>
          </div>
      </div>
    </div>
  );
};

const RealEstateTab = ({ 
  currentLocation, 
  ownedProperties, 
  handleRelocate, 
  handleBuyProperty,
  handleSellProperty
}: any) => {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="text-center mb-10">
         <h2 className="text-3xl md:text-4xl font-black text-white mb-4 tracking-tight">Global Real Estate & Migration</h2>
         <p className="text-zinc-400 max-w-xl mx-auto">Relocating changes your tax brackets and cost of living. Purchasing any property in a city permanently removes rent expenses for that city.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Object.entries(LOCATIONS).map(([cityId, city]) => {
          const isCurrent = currentLocation === cityId;
          const cityProperties = REAL_ESTATE[cityId] || [];
          const ownsAnyHere = cityProperties.some(p => ownedProperties.includes(p.id));

          return (
            <div key={cityId} className={`bg-[#121214] border rounded-3xl p-6 flex flex-col transition-all ${isCurrent ? 'border-cyan-500/50 shadow-[0_0_30px_rgba(6,182,212,0.15)]' : 'border-white/10 hover:border-white/20 shadow-xl'}`}>
               
               {/* Header */}
               <div className="flex justify-between items-start mb-6">
                 <div>
                    <h3 className="text-2xl font-black text-white mb-1">{city.name}</h3>
                    <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">{city.perk}</p>
                 </div>
                 {isCurrent ? (
                    <div className="w-10 h-10 bg-cyan-500/20 rounded-full flex items-center justify-center shrink-0 border border-cyan-500/30 text-cyan-400" title="Current Location">
                      <MapPin className="w-5 h-5" />
                    </div>
                 ) : (
                    <button 
                      onClick={() => handleRelocate(cityId)}
                      className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/10 text-xs font-bold transition flex items-center gap-2"
                    >
                      <Plane className="w-4 h-4" /> Relocate ($500)
                    </button>
                 )}
               </div>

               {/* City Stats */}
               <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="bg-black/40 border border-white/5 rounded-xl p-3">
                     <p className="text-[10px] text-zinc-500 font-bold uppercase">Income Tax</p>
                     <p className={city.tax === 0 ? 'text-emerald-400 font-mono font-bold' : 'text-red-400 font-mono font-bold'}>{(city.tax * 100).toFixed(0)}%</p>
                  </div>
                  <div className="bg-black/40 border border-white/5 rounded-xl p-3">
                     <p className="text-[10px] text-zinc-500 font-bold uppercase">Daily Rent</p>
                     <p className={ownsAnyHere ? 'text-emerald-400 font-mono font-bold text-xs' : 'text-zinc-300 font-mono font-bold'}>{ownsAnyHere ? 'Waived (Owner)' : `$${city.rent}`}</p>
                  </div>
               </div>

               {/* Property Listings */}
               <div className="mt-auto border-t border-white/5 pt-4">
                  <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Available Properties</h4>
                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                     {cityProperties.map(prop => {
                        const isOwned = ownedProperties.includes(prop.id);
                        return (
                           <div key={prop.id} className={`flex justify-between items-center p-3 rounded-xl border transition-colors ${isOwned ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-black/20 border-white/5 hover:border-white/10'}`}>
                              <div>
                                 <p className={`text-sm font-bold ${isOwned ? 'text-emerald-400' : 'text-white'}`}>{prop.name}</p>
                                 <p className="text-[10px] text-zinc-400 font-mono">${prop.price.toLocaleString()}</p>
                              </div>
                              <button 
                                 onClick={() => isOwned ? handleSellProperty(prop.id) : handleBuyProperty(prop.id)}
                                 className={`px-4 py-1.5 rounded-lg text-xs font-bold transition shadow-md ${isOwned ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-white text-black hover:bg-zinc-200'}`}
                              >
                                 {isOwned ? 'Sell' : 'Buy'}
                              </button>
                           </div>
                        );
                     })}
                  </div>
               </div>

            </div>
          );
        })}
      </div>
    </div>
  );
};


// ============================================================================
// MAIN DASHBOARD LOOP
// ============================================================================
export default function NetworkDashboard() {
  const router = useRouter();
  
  // App State
  const [loading, setLoading] = useState(true);
  const [pulseProfile, setPulseProfile] = useState<any>(null);
  
  // Supabase Game State
  const [accountNumber, setAccountNumber] = useState<string | null>(null);
  const [balance, setBalance] = useState(0);
  const [savingsBalance, setSavingsBalance] = useState(0);
  const [loanAccountBalance, setLoanAccountBalance] = useState(0);
  const [loanBalance, setLoanBalance] = useState(0); // Debt owed

  const [netWorthHistory, setNetWorthHistory] = useState<number[]>([]);
  const [energy, setEnergy] = useState(100);
  const [fico, setFico] = useState(700);
  const [playerPath, setPlayerPath] = useState<string | null>(null);
  const [pathUpdatedAt, setPathUpdatedAt] = useState<string | null>(null);
  const [selectedBank, setSelectedBank] = useState<string | null>(null);
  const [corporateLevel, setCorporateLevel] = useState(1);
  
  // NEW Real Estate & Location State
  const [currentLocation, setCurrentLocation] = useState('bali');
  const [ownedProperties, setOwnedProperties] = useState<string[]>([]);
  
  // Salary State
  const [pendingSalary, setPendingSalary] = useState(0);
  const [lastLocalSync, setLastLocalSync] = useState<number | null>(null);

  // NEW: Energy Refill Tracker
  const [lastEnergySyncState, setLastEnergySyncState] = useState<number | null>(null);
  
  // Local UI State
  const [activeTab, setActiveTab] = useState('overview');
  const [activeJob, setActiveJob] = useState<any>(null);
  const [showPathSelection, setShowPathSelection] = useState(false);
  const [transferAmount, setTransferAmount] = useState("");

  const displaySalaryRef = useRef(pendingSalary);
  useEffect(() => { displaySalaryRef.current = pendingSalary; }, [pendingSalary]);

  // --- Dynamic Economy Math ---
  const locStats = LOCATIONS[currentLocation] || LOCATIONS.bali;
  
  // Calculate Asset Value from the new Expanded Property Catalog
  const assetValue = ownedProperties.reduce((sum, propId) => {
      for (const city in REAL_ESTATE) {
         const prop = REAL_ESTATE[city].find(p => p.id === propId);
         if (prop) return sum + prop.price;
      }
      return sum;
  }, 0);

  const totalNetWorth = Number(balance) + Number(savingsBalance) + Number(loanAccountBalance) + assetValue - Number(loanBalance);

  // Update Net Worth History Chart
  useEffect(() => {
     setNetWorthHistory(prev => {
        const next = [...prev, totalNetWorth];
        if (next.length > 20) next.shift(); 
        return next;
     });
  }, [totalNetWorth]);

  // --- Corporate Ladder Configuration ---
  const getCorporateRole = (level: number) => {
    let basePayPerMinute = 0.50;
    let title = "Junior Developer";
    
    if (level === 2) { title = "Mid-Level Developer"; basePayPerMinute = 1.50; }
    if (level === 3) { title = "Senior Developer"; basePayPerMinute = 4.00; }
    if (level === 4) { title = "Lead Developer"; basePayPerMinute = 10.00; }
    if (level >= 5) { title = `Executive Lv.${level}`; basePayPerMinute = 10.00 + ((level - 4) * 5); }

    // Dynamic Multiplier applied immediately
    return { title, payPerMinute: basePayPerMinute * locStats.multiplier };
  };
  
  const currentRole = getCorporateRole(corporateLevel);
  const monthlySalaryTarget = currentRole.payPerMinute * 450; 

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/");
        return;
      }

      try {
        const q = query(collection(db, "users"), where("owner_uid", "==", user.uid));
        const querySnapshot = await getDocs(q);
        let username = "Agent";
        
        if (!querySnapshot.empty) {
          const profileData = querySnapshot.docs[0].data();
          setPulseProfile(profileData);
          username = profileData.username || profileData.displayName || "Agent";
        }

        const res = await fetch("/api/bank", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ firebaseUid: user.uid, username })
        });
        
        const dbData = await res.json();
        
        if (dbData.data) {
          const initialBal = dbData.data.bank_balance != null ? Number(dbData.data.bank_balance) : 0;
          setBalance(initialBal);
          
          let loadedEnergy = dbData.data.energy != null ? Number(dbData.data.energy) : 100;
          
          setFico(dbData.data.fico_score != null ? Number(dbData.data.fico_score) : 700);
          setPlayerPath(dbData.data.player_path || null);
          setPathUpdatedAt(dbData.data.path_updated_at || null);
          setSelectedBank(dbData.data.selected_bank || null);
          
          // New Accounts Load
          setAccountNumber(dbData.data.account_number || null);
          setSavingsBalance(dbData.data.savings_balance != null ? Number(dbData.data.savings_balance) : 0);
          setLoanAccountBalance(dbData.data.loan_account_balance != null ? Number(dbData.data.loan_account_balance) : 0);
          setLoanBalance(dbData.data.loan_balance != null ? Number(dbData.data.loan_balance) : 0);
          
          // Load Location & Properties
          setCurrentLocation(dbData.data.location || 'bali');
          const loadedProps = dbData.data.owned_properties || [];
          const parsedProps = typeof loadedProps === 'string' ? JSON.parse(loadedProps) : loadedProps;
          setOwnedProperties(parsedProps);

          // Calculate Initial Asset Value
          const loadedAssetValue = parsedProps.reduce((sum: number, propId: string) => {
             for (const city in REAL_ESTATE) {
                const prop = REAL_ESTATE[city].find(p => p.id === propId);
                if (prop) return sum + prop.price;
             }
             return sum;
          }, 0);

          const loadedNetWorth = initialBal + (dbData.data.savings_balance != null ? Number(dbData.data.savings_balance) : 0) + (dbData.data.loan_account_balance != null ? Number(dbData.data.loan_account_balance) : 0) + loadedAssetValue - (dbData.data.loan_balance != null ? Number(dbData.data.loan_balance) : 0);
          const fakeHistory = Array.from({length: 20}, (_, i) => Math.max(0, loadedNetWorth * (0.3 + 0.7 * (i/19))));
          setNetWorthHistory(fakeHistory);

          const level = dbData.data.corporate_level != null ? Number(dbData.data.corporate_level) : 1;
          setCorporateLevel(level);
          
          const dbSalary = dbData.data.pending_salary != null ? Number(dbData.data.pending_salary) : 0;
          
          let offlineEarnings = 0;
          let syncAnchor = Date.now();

          // CORPORATE SALARY OFFLINE CALC
          if (dbData.data.player_path === 'corporate' && dbData.data.last_salary_sync) {
              const lastSync = new Date(dbData.data.last_salary_sync).getTime();
              const minutesOffline = Math.floor((Date.now() - lastSync) / 60000);
              
              if (minutesOffline > 0 && minutesOffline < 525600) { 
                 const basePay = level >= 5 ? 10 + ((level - 4) * 5) : [0.5, 1.5, 4, 10][level-1];
                 const currentLocMulti = LOCATIONS[dbData.data.location || 'bali'].multiplier;
                 offlineEarnings = minutesOffline * (basePay * currentLocMulti);
                 syncAnchor = lastSync + (minutesOffline * 60000);
              } else {
                 syncAnchor = lastSync;
              }
          }

          const totalLoadedSalary = dbSalary + offlineEarnings;
          setPendingSalary(totalLoadedSalary);
          setLastLocalSync(syncAnchor);
          
          if (offlineEarnings > 0) {
             saveGameState({ pending_salary: totalLoadedSalary, last_salary_sync: new Date(syncAnchor).toISOString() });
          }

          // === ENERGY OFFLINE CALC ===
          let energySyncAnchor = Date.now();
          if (dbData.data.last_energy_sync) {
              const lastEnergySync = new Date(dbData.data.last_energy_sync).getTime();
              const minutesOffline = Math.floor((Date.now() - lastEnergySync) / 60000);
              
              if (minutesOffline > 0 && loadedEnergy < 100) {
                 // Grants 5 Energy every 2 full minutes offline
                 const intervals = Math.floor(minutesOffline / 2);
                 loadedEnergy = Math.min(100, loadedEnergy + (intervals * 5));
                 energySyncAnchor = lastEnergySync + (intervals * 120000);
              } else {
                 energySyncAnchor = lastEnergySync;
              }
          }
          setEnergy(loadedEnergy);
          setLastEnergySyncState(energySyncAnchor);
          
          if (loadedEnergy !== (dbData.data.energy != null ? Number(dbData.data.energy) : 100)) {
             saveGameState({ energy: loadedEnergy, last_energy_sync: new Date(energySyncAnchor).toISOString() });
          }
        }
      } catch (error) {
        console.error("Error loading network data:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const saveGameState = async (updates: any) => {
    if (!auth.currentUser) return;
    try {
      const safeUpdates = { ...updates };
      if (safeUpdates.bank_balance !== undefined) safeUpdates.bank_balance = Math.floor(Number(safeUpdates.bank_balance));
      if (safeUpdates.savings_balance !== undefined) safeUpdates.savings_balance = Math.floor(Number(safeUpdates.savings_balance));
      if (safeUpdates.loan_account_balance !== undefined) safeUpdates.loan_account_balance = Math.floor(Number(safeUpdates.loan_account_balance));
      if (safeUpdates.loan_balance !== undefined) safeUpdates.loan_balance = Math.floor(Number(safeUpdates.loan_balance));
      if (safeUpdates.fico_score !== undefined) safeUpdates.fico_score = Math.floor(Number(safeUpdates.fico_score));
      if (safeUpdates.pending_salary !== undefined) safeUpdates.pending_salary = Number(Number(safeUpdates.pending_salary).toFixed(2));

      await fetch("/api/bank", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firebaseUid: auth.currentUser.uid, updates: safeUpdates })
      });
    } catch (error) {
      console.error("Failed to sync game state:", error);
    }
  };

  // --- ENERGY REFILL SYSTEM (ONLINE POLLING) ---
  useEffect(() => {
    if (!lastEnergySyncState) return;
    
    let currentSync = lastEnergySyncState;

    const interval = setInterval(() => {
      const now = Date.now();
      const minutesPassed = Math.floor((now - currentSync) / 60000);
      
      if (minutesPassed >= 2) {
          const intervals = Math.floor(minutesPassed / 2);
          
          setEnergy(prev => {
              const currentEnergy = Number(prev);
              if (currentEnergy >= 100) {
                  return currentEnergy;
              }
              const newEnergy = Math.min(100, currentEnergy + (intervals * 5));
              // Save to database
              saveGameState({ energy: newEnergy, last_energy_sync: new Date(now).toISOString() });
              return newEnergy;
          });
          
          currentSync += intervals * 120000;
          setLastEnergySyncState(currentSync); 
      }
    }, 1000); 
    
    return () => clearInterval(interval);
  }, [lastEnergySyncState]);

  useEffect(() => {
    if (playerPath !== 'corporate' || !lastLocalSync) return;
    
    let currentSync = lastLocalSync;

    const interval = setInterval(() => {
      const now = Date.now();
      const minutesPassed = Math.floor((now - currentSync) / 60000);
      
      if (minutesPassed >= 1) {
          const earnings = minutesPassed * currentRole.payPerMinute;
          setPendingSalary(prev => {
              const newValue = Number(prev) + earnings;
              saveGameState({ pending_salary: newValue, last_salary_sync: new Date(now).toISOString() });
              return newValue;
          });
          currentSync += minutesPassed * 60000;
      }
    }, 1000); 
    
    return () => clearInterval(interval);
  }, [playerPath, currentRole.payPerMinute, lastLocalSync]);

  const handleClaimSalary = () => {
    const currentSalary = Number(pendingSalary);
    if (currentSalary < monthlySalaryTarget) {
       alert(`You haven't completed a full month of work yet! You need $${monthlySalaryTarget.toLocaleString()} accumulated.`);
       return;
    }
    
    // Taxes now dynamically pulled from current location!
    const taxRate = locStats.tax; 
    const taxAmount = currentSalary * taxRate;
    const netAmount = currentSalary - taxAmount;
    const newBalance = Number(balance) + netAmount;
    
    setBalance(newBalance);
    setPendingSalary(0);
    setLastLocalSync(Date.now());

    saveGameState({ bank_balance: newBalance, pending_salary: 0, last_salary_sync: new Date().toISOString() });
    alert(`Payday! 🏢\n\nGross Salary: $${currentSalary.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\nIncome Tax (${(taxRate * 100).toFixed(0)}%): -$${taxAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n\nNet Added to Account: $${netAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
  };

  const handleJobComplete = (success: boolean, timeRemaining: number) => {
     setActiveJob(null);
     let newBalance = Number(balance);
     
     if (activeJob.isPromotion) {
        if (success) {
           const newLevel = corporateLevel + 1;
           setCorporateLevel(newLevel);
           alert(`Promotion Earned! You are now a ${getCorporateRole(newLevel).title}!`);
           saveGameState({ corporate_level: newLevel, energy });
        } else {
           alert(`Time's up! The boss wasn't impressed. No promotion this time.`);
           saveGameState({ energy });
        }
        return;
     }

     if (success) {
        const bonus = timeRemaining * 0.50; 
        const totalEarned = activeJob.basePay + bonus;
        newBalance += totalEarned;
        alert(`Job Complete! You earned $${activeJob.basePay} + $${bonus.toFixed(2)} speed bonus!`);
     } else {
        const penalty = activeJob.basePay * 0.20;
        newBalance -= penalty;
        alert(`Time's up! You failed the job. The client was angry and fined you $${penalty.toFixed(2)}!`);
     }

     setBalance(newBalance);
     saveGameState({ bank_balance: newBalance, energy });
  };

  const handleBankSelect = (bankId: string | null) => {
     setSelectedBank(bankId);
     const updates: any = { selected_bank: bankId };

     // Generate an account number if they don't have one yet
     if (bankId && !accountNumber) {
        const newAccNum = Array.from({length: 25}, () => Math.floor(Math.random() * 10)).join('');
        setAccountNumber(newAccNum);
        updates.account_number = newAccNum;
     }

     saveGameState(updates);
     if(bankId) alert("Account successfully opened! Welcome to " + bankId.toUpperCase());
  };

  const handleTransfer = (direction: 'to_savings' | 'to_current') => {
     const amount = parseFloat(transferAmount);
     if (isNaN(amount) || amount <= 0) return alert("Please enter a valid amount.");

     const currentLiquid = Number(balance);
     const currentSav = Number(savingsBalance);

     // Loan Account is excluded from free transfers to prevent farming
     if (direction === 'to_savings') {
        if (currentLiquid < amount) return alert("Insufficient liquid funds.");
        const newBal = currentLiquid - amount;
        const newSav = currentSav + amount;
        setBalance(newBal);
        setSavingsBalance(newSav);
        saveGameState({ bank_balance: newBal, savings_balance: newSav });
     } else {
        if (currentSav < amount) return alert("Insufficient savings funds.");
        const newBal = currentLiquid + amount;
        const newSav = currentSav - amount;
        setBalance(newBal);
        setSavingsBalance(newSav);
        saveGameState({ bank_balance: newBal, savings_balance: newSav });
     }
     setTransferAmount("");
  };

  const handleTakeLoan = (amountStr: string) => {
     const amount = parseFloat(amountStr);
     if (isNaN(amount) || amount <= 0) return alert("Invalid amount.");
     
     const maxLoan = selectedBank === 'capital_none' ? fico * 200 : fico * 50;
     const availableCredit = Math.max(0, maxLoan - loanBalance);
     
     if (amount > availableCredit) return alert(`Credit limit exceeded. You can only borrow up to $${availableCredit.toLocaleString('en-US')}.`);
     
     // Funds now go directly to the Loan Account instead of Current
     const newLoanAccBal = Number(loanAccountBalance) + amount;
     const newLoanDebt = Number(loanBalance) + amount;
     
     setLoanAccountBalance(newLoanAccBal);
     setLoanBalance(newLoanDebt);
     saveGameState({ loan_account_balance: newLoanAccBal, loan_balance: newLoanDebt });
     alert(`Loan approved! $${amount.toLocaleString('en-US')} has been deposited to your locked Loan Account.`);
  };

  const handleRepayLoan = (amountStr: string) => {
     const amount = parseFloat(amountStr);
     if (isNaN(amount) || amount <= 0) return alert("Invalid amount.");
     
     const actualRepayment = Math.min(amount, loanBalance);
     if (actualRepayment <= 0) return alert("You don't owe any money!");

     const accountChoice = prompt(`Repay $${actualRepayment.toLocaleString()} from which account?\n\n1: Current Account\n2: Loan Account (Return unused funds)`, "1");
     
     let newBal = Number(balance);
     let newLoanAccBal = Number(loanAccountBalance);

     if (accountChoice === "1") {
         if (actualRepayment > newBal) return alert("Insufficient liquid funds in Current Account.");
         newBal -= actualRepayment;
     } else if (accountChoice === "2") {
         if (actualRepayment > newLoanAccBal) return alert("Insufficient funds in Loan Account.");
         newLoanAccBal -= actualRepayment;
     } else {
         return; // Cancelled
     }

     const newLoanDebt = Number(loanBalance) - actualRepayment;
     
     const ficoBoost = Math.floor(actualRepayment / 1000);
     const newFico = Math.min(850, fico + (ficoBoost > 0 ? ficoBoost : 1));
     
     setBalance(newBal);
     setLoanAccountBalance(newLoanAccBal);
     setLoanBalance(newLoanDebt);
     setFico(newFico);
     saveGameState({ bank_balance: newBal, loan_account_balance: newLoanAccBal, loan_balance: newLoanDebt, fico_score: newFico });
     
     alert(`Successfully repaid $${actualRepayment.toLocaleString('en-US')}! Your FICO score increased by ${ficoBoost > 0 ? ficoBoost : 1} points.`);
  };

  const handleSwitchPathClick = () => {
    if (pathUpdatedAt) {
      const lastUpdate = new Date(pathUpdatedAt).getTime();
      const now = new Date().getTime();
      const hoursSince = (now - lastUpdate) / (1000 * 60 * 60);
      if (hoursSince < 24) {
        const hoursLeft = Math.ceil(24 - hoursSince);
        return alert(`ACCESS DENIED: You must wait ${hoursLeft} more hours before switching your career path.`);
      }
    }
    setShowPathSelection(true);
  };

  const handlePathSelect = (newPath: string) => {
    const now = new Date().toISOString();
    setPlayerPath(newPath);
    setPathUpdatedAt(now);
    setShowPathSelection(false);
    saveGameState({ 
        player_path: newPath, 
        path_updated_at: now, 
        last_salary_sync: now,
        last_energy_sync: lastEnergySyncState ? new Date(lastEnergySyncState).toISOString() : now
    });
    
    if (newPath === 'corporate') {
       setPendingSalary(0);
       setLastLocalSync(Date.now());
    }
  };

  // --- NEW REAL ESTATE FUNCTIONS ---
  const handleRelocate = (cityId: string) => {
    const flightCost = 500;
    if (Number(balance) < flightCost) return alert(`Insufficient liquid funds to relocate. You need $${flightCost} for a ticket.`);
    
    const newBal = Number(balance) - flightCost;
    setBalance(newBal);
    setCurrentLocation(cityId);
    saveGameState({ bank_balance: newBal, location: cityId });
    alert(`Flight landed! Welcome to ${LOCATIONS[cityId].name}.`);
  };

  const handleBuyProperty = (propertyId: string) => {
    // Find the property across all cities
    let propertyInfo: any = null;
    let cityInfo: any = null;
    for (const [cId, props] of Object.entries(REAL_ESTATE)) {
       const found = props.find(p => p.id === propertyId);
       if (found) { propertyInfo = found; cityInfo = LOCATIONS[cId]; break; }
    }
    if (!propertyInfo) return;

    const price = propertyInfo.price;
    
    // Explicit Prompt for purchasing account
    const accountChoice = prompt(
      `Purchasing ${propertyInfo.name} for $${price.toLocaleString()}.\n\nType '1' for Current Account\nType '2' for Savings Vault\nType '3' for Loan Account`, 
      "1"
    );

    if (!["1", "2", "3"].includes(accountChoice as string)) return;

    const newProps = [...ownedProperties, propertyInfo.id];
    let updates: any = { owned_properties: newProps };

    if (accountChoice === "1") {
       if (Number(balance) < price) return alert(`Insufficient liquid funds in Current Account. You need $${price.toLocaleString()}.`);
       const newBal = Number(balance) - price;
       setBalance(newBal);
       updates.bank_balance = newBal;
    } else if (accountChoice === "2") {
       if (Number(savingsBalance) < price) return alert(`Insufficient funds in Savings Vault. You need $${price.toLocaleString()}.`);
       const newSav = Number(savingsBalance) - price;
       setSavingsBalance(newSav);
       updates.savings_balance = newSav;
    } else if (accountChoice === "3") {
       if (Number(loanAccountBalance) < price) return alert(`Insufficient funds in Loan Account. You need $${price.toLocaleString()}.`);
       const newLoanAcc = Number(loanAccountBalance) - price;
       setLoanAccountBalance(newLoanAcc);
       updates.loan_account_balance = newLoanAcc;
    }

    setOwnedProperties(newProps);
    saveGameState(updates);

    alert(`Congratulations! You are the proud new owner of the ${propertyInfo.name} in ${cityInfo.name}! Rent is now permanently waived here.`);
  };

  const handleSellProperty = (propertyId: string) => {
    let propertyInfo: any = null;
    for (const [cId, props] of Object.entries(REAL_ESTATE)) {
       const found = props.find(p => p.id === propertyId);
       if (found) { propertyInfo = found; break; }
    }
    if (!propertyInfo) return;

    const price = propertyInfo.price;
    const confirmSell = confirm(`Are you sure you want to sell the ${propertyInfo.name} for $${price.toLocaleString()}?\n\nThe funds will be deposited into your Current Account.`);
    
    if (!confirmSell) return;

    const newBal = Number(balance) + price;
    const newProps = ownedProperties.filter(id => id !== propertyId);
    
    setBalance(newBal);
    setOwnedProperties(newProps);
    saveGameState({ bank_balance: newBal, owned_properties: newProps });
    
    alert(`Property sold! $${price.toLocaleString()} has been deposited to your Current Account.`);
  };

  const handleDevBypass = () => {
     const input = prompt("Enter amount of cash to add (use negative to remove):", "1000000");
     if (input === null) return;

     const amountToAdd = parseFloat(input);
     if (isNaN(amountToAdd)) return alert("Invalid number entered.");

     const newBal = Number(balance) + amountToAdd;
     setBalance(newBal);
     setEnergy(100);
     setFico(850);
     setLoanBalance(0);
     setPathUpdatedAt(null);
     setPendingSalary(monthlySalaryTarget); 
     setLastLocalSync(Date.now());
     setLastEnergySyncState(Date.now());
     
     saveGameState({ 
       bank_balance: newBal, 
       energy: 100, 
       fico_score: 850, 
       loan_balance: 0, 
       path_updated_at: null, 
       pending_salary: monthlySalaryTarget, 
       last_salary_sync: new Date().toISOString(),
       last_energy_sync: new Date().toISOString()
     });
     
     const formattedAmount = amountToAdd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
     alert(`God Mode Activated: Added $${formattedAmount}, FICO 850, Loans Cleared, Cooldowns Reset.`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-white">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-4" />
        <p className="text-zinc-500 font-mono text-sm uppercase tracking-widest animate-pulse">Syncing Secure Database...</p>
      </div>
    );
  }

  // --- PATH SELECTION OVERLAY ---
  if (!playerPath || showPathSelection) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050505]/95 backdrop-blur-2xl p-4 overflow-y-auto">
         {/* Cancel Button (Only show if they already have a path and are just trying to switch) */}
         {playerPath && (
           <button onClick={() => setShowPathSelection(false)} className="absolute top-8 right-8 text-zinc-500 hover:text-white transition-colors bg-white/5 p-2 rounded-full">
             <X className="w-6 h-6" />
           </button>
         )}

         <div className="max-w-5xl w-full py-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="text-center mb-12">
               <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-white mb-4">Choose Your Path</h1>
               <p className="text-zinc-400 text-lg max-w-xl mx-auto">
                 {playerPath ? "Warning: Switching paths will lock this decision for 24 hours." : "How will you build your empire? Your choice determines your gameplay mechanics, income style, and risks."}
               </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <button 
                  onClick={() => handlePathSelect('hustler')}
                  className={`group border rounded-3xl p-8 text-left transition-all flex flex-col justify-between min-h-[400px] cursor-pointer ${playerPath === 'hustler' ? 'bg-emerald-500/10 border-emerald-500/50 shadow-[0_0_40px_rgba(16,185,129,0.15)]' : 'bg-[#121214] border-white/10 hover:border-emerald-500/50 hover:-translate-y-2 hover:shadow-[0_0_40px_rgba(16,185,129,0.15)]'}`}
               >
                  <div>
                     <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20 mb-6 group-hover:scale-110 transition-transform">
                        <Zap className="w-7 h-7 text-emerald-400" />
                     </div>
                     <h3 className="text-2xl font-black text-white mb-2">The Street Hustler</h3>
                     <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                        Active gameplay. Take on gig economy jobs. You have to click to complete tasks before the timer runs out. Finish fast for bonuses, finish late for penalties.
                     </p>
                  </div>
               </button>

               <button 
                  onClick={() => handlePathSelect('corporate')}
                  className={`group border rounded-3xl p-8 text-left transition-all flex flex-col justify-between min-h-[400px] cursor-pointer ${playerPath === 'corporate' ? 'bg-indigo-500/10 border-indigo-500/50 shadow-[0_0_40px_rgba(99,102,241,0.15)]' : 'bg-[#121214] border-white/10 hover:border-indigo-500/50 hover:-translate-y-2 hover:shadow-[0_0_40px_rgba(99,102,241,0.15)]'}`}
               >
                  <div>
                     <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20 mb-6 group-hover:scale-110 transition-transform">
                        <Briefcase className="w-7 h-7 text-indigo-400" />
                     </div>
                     <h3 className="text-2xl font-black text-white mb-2">Corporate Worker</h3>
                     <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                        Stable passive income. Accrue your salary per minute and claim it monthly. Perform "Boss Tasks" to earn promotions and raise your income.
                     </p>
                  </div>
               </button>

               <div className="group bg-[#121214]/50 border border-white/5 rounded-3xl p-8 text-left flex flex-col justify-between min-h-[400px] relative overflow-hidden opacity-70">
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
                     <Lock className="w-8 h-8 text-zinc-500 mb-2" />
                     <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Requires $50k Bank</p>
                  </div>
                  <div className="blur-sm">
                     <div className="w-14 h-14 bg-orange-500/10 rounded-2xl flex items-center justify-center border border-orange-500/20 mb-6">
                        <Building2 className="w-7 h-7 text-orange-400" />
                     </div>
                     <h3 className="text-2xl font-black text-white mb-2">The Founder</h3>
                  </div>
               </div>
            </div>
         </div>
      </div>
    );
  }

  const displayName = pulseProfile?.username || pulseProfile?.displayName || "PlayerOne";
  const avatarUrl = pulseProfile?.theme?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=Fallback";
  const salaryProgressPercentage = Math.min(100, (Number(pendingSalary) / monthlySalaryTarget) * 100);

  return (
    <div className="flex h-screen bg-[#050505] text-zinc-300 font-sans selection:bg-indigo-500/30 overflow-hidden relative">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none z-0"></div>

      {activeJob && (
        <ActiveJobModal job={activeJob} onClose={() => setActiveJob(null)} onComplete={handleJobComplete} />
      )}

      {/* --- Sidebar --- */}
      <aside className="w-64 bg-[#0a0a0c]/80 backdrop-blur-xl border-r border-white/5 flex flex-col z-20 shrink-0">
        <div className="p-6 border-b border-white/5 flex items-center gap-3">
          <PulseLogo className="w-7 h-7 text-white" />
          <span className="font-black text-xl tracking-tighter text-white">Pulse<span className="text-zinc-600">Network</span></span>
        </div>
        
        <div className="flex-1 px-4 py-6 space-y-8 overflow-y-auto custom-scrollbar">
          <div>
            <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest ml-2 mb-3">Central Hub</p>
            <div className="space-y-1">
              <button onClick={() => setActiveTab('overview')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors ${activeTab === 'overview' ? 'bg-gradient-to-r from-indigo-500/10 to-transparent text-indigo-400 border-l-2 border-indigo-500 shadow-[inset_0_0_20px_rgba(99,102,241,0.05)]' : 'text-zinc-400 hover:bg-white/5 hover:text-white font-medium'}`}>
                <Activity className="w-4 h-4" /> Overview
              </button>
              <button onClick={() => setActiveTab('banking')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors ${activeTab === 'banking' ? 'bg-gradient-to-r from-emerald-500/10 to-transparent text-emerald-400 border-l-2 border-emerald-500 shadow-[inset_0_0_20px_rgba(16,185,129,0.05)]' : 'text-zinc-400 hover:bg-white/5 hover:text-white font-medium'}`}>
                <Landmark className="w-4 h-4" /> Banking
              </button>
              <button onClick={() => setActiveTab('real_estate')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors ${activeTab === 'real_estate' ? 'bg-gradient-to-r from-cyan-500/10 to-transparent text-cyan-400 border-l-2 border-cyan-500 shadow-[inset_0_0_20px_rgba(6,182,212,0.05)]' : 'text-zinc-400 hover:bg-white/5 hover:text-white font-medium'}`}>
                <Globe className="w-4 h-4" /> Real Estate
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-3 text-zinc-400 hover:bg-white/5 hover:text-white rounded-xl transition-colors font-medium group">
                <Zap className="w-4 h-4 group-hover:text-yellow-400 transition-colors" /> {playerPath === 'hustler' ? 'The Hustle' : 'Corporate Job'} 
              </button>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-white/5">
          <button onClick={() => { window.location.href = window.location.hostname.includes('localhost') ? 'http://localhost:3000/dashboard' : 'https://pulsegg.in/dashboard'; }} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-colors text-sm font-bold border border-white/10">
            <LogOut className="w-4 h-4" /> Return to Pulse
          </button>
        </div>
      </aside>

      {/* --- Main Content Area --- */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto relative z-10">
        
        <header className="p-6 md:px-8 flex justify-between items-center sticky top-0 z-30 bg-[#050505]/80 backdrop-blur-md border-b border-white/5">
          <div className="flex items-center gap-4">
            
            {/* CLICKABLE LOCATION PILL */}
            <div className="flex flex-col cursor-pointer group" onClick={() => setActiveTab('real_estate')}>
               <span className="text-[9px] font-bold tracking-widest text-zinc-500 uppercase ml-1 mb-1 group-hover:text-cyan-400 transition-colors">Current Location</span>
               <div className="flex items-center gap-2 bg-[#121214] border border-white/10 rounded-full pl-1 pr-4 py-1 shadow-md group-hover:bg-white/5 transition-colors">
                 <div className="w-8 h-8 rounded-full bg-cyan-900/30 border border-cyan-500/30 flex items-center justify-center group-hover:scale-105 transition-transform"><MapPin className="w-4 h-4 text-cyan-400" /></div>
                 <span className="text-sm font-bold text-white tracking-wide">
                   {locStats.name} 
                   <span className={`font-mono text-[10px] uppercase ml-1 px-1.5 py-0.5 rounded ${locStats.tax === 0 ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'}`}>
                     {(locStats.tax * 100).toFixed(0)}% Tax
                   </span>
                 </span>
               </div>
            </div>

            <div className="flex flex-col hidden md:flex">
               <span className="text-[9px] font-bold tracking-widest text-zinc-500 uppercase ml-1 mb-1">Energy Bar</span>
               <div className="flex items-center gap-3 bg-[#121214] border border-white/10 rounded-full pl-1 pr-4 py-1 shadow-md">
                 <div className="w-8 h-8 rounded-full bg-yellow-900/30 border border-yellow-500/30 flex items-center justify-center"><Zap className="w-4 h-4 text-yellow-400 fill-yellow-400/20" /></div>
                 <div className="flex flex-col justify-center">
                   <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden mb-1"><div className="h-full bg-gradient-to-r from-orange-500 to-yellow-400 rounded-full transition-all duration-300" style={{ width: `${energy}%` }}></div></div>
                   <span className="text-[10px] font-mono text-zinc-400 leading-none">{energy}/100</span>
                 </div>
               </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             {/* GOD MODE BUTTON FOR SOUR */}
             {displayName.toLowerCase() === 'sour' && (
               <button onClick={handleDevBypass} className="hidden md:flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-500 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-red-500/20 transition shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                 <Zap className="w-3 h-3" /> God Mode
               </button>
             )}
             <div className="flex items-center gap-3 bg-[#121214] border border-white/10 rounded-full pl-4 pr-1 py-1 shadow-md cursor-pointer hover:bg-white/5 transition-colors">
               <div className="flex flex-col items-end">
                 <span className="text-[9px] font-bold tracking-widest text-zinc-500 uppercase">Quick-Link</span>
                 <span className="text-sm font-bold text-white tracking-wide">{displayName}</span>
               </div>
               <img src={avatarUrl} alt="Avatar" className="w-10 h-10 rounded-full border-2 border-zinc-800 bg-zinc-900 object-cover" />
               <ChevronDown className="w-4 h-4 text-zinc-500 mr-2" />
             </div>
          </div>
        </header>

        <div className="p-6 md:p-8 pt-2">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-in fade-in duration-500">
              
              <OverviewTab netWorth={totalNetWorth} balance={balance} savingsBalance={savingsBalance} loanAccountBalance={loanAccountBalance} assetValue={assetValue} loanBalance={loanBalance} fico={fico} playerPath={playerPath} netWorthHistory={netWorthHistory} />

              {playerPath === 'hustler' ? (
                 <HustlerPath balance={balance} energy={energy} setBalance={setBalance} setEnergy={setEnergy} setActiveJob={setActiveJob} saveGameState={saveGameState} handleSwitchPathClick={handleSwitchPathClick} />
              ) : (
                 <CorporatePath corporateLevel={corporateLevel} energy={energy} currentRole={currentRole} displaySalary={displaySalaryRef.current} pendingSalary={pendingSalary} monthlySalaryTarget={monthlySalaryTarget} salaryProgressPercentage={salaryProgressPercentage} setEnergy={setEnergy} setActiveJob={setActiveJob} saveGameState={saveGameState} handleClaimSalary={handleClaimSalary} handleSwitchPathClick={handleSwitchPathClick} />
              )}

              <DailyUpkeep pendingSalary={pendingSalary} playerPath={playerPath} currentLocation={currentLocation} ownedProperties={ownedProperties} />

            </div>
          )}

          {activeTab === 'banking' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <BankingTab 
                balance={balance} 
                savingsBalance={savingsBalance} 
                loanBalance={loanBalance}
                loanAccountBalance={loanAccountBalance}
                fico={fico}
                selectedBank={selectedBank}
                accountNumber={accountNumber}
                transferAmount={transferAmount} 
                setTransferAmount={setTransferAmount} 
                handleBankSelect={handleBankSelect} 
                handleTransfer={handleTransfer} 
                handleTakeLoan={handleTakeLoan}
                handleRepayLoan={handleRepayLoan}
              />
            </div>
          )}

          {activeTab === 'real_estate' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <RealEstateTab 
                currentLocation={currentLocation} 
                ownedProperties={ownedProperties} 
                handleRelocate={handleRelocate} 
                handleBuyProperty={handleBuyProperty} 
                handleSellProperty={handleSellProperty}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}