"use client";

import React, { useState, useEffect } from 'react';
import { Building2, Zap, CreditCard, Briefcase, ArrowUpRight, Truck, Activity, Hammer, Dumbbell, Car, Coffee, Server, CheckCircle2, Clock, Lock } from 'lucide-react';
import { NetWorthChart, FicoRadialChart } from './SharedUI';
import { LOCATIONS, REAL_ESTATE } from '@/lib/network-data';

export default function OverviewTab({ 
  netWorth, balance, savingsBalance, loanAccountBalance, assetValue, loanBalance, fico, 
  playerPath, netWorthHistory, currentLocName, energy, ownedVehicles, setBalance, 
  setEnergy, setActiveJob, saveGameState, handleSwitchPathClick, corporateLevel, 
  currentRole, displaySalary, pendingSalary, monthlySalaryTarget, salaryProgressPercentage, 
  handleClaimSalary, currentLocation, ownedProperties, startupData, setStartupData, locMultiplier,
  showAlert, showConfirm, showPrompt
}: any) {

  const HustlerPath = () => {
    const hasCar = ownedVehicles && ownedVehicles.length > 0;
    const handleStartJob = async (job: any) => {
        if (energy < job.energyCost) return await showAlert("Energy Depleted", `Not enough energy! You need ${job.energyCost}⚡ to do this job.`);
        const newEnergy = Number(energy) - job.energyCost;
        setEnergy(newEnergy);
        saveGameState({ energy: newEnergy });
        setActiveJob({ ...job, isPromotion: false });
    };

    return (
      <div className="lg:col-span-3 bg-[#121214] border border-emerald-500/20 rounded-[24px] p-6 shadow-[0_0_30px_rgba(16,185,129,0.05)] flex flex-col h-full">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Active Income</h3>
            <p className="text-lg font-black text-white">The Gig Economy</p>
          </div>
          <button onClick={handleSwitchPathClick} className="text-[10px] uppercase tracking-widest bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg font-bold transition-colors">Switch Path</button>
        </div>
        
        <div className="flex flex-col md:flex-row gap-6">
           <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
             <button onClick={() => handleStartJob({ title: "Deliver Food", basePay: 15, clicksRequired: 30, timeLimit: 10, energyCost: 15 })} className="flex items-center gap-3 bg-black/40 hover:bg-emerald-500/10 border border-white/5 hover:border-emerald-500/30 p-4 rounded-xl transition-all group text-left">
               <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 group-hover:scale-110 transition-transform"><Truck className="w-5 h-5 text-emerald-400" /></div>
               <div><h4 className="font-bold text-sm text-white">Deliver Food</h4><p className="text-[10px] font-mono text-zinc-500">Pays <span className="text-emerald-400">$15</span> • Costs <span className="text-yellow-400">15⚡</span></p></div>
             </button>
             <button onClick={() => handleStartJob({ title: "Professional Cleaner", basePay: 20, clicksRequired: 35, timeLimit: 12, energyCost: 18 })} className="flex items-center gap-3 bg-black/40 hover:bg-emerald-500/10 border border-white/5 hover:border-emerald-500/30 p-4 rounded-xl transition-all group text-left">
               <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 group-hover:scale-110 transition-transform"><Activity className="w-5 h-5 text-emerald-400" /></div>
               <div><h4 className="font-bold text-sm text-white">Pro Cleaner</h4><p className="text-[10px] font-mono text-zinc-500">Pays <span className="text-emerald-400">$20</span> • Costs <span className="text-yellow-400">18⚡</span></p></div>
             </button>
             <button onClick={() => handleStartJob({ title: "Handyman Repairs", basePay: 50, clicksRequired: 55, timeLimit: 15, energyCost: 35 })} className="flex items-center gap-3 bg-black/40 hover:bg-emerald-500/10 border border-white/5 hover:border-emerald-500/30 p-4 rounded-xl transition-all group text-left">
               <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 group-hover:scale-110 transition-transform"><Hammer className="w-5 h-5 text-emerald-400" /></div>
               <div><h4 className="font-bold text-sm text-white">Handyman</h4><p className="text-[10px] font-mono text-zinc-500">Pays <span className="text-emerald-400">$50</span> • Costs <span className="text-yellow-400">35⚡</span></p></div>
             </button>
             <button onClick={() => handleStartJob({ title: "Personal Trainer", basePay: 80, clicksRequired: 70, timeLimit: 15, energyCost: 50 })} className="flex items-center gap-3 bg-black/40 hover:bg-emerald-500/10 border border-white/5 hover:border-emerald-500/30 p-4 rounded-xl transition-all group text-left">
               <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 group-hover:scale-110 transition-transform"><Dumbbell className="w-5 h-5 text-emerald-400" /></div>
               <div><h4 className="font-bold text-sm text-white">Personal Trainer</h4><p className="text-[10px] font-mono text-zinc-500">Pays <span className="text-emerald-400">$80</span> • Costs <span className="text-yellow-400">50⚡</span></p></div>
             </button>
             <button 
               onClick={async () => hasCar ? handleStartJob({ title: "Ride-Sharing", basePay: 120, clicksRequired: 80, timeLimit: 20, energyCost: 60 }) : await showAlert("Access Denied", "You need to buy a car in the Lifestyle tab first!")} 
               className={`flex items-center gap-3 bg-black/40 border border-white/5 p-4 rounded-xl transition-all group text-left ${hasCar ? 'hover:bg-emerald-500/10 hover:border-emerald-500/30' : 'opacity-50 grayscale cursor-not-allowed'}`}
             >
               <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 group-hover:scale-110 transition-transform"><Car className="w-5 h-5 text-emerald-400" /></div>
               <div><h4 className="font-bold text-sm text-white flex items-center gap-2">Ride-Sharing {!hasCar && <Lock className="w-3 h-3 text-red-400"/>}</h4><p className="text-[10px] font-mono text-zinc-500">Pays <span className="text-emerald-400">$120</span> • Costs <span className="text-yellow-400">60⚡</span></p></div>
             </button>
           </div>
           <div className="w-full md:w-48 shrink-0 flex flex-col gap-3">
              <div className="bg-black/40 border border-white/5 rounded-xl p-4 text-center">
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1">Energy</p>
                <p className="text-3xl font-black text-yellow-400 font-mono">{energy}⚡</p>
              </div>
              <button 
                 onClick={async () => {
                     if (balance < 5) return await showAlert("Insufficient Funds", "You don't have enough money for coffee!");
                     const newBal = Number(balance) - 5;
                     const newEnergy = Math.min(100, Number(energy) + 25);
                     setBalance(newBal); setEnergy(newEnergy); saveGameState({ bank_balance: newBal, energy: newEnergy });
                 }} 
                 className="flex items-center justify-center gap-3 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 p-3 rounded-xl transition-all group"
              >
                 <Coffee className="w-5 h-5 text-yellow-400 group-hover:scale-110 transition-transform" />
                 <div className="text-left"><p className="font-bold text-sm text-white">Buy Coffee</p><p className="text-[10px] font-mono text-zinc-400">-$5 | <span className="text-yellow-400">+25⚡</span></p></div>
              </button>
           </div>
        </div>
      </div>
    );
  };

  const CorporatePath = () => (
    <div className="lg:col-span-3 bg-[#121214] border border-indigo-500/20 rounded-[24px] p-6 shadow-[0_0_30px_rgba(99,102,241,0.05)] flex flex-col justify-between h-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Passive Income</h3>
          <p className="text-lg font-black text-white">Corporate Ladder</p>
        </div>
        <button onClick={handleSwitchPathClick} className="text-[10px] uppercase tracking-widest bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg font-bold transition-colors">Switch Path</button>
      </div>
      <div className="flex flex-col gap-4 bg-black/40 border border-white/5 rounded-xl p-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shrink-0"><Server className="w-6 h-6 text-indigo-400" /></div>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-base text-white leading-tight truncate">{currentRole.title}</h4>
            <p className="text-xs font-mono text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Salary: ${currentRole.payPerMinute.toFixed(2)} / min</p>
          </div>
          <button 
            onClick={async () => {
                if (energy < 50) return await showAlert("Energy Depleted", "You need 50 energy to ask the boss for a raise!");
                const newEnergy = Number(energy) - 50;
                setEnergy(newEnergy);
                saveGameState({ energy: newEnergy });
                setActiveJob({ title: "Boss Task (Hard)", basePay: 0, clicksRequired: 80 + (corporateLevel * 10), timeLimit: 10, isPromotion: true });
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
                <p className="text-sm font-mono font-bold text-indigo-400">${Number(displaySalary).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-zinc-600 text-xs">/ ${monthlySalaryTarget.toLocaleString('en-US')}</span></p>
              </div>
              <button 
                onClick={handleClaimSalary} disabled={Number(displaySalary) < monthlySalaryTarget}
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

  const FounderPath = () => {
    const { workload = 50, payroll = 50, morale = 100, is_strike = false, level = 1 } = startupData;
    
    const baseOpCost = 100 * locMultiplier * level;
    const grossRev = is_strike ? 0 : workload * 15 * locMultiplier * level;
    const totalCost = is_strike 
        ? (payroll * 20 * locMultiplier * level) + baseOpCost 
        : (payroll * 10 * locMultiplier * level) + baseOpCost; 
    
    const netProfit = grossRev - totalCost;
    
    let moraleTrend = (payroll - workload) * 0.5;
    if (workload > 50) {
        moraleTrend -= (workload - 50) * 1.0; 
    }
    
    const handleSlider = (field: string, val: number) => {
      const newData = { ...startupData, [field]: val };
      setStartupData(newData);
      saveGameState({ startup_data: newData });
    };

    return (
      <div className="lg:col-span-3 bg-[#121214] border border-orange-500/20 rounded-[24px] p-6 shadow-[0_0_30px_rgba(249,115,22,0.05)] flex flex-col h-full">
         <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-[10px] font-bold text-orange-500 uppercase tracking-widest">Company Dashboard</h3>
            <p className="text-lg font-black text-white flex items-center gap-2">Startup Tycoon {is_strike && <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded uppercase animate-pulse">ON STRIKE!</span>}</p>
          </div>
          <button onClick={handleSwitchPathClick} className="text-[10px] uppercase tracking-widest bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg font-bold transition-colors">Switch Path</button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="space-y-6 bg-black/40 p-5 rounded-2xl border border-white/5">
              <div>
                 <div className="flex justify-between mb-2"><span className="text-xs font-bold text-zinc-400">Employee Workload</span><span className="text-xs font-mono font-bold text-orange-400">{workload}%</span></div>
                 <input type="range" min="10" max="100" value={workload} onChange={(e) => handleSlider('workload', parseInt(e.target.value))} className="w-full accent-orange-500" />
              </div>
              <div>
                 <div className="flex justify-between mb-2"><span className="text-xs font-bold text-zinc-400">Payroll Budget</span><span className="text-xs font-mono font-bold text-emerald-400">{payroll}%</span></div>
                 <input type="range" min="10" max="100" value={payroll} onChange={(e) => handleSlider('payroll', parseInt(e.target.value))} className="w-full accent-emerald-500" />
              </div>

              <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center">
                 <div>
                    <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mb-1">Business Scale</p>
                    <p className="text-xl font-black text-white font-mono leading-none">Lv. {level}</p>
                 </div>
                 <button 
                    onClick={async () => {
                       if (energy < 60) return await showAlert("Energy Depleted", "You need 60 energy to run an expansion campaign!");
                       const newEnergy = Number(energy) - 60;
                       setEnergy(newEnergy);
                       saveGameState({ energy: newEnergy });
                       const clicksReq = 100 + (level * 20); 
                       setActiveJob({ title: "Expand Business (Hard)", basePay: 0, clicksRequired: clicksReq, timeLimit: 12, isExpansion: true });
                    }}
                    className="px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-xl transition shadow-[0_0_15px_rgba(234,88,12,0.3)] shrink-0"
                 >
                    Expand (60⚡)
                 </button>
              </div>
           </div>

           <div className="space-y-4 flex flex-col justify-between">
              <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
                 <div className="flex justify-between items-center mb-2">
                   <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Company Morale</span>
                   <span className={`text-xs font-bold font-mono ${morale > 50 ? 'text-emerald-400' : 'text-red-400'}`}>{Math.floor(morale)} / 100</span>
                 </div>
                 <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                   <div className={`h-full transition-all duration-500 ${morale > 50 ? 'bg-emerald-500' : 'bg-red-500'}`} style={{ width: `${morale}%` }}></div>
                 </div>
                 <p className="text-[9px] mt-2 text-zinc-500 font-bold">
                    Trend: {moraleTrend > 0 ? <span className="text-emerald-400">↗ Improving</span> : moraleTrend < 0 ? <span className="text-red-400">↘ Declining</span> : '→ Stable'}
                 </p>
              </div>
              <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                 <div className="bg-black/40 p-3 rounded-xl border border-white/5"><p className="text-[9px] text-zinc-500 uppercase font-sans font-bold">Est. Gross/Min</p><p className="text-emerald-400 font-bold">${grossRev.toFixed(2)}</p></div>
                 <div className="bg-black/40 p-3 rounded-xl border border-white/5"><p className="text-[9px] text-zinc-500 uppercase font-sans font-bold">Est. Cost/Min</p><p className="text-red-400 font-bold">-${totalCost.toFixed(2)}</p></div>
                 <div className="col-span-2 bg-black/40 p-3 rounded-xl border border-white/5 flex justify-between items-center"><p className="text-[9px] text-zinc-500 uppercase font-sans font-bold">Net Profit/Min</p><p className={`font-bold ${netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{netProfit >= 0 ? '+' : '-'}${Math.abs(netProfit).toFixed(2)}</p></div>
              </div>

              <div className="mt-2 pt-4 border-t border-white/5 flex justify-between items-center">
                 <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Company Treasury</p>
                    <p className={`text-2xl font-mono font-black ${pendingSalary >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                       {pendingSalary >= 0 ? '+' : '-'}${Math.abs(Number(pendingSalary)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                 </div>
                 <button 
                    onClick={handleClaimSalary}
                    className={`px-5 py-3 text-white text-xs font-bold rounded-xl transition shadow-[0_0_15px_rgba(0,0,0,0.2)] ${pendingSalary >= 0 ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-red-600 hover:bg-red-500'}`}
                 >
                    {pendingSalary >= 0 ? 'Claim Dividend' : 'Pay Debt'}
                 </button>
              </div>
           </div>
        </div>
      </div>
    );
  };

  const DailyUpkeep = () => {
    const [timeLeft, setTimeLeft] = useState("23:59:59");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
      setMounted(true);
      const timer = setInterval(() => {
        const now = new Date();
        const tomorrow = new Date(now); tomorrow.setHours(24, 0, 0, 0);
        const diff = tomorrow.getTime() - now.getTime();
        const h = Math.floor((diff / (1000 * 60 * 60)) % 24).toString().padStart(2, '0');
        const m = Math.floor((diff / 1000 / 60) % 60).toString().padStart(2, '0');
        const s = Math.floor((diff / 1000) % 60).toString().padStart(2, '0');
        setTimeLeft(`${h}:${m}:${s}`);
      }, 1000);
      return () => clearInterval(timer);
    }, []);

    const locStats = LOCATIONS[currentLocation] || LOCATIONS.bali;
    const ownsHome = ownedProperties.some((id: string) => REAL_ESTATE[currentLocation]?.find((p: any) => p.id === id));
    const rent = ownsHome ? 0 : locStats.rent;
    const estTax = playerPath === 'corporate' || playerPath === 'founder' ? (Number(pendingSalary) * locStats.tax) : 0;
    const total = rent + locStats.living + estTax;

    return (
      <div className="lg:col-span-1 bg-[#121214] border border-white/5 rounded-[24px] p-6 shadow-2xl flex flex-col justify-between hover:border-white/10 transition-colors h-full">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">System</h3>
            <p className="text-sm font-bold text-white">Daily Upkeep (Taxes)</p>
          </div>
          <Clock className="w-4 h-4 text-zinc-500" />
        </div>
        <div className="text-center bg-black/40 border border-white/5 rounded-xl p-4 mb-4">
          <span className="text-2xl font-black font-mono tracking-tighter text-white">{mounted ? timeLeft : "23:59:59"}</span>
          <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-1">To Midnight Auto-Cut</p>
        </div>
        <div className="space-y-2 text-xs font-mono">
           <div className="flex justify-between border-b border-white/5 pb-1"><span className="text-zinc-400">Rent ({locStats.name})</span>{ownsHome ? <span className="text-emerald-400 font-bold">Waived</span> : <span className="text-red-400">-${rent.toFixed(2)}</span>}</div>
           <div className="flex justify-between border-b border-white/5 pb-1"><span className="text-zinc-400">Living Costs</span><span className="text-red-400">-${locStats.living.toFixed(2)}</span></div>
           <div className="flex justify-between border-b border-white/5 pb-1"><span className="text-zinc-400">Est. Tax ({(locStats.tax * 100).toFixed(0)}%)</span><span className={estTax > 0 ? "text-red-400" : "text-zinc-500"}>-${estTax.toFixed(2)}</span></div>
           <div className="flex justify-between pt-1"><span className="font-bold text-white">Total Est. Cut</span><span className="font-bold text-red-400">-${total.toFixed(2)}</span></div>
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-in fade-in duration-500">
      {/* ROW 1 */}
      <div className="lg:col-span-3 bg-[#121214] border border-white/5 rounded-[24px] p-6 shadow-2xl relative overflow-hidden flex flex-col justify-between group hover:border-white/10 transition-colors">
        <div className="absolute top-0 right-0 p-6 opacity-5"><Building2 className="w-32 h-32" /></div>
        <div className="relative z-10 flex justify-between items-start">
          <div>
            <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Financial Overview</h3>
            <p className="text-xs font-medium text-zinc-400 mb-2">Total Combined Net Worth</p>
            <h2 className="text-5xl font-black font-mono tracking-tighter text-white drop-shadow-md transition-all duration-300">
              ${Number(netWorth).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h2>
          </div>
        </div>
        
        <div className="relative z-10 mt-6 flex flex-col gap-3">
          {/* UPDATED: Splits Cash and Savings Vault visually */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-emerald-400 font-black text-xl md:text-2xl bg-emerald-500/10 px-4 py-2 rounded-xl border border-emerald-500/20 drop-shadow-md">
              Cash: ${Number(balance).toLocaleString('en-US')}
            </span>
            {Number(savingsBalance) > 0 && (
               <span className="text-emerald-500 font-black text-lg md:text-xl bg-emerald-900/30 px-4 py-2 rounded-xl border border-emerald-500/20 drop-shadow-md flex items-center gap-2">
                  <Lock className="w-4 h-4" /> Vault: ${Number(savingsBalance).toLocaleString('en-US')}
               </span>
            )}
          </div>
          
          <div className="flex items-center gap-4 text-xs md:text-sm font-mono font-bold pl-2 opacity-80 flex-wrap">
            <span className="text-indigo-400 flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5"/> Assets: ${Number(assetValue).toLocaleString('en-US')}</span>
            {loanAccountBalance > 0 && <span className="text-orange-400 flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5"/> Loan Acc: ${Number(loanAccountBalance).toLocaleString('en-US')}</span>}
            {loanBalance > 0 && <span className="text-red-400 flex items-center gap-1.5"><ArrowUpRight className="w-3.5 h-3.5"/> Debt: -${Number(loanBalance).toLocaleString('en-US')}</span>}
          </div>
        </div>
        <NetWorthChart data={netWorthHistory} />
      </div>

      <div className="lg:col-span-1 bg-[#121214] border border-white/5 rounded-[24px] p-6 shadow-2xl relative overflow-hidden flex flex-col justify-between group hover:border-white/10 transition-colors">
        <h3 className="absolute top-6 left-6 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Profile Card</h3>
        <div className="w-full aspect-[1.586/1] mt-6 rounded-2xl p-5 flex flex-col justify-between text-white relative shadow-[0_20px_40px_rgba(0,0,0,0.4)] transition-transform duration-500 ease-out group-hover:rotate-x-[5deg] group-hover:rotate-y-[-10deg] group-hover:scale-105 bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#111827] border border-white/10 backdrop-blur-md overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 transform -translate-x-full group-hover:translate-x-full"></div>
            <div className="flex justify-between items-start relative z-10">
              <div className="flex items-center gap-2 opacity-80"><Zap className="w-4 h-4" /><span className="font-bold text-sm tracking-tight">Pulse</span></div>
              <CreditCard className="w-5 h-5 opacity-50" />
            </div>
            <div className="relative z-10">
              <p className="text-[8px] uppercase tracking-widest text-indigo-200 mb-1 opacity-80">Class</p>
              <p className="font-mono text-lg font-bold tracking-widest uppercase">{playerPath || "Unknown"}</p>
            </div>
        </div>
      </div>

      {/* ROW 2 */}
      <div className="lg:col-span-1 bg-[#121214] border border-white/5 rounded-[24px] p-6 shadow-2xl flex flex-col justify-between group hover:border-white/10 transition-colors h-full">
        <div>
          <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Credit System</h3>
          <p className="text-xs font-medium text-zinc-400">FICO Score Tracking</p>
        </div>
        <FicoRadialChart score={fico} />
      </div>

      {playerPath === 'hustler' && <HustlerPath />}
      {playerPath === 'corporate' && <CorporatePath />}
      {playerPath === 'founder' && <FounderPath />}
      {!playerPath && (
         <div className="lg:col-span-3 bg-[#121214] border border-white/5 rounded-[24px] p-6 shadow-2xl flex flex-col items-center justify-center text-center h-full">
            <Briefcase className="w-8 h-8 text-zinc-600 mb-2" />
            <p className="text-sm font-bold text-white mb-2">No Path Selected</p>
            <button onClick={handleSwitchPathClick} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition">Select Career Path</button>
         </div>
      )}

      {/* ROW 3 */}
      <DailyUpkeep />
      
    </div>
  );
}