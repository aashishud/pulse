"use client";

import React, { useState } from 'react';
import { Landmark, Shield, ArrowUpRight, ArrowDownRight, Wifi, Lock, Check } from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion';

const BANKS = [
  { 
     id: 'pulse_reserve', 
     name: 'Pulse Reserve', 
     gradient: 'from-zinc-800 via-zinc-900 to-[#0a0a0a]', 
     glow: 'bg-zinc-500/20', border: 'border-zinc-700/50', logo: 'text-zinc-100',
     perk: 'Standard Rates & High Stability', cardType: 'OmniCard'
  },
  { 
     id: 'capital_none', 
     name: 'Capital None', 
     gradient: 'from-red-900/80 via-red-950 to-[#0a0a0a]', 
     glow: 'bg-red-500/20', border: 'border-red-800/50', logo: 'text-red-400',
     perk: '2x Credit Limit Multiplier', cardType: 'Bisa'
  },
  { 
     id: 'robin_hoodlum', 
     name: 'RobinHoodlum', 
     gradient: 'from-emerald-800/80 via-emerald-950 to-[#0a0a0a]', 
     glow: 'bg-emerald-500/20', border: 'border-emerald-700/50', logo: 'text-emerald-500',
     perk: '0% Stock Trading Fees', cardType: 'Bisa'
  },
  { 
     id: 'swells_cargo', 
     name: 'Swells Cargo', 
     gradient: 'from-yellow-700/80 via-yellow-900 to-[#0a0a0a]', 
     glow: 'bg-yellow-500/20', border: 'border-yellow-600/50', logo: 'text-yellow-500',
     perk: '1.5x Savings Vault APY', cardType: 'Discoverer'
  },
  { 
     id: 'chased', 
     name: 'Chased Bank', 
     gradient: 'from-blue-800/80 via-blue-950 to-[#0a0a0a]', 
     glow: 'bg-blue-500/20', border: 'border-blue-700/50', logo: 'text-blue-400',
     perk: '5% Cashback on Lifestyle', cardType: 'Sapphire'
  },
  { 
     id: 'bank_of_avarice', 
     name: 'Bank of Avarice', 
     gradient: 'from-rose-900/80 via-rose-950 to-[#0a0a0a]', 
     glow: 'bg-rose-500/20', border: 'border-rose-800/50', logo: 'text-rose-400',
     perk: 'Offshore Security & Privacy', cardType: 'Americash'
  },
  { 
     id: 'pity_bank', 
     name: 'PityBank', 
     gradient: 'from-cyan-900/80 via-cyan-950 to-[#0a0a0a]', 
     glow: 'bg-cyan-500/20', border: 'border-cyan-800/50', logo: 'text-cyan-400',
     perk: 'Zero Transfer Fees', cardType: 'OmniCard'
  }
];

// --- Custom Parody Card Brands ---
const CardBrand = ({ type, size = 'lg' }: { type: string, size?: 'sm' | 'lg' }) => {
  const scale = size === 'sm' ? 'scale-75 origin-right' : 'scale-100';
  
  if (type === 'OmniCard') return (
    <div className={`flex ${scale} opacity-90 drop-shadow-md`}>
       <div className="w-6 h-6 rounded-full bg-red-500/90 mix-blend-screen shadow-lg"></div>
       <div className="w-6 h-6 rounded-full bg-orange-500/90 mix-blend-screen -ml-3 shadow-lg"></div>
    </div>
  );
  if (type === 'Bisa') return <div className={`text-blue-400 font-black italic tracking-widest drop-shadow-md ${size === 'sm' ? 'text-sm' : 'text-xl'} ${scale}`}>BISA</div>;
  if (type === 'Americash') return <div className={`bg-blue-500/20 border border-blue-400/50 text-blue-200 font-black uppercase px-2 py-0.5 rounded drop-shadow-md ${size === 'sm' ? 'text-[8px]' : 'text-xs'} ${scale}`}>Americash</div>;
  if (type === 'Discoverer') return <div className={`flex items-center text-orange-400 font-black uppercase tracking-wider drop-shadow-md ${size === 'sm' ? 'text-[9px]' : 'text-sm'} ${scale}`}>DISC<span className={`${size === 'sm' ? 'w-2 h-2' : 'w-3 h-3'} rounded-full bg-orange-500 mx-[1px] inline-block shadow-md`}></span>VERER</div>;
  if (type === 'Sapphire') return <div className={`text-blue-300 font-serif font-bold italic tracking-wider drop-shadow-md ${size === 'sm' ? 'text-xs' : 'text-lg'} ${scale}`}>Sapphire</div>;
  
  return null;
}

// --- NEW: Interactive 3D Spatial Card ---
const Interactive3DCard = ({ currentBank, balance, displayCardNumber, displayName }: any) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["15deg", "-15deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-15deg", "15deg"]);
  const glareX = useTransform(mouseXSpring, [-0.5, 0.5], ["100%", "-100%"]);
  const glareY = useTransform(mouseYSpring, [-0.5, 0.5], ["100%", "-100%"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    x.set(mouseX / width - 0.5);
    y.set(mouseY / height - 0.5);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <div 
      style={{ perspective: 1200 }} 
      className="w-full max-w-[420px] aspect-[1.586/1] mx-auto z-20 group cursor-pointer"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className={`relative w-full h-full rounded-[24px] p-6 md:p-8 text-white flex flex-col justify-between shadow-[0_30px_60px_rgba(0,0,0,0.6)] border border-white/20 bg-gradient-to-br ${currentBank?.gradient} overflow-hidden`}
      >
        {/* Dynamic Glare Effect */}
        <motion.div 
           style={{ x: glareX, y: glareY }}
           className="absolute inset-0 w-[200%] h-[200%] -top-[50%] -left-[50%] bg-gradient-to-tr from-white/0 via-white/20 to-white/0 pointer-events-none rounded-full blur-2xl z-10 transition-opacity opacity-0 group-hover:opacity-100"
        />

        {/* Static Background Elements (No 3D Pop) */}
        <div className={`absolute top-0 right-0 w-48 h-48 ${currentBank?.glow} blur-[60px] rounded-full opacity-80 z-0`}></div>
        <div className={`absolute bottom-0 left-0 w-32 h-32 ${currentBank?.glow} blur-[40px] rounded-full opacity-40 z-0`}></div>
        
        {/* Top Header - Popped out 30px */}
        <div style={{ transform: "translateZ(30px)" }} className="relative z-20 flex justify-between items-start">
           <svg className="w-10 h-10 md:w-12 md:h-12 opacity-90 drop-shadow-lg" viewBox="0 0 40 30" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="40" height="30" rx="4" fill="url(#paint0_linear)"/>
              <path d="M10 0V30M30 0V30M0 15H40M15 0V15M25 30V15" stroke="#B8860B" strokeWidth="0.5" strokeOpacity="0.5"/>
              <defs><linearGradient id="paint0_linear" x1="0" y1="0" x2="40" y2="30" gradientUnits="userSpaceOnUse"><stop stopColor="#F9D423"/><stop offset="1" stopColor="#B8860B"/></linearGradient></defs>
           </svg>
           <div className="flex flex-col items-end">
              <h4 className={`text-sm md:text-base font-black tracking-widest uppercase drop-shadow-md ${currentBank?.logo}`}>{currentBank?.name}</h4>
              <Wifi className="w-5 h-5 opacity-70 rotate-90 mt-1" />
           </div>
        </div>
        
        {/* Middle Balance - Popped out 50px (Max Depth) */}
        <div style={{ transform: "translateZ(50px)" }} className="relative z-20 my-4 drop-shadow-2xl">
           <p className="text-[10px] uppercase tracking-[0.2em] text-white/70 mb-1 font-bold">Available Balance</p>
           <h2 className="text-4xl md:text-5xl font-mono font-black tracking-tighter text-white">
              ${Number(balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
           </h2>
        </div>
        
        {/* Bottom Footer - Popped out 40px */}
        <div style={{ transform: "translateZ(40px)" }} className="relative z-20 flex justify-between items-end drop-shadow-lg">
           <div>
              <p className="font-mono text-sm md:text-base tracking-[0.15em] opacity-90 font-bold">{displayCardNumber}</p>
              <div className="flex gap-4 mt-2">
                 <p className="text-[9px] uppercase tracking-widest opacity-80 font-bold">{displayName || 'Pulse User'}</p>
                 <p className="text-[9px] uppercase tracking-widest opacity-80 font-mono font-bold">12/28</p>
              </div>
           </div>
           <CardBrand type={currentBank?.cardType || 'OmniCard'} />
        </div>
      </motion.div>
    </div>
  );
};


export default function BankingTab({ 
  balance, savingsBalance, loanBalance, loanAccountBalance, fico, 
  selectedBank, accountNumber, transferAmount, setTransferAmount, 
  handleBankSelect, handleTransfer, handleTakeLoan, handleRepayLoan,
  displayName, showPrompt, showConfirm, showAlert
}: any) {

  // Get active bank details
  const currentBank = BANKS.find(b => b.id === selectedBank);
  const displayCardNumber = accountNumber ? `•••• •••• •••• ${accountNumber.slice(-4)}` : '•••• •••• •••• ••••';

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in duration-500">
      <div className="mb-8 border-b border-white/5 pb-6">
         <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight flex items-center gap-3">
            <Landmark className="text-emerald-400 w-8 h-8"/> Central Banking
         </h2>
         <p className="text-zinc-400 text-sm mt-2">Manage your liquidity, secure assets, and leverage your credit.</p>
      </div>

      {!selectedBank ? (
         <div className="mb-12">
            <div className="text-center mb-8">
               <h3 className="text-xl font-bold text-white mb-2">Select a Financial Institution</h3>
               <p className="text-sm text-zinc-500">Choose a bank to open your primary checking account.</p>
               <div className="inline-block mt-3 bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[10px] font-bold px-3 py-1.5 rounded-lg uppercase tracking-widest">
                  ⚠️ Unbanked Cash Limit: $50,000
               </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto">
               {BANKS.map((bank) => (
                  <div 
                     key={bank.id} 
                     onClick={() => handleBankSelect(bank.id)}
                     className={`relative w-full aspect-[1.586/1] rounded-[24px] p-5 text-white flex flex-col justify-between cursor-pointer transition-all duration-500 overflow-hidden bg-gradient-to-br ${bank.gradient} border ${bank.border} hover:scale-105 hover:shadow-[0_0_40px_rgba(255,255,255,0.1)] group`}
                  >
                     <div className={`absolute top-0 right-0 w-32 h-32 ${bank.glow} blur-[50px] rounded-full group-hover:opacity-100 transition-opacity opacity-50`}></div>
                     
                     <div className="relative z-10 flex justify-between items-start">
                        <svg className="w-8 h-8 opacity-90 drop-shadow-md" viewBox="0 0 40 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                           <rect width="40" height="30" rx="4" fill="url(#paint0_linear)"/>
                           <path d="M10 0V30M30 0V30M0 15H40M15 0V15M25 30V15" stroke="#B8860B" strokeWidth="0.5" strokeOpacity="0.5"/>
                           <defs><linearGradient id="paint0_linear" x1="0" y1="0" x2="40" y2="30" gradientUnits="userSpaceOnUse"><stop stopColor="#F9D423"/><stop offset="1" stopColor="#B8860B"/></linearGradient></defs>
                        </svg>
                        <Wifi className="w-5 h-5 opacity-50 rotate-90" />
                     </div>
                     
                     <div className="relative z-10 text-center -mt-2">
                        <h4 className={`text-lg font-black tracking-widest truncate ${bank.logo}`}>{bank.name}</h4>
                        <p className="text-[8px] font-bold text-white/70 uppercase tracking-widest mt-1 bg-black/20 px-2 py-0.5 rounded inline-block border border-white/5">{bank.perk}</p>
                     </div>
                     
                     <div className="relative z-10 flex justify-between items-end opacity-60">
                        <div>
                           <p className="font-mono text-xs tracking-widest">•••• ••••</p>
                           <p className="text-[7px] uppercase tracking-widest mt-1">Pulse Network</p>
                        </div>
                        <CardBrand type={bank.cardType} size="sm" />
                     </div>
                  </div>
               ))}
            </div>
         </div>
      ) : (
         <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* LEFT COLUMN: 3D Physical Card UI */}
            <div className="lg:col-span-5 flex flex-col items-center md:items-start">
               <div className="w-full max-w-[420px] flex justify-between items-center mb-4">
                  <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Primary Account</h3>
                  <button onClick={async () => {
                     const confirm = await showConfirm("Switch Bank", "Are you sure you want to switch to a different financial institution?");
                     if(confirm) handleBankSelect(null);
                  }} className="text-[9px] font-bold text-zinc-500 hover:text-white uppercase tracking-widest bg-white/5 hover:bg-white/10 px-2 py-1 rounded transition-colors">
                     Switch Bank
                  </button>
               </div>
               
               {/* 3D TILT CARD COMPONENT INJECTED HERE */}
               <Interactive3DCard 
                  currentBank={currentBank} 
                  balance={balance} 
                  displayCardNumber={displayCardNumber} 
                  displayName={displayName} 
               />

               <div className="w-full max-w-[420px] mt-6 bg-[#121214] border border-white/5 rounded-[24px] p-5 flex items-center justify-between shadow-inner">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10"><Shield className="w-4 h-4 text-emerald-400" /></div>
                     <div>
                        <p className="text-sm font-bold text-white mb-0.5">Active Bank Perks</p>
                        <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">{currentBank?.perk}</p>
                     </div>
                  </div>
               </div>
            </div>

            {/* RIGHT COLUMN: Bank Operations */}
            <div className="lg:col-span-7 flex flex-col gap-6">
               
               {/* SAVINGS VAULT & TRANSFERS */}
               <div className="bg-[#121214] border border-white/5 rounded-[24px] p-6 md:p-8 shadow-xl relative overflow-hidden group hover:border-white/10 transition-colors">
                  {/* Floating ambient animation for the background lock */}
                  <motion.div 
                     animate={{ y: [0, -15, 0], rotate: [0, 5, 0] }} 
                     transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} 
                     className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none"
                  >
                     <Lock className="w-32 h-32" />
                  </motion.div>

                  <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 border-b border-white/5 pb-6">
                     <div>
                        <h3 className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-1 flex items-center gap-2"><Lock className="w-3 h-3"/> High-Yield Savings</h3>
                        <p className="text-3xl font-black font-mono text-white">${Number(savingsBalance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                     </div>
                     <div className="w-full md:w-auto">
                        <div className="bg-black/40 border border-white/10 rounded-xl flex overflow-hidden p-1 shadow-inner focus-within:border-emerald-500/50 transition-colors">
                           <span className="text-zinc-500 font-mono font-bold pl-4 py-3">$</span>
                           <input 
                              type="number" 
                              value={transferAmount}
                              onChange={(e) => setTransferAmount(e.target.value)}
                              placeholder="0.00" 
                              className="bg-transparent border-none text-white font-mono font-bold focus:ring-0 w-full md:w-32 px-2 py-3 outline-none placeholder:text-zinc-700" 
                           />
                        </div>
                     </div>
                  </div>
                  
                  <div className="relative z-10 flex flex-col sm:flex-row gap-3">
                     <button onClick={() => handleTransfer('to_savings')} className="flex-1 flex items-center justify-center gap-2 py-4 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors shadow-[0_0_15px_rgba(16,185,129,0.1)] hover:shadow-[0_0_25px_rgba(16,185,129,0.2)]">
                        <ArrowUpRight className="w-4 h-4" /> Deposit to Vault
                     </button>
                     <button onClick={() => handleTransfer('to_current')} className="flex-1 flex items-center justify-center gap-2 py-4 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors">
                        <ArrowDownRight className="w-4 h-4" /> Withdraw Cash
                     </button>
                  </div>
               </div>

               {/* CREDIT & LOANS */}
               <div className="bg-[#121214] border border-white/5 rounded-[24px] p-6 md:p-8 shadow-xl relative overflow-hidden group hover:border-white/10 transition-colors">
                  {/* Floating ambient animation for the background bank */}
                  <motion.div 
                     animate={{ y: [0, -10, 0] }} 
                     transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }} 
                     className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none"
                  >
                     <Landmark className="w-32 h-32" />
                  </motion.div>

                  <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6 mb-6">
                     <div>
                        <h3 className="text-[10px] font-bold text-orange-500 uppercase tracking-widest mb-1">Credit Department</h3>
                        <p className="text-sm font-medium text-zinc-400 mb-2">Active Loan Balance</p>
                        <p className="text-3xl font-black font-mono text-red-400 drop-shadow-md">-${Number(loanBalance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                     </div>
                     <div className="text-left md:text-right bg-black/30 p-4 rounded-xl border border-white/5">
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Locked Loan Account</p>
                        <p className="text-lg font-mono font-bold text-orange-400">${Number(loanAccountBalance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        <p className="text-[9px] text-zinc-600 mt-1 max-w-[150px] leading-tight">Funds restricted for large asset purchases.</p>
                     </div>
                  </div>

                  <div className="relative z-10 flex flex-col sm:flex-row gap-3">
                     <button 
                        onClick={async () => {
                           const amtStr = await showPrompt("Apply for Loan", "Enter amount to borrow. This will be deposited to your locked Loan Account:", "50000");
                           if (amtStr) handleTakeLoan(amtStr);
                        }} 
                        className="flex-1 py-4 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors shadow-[0_0_15px_rgba(249,115,22,0.1)] hover:shadow-[0_0_25px_rgba(249,115,22,0.2)]"
                     >
                        Apply For Loan
                     </button>
                     <button 
                        onClick={async () => {
                           const amtStr = await showPrompt("Make Payment", "Enter amount to repay:", "10000");
                           if (amtStr) handleRepayLoan(amtStr);
                        }} 
                        disabled={loanBalance === 0} 
                        className="flex-1 py-4 bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed text-white border border-white/10 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors"
                     >
                        Make Payment
                     </button>
                  </div>
               </div>

            </div>
         </div>
      )}
    </div>
  );
}