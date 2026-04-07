"use client";

import React, { useState } from 'react';
// FIX: Added the missing Briefcase icon here!
import { Landmark, Building2, PiggyBank, Shield, CreditCard, ArrowRightLeft, Briefcase } from 'lucide-react';

export default function BankingTab({ 
  balance, savingsBalance, loanBalance, loanAccountBalance, fico, selectedBank, accountNumber,
  transferAmount, setTransferAmount, handleBankSelect, handleTransfer, handleTakeLoan, handleRepayLoan 
}: any) {
  
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

  const maxLoan = selectedBank === 'capital_none' ? fico * 200 : fico * 50;
  const availableCredit = Math.max(0, maxLoan - loanBalance);

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="bg-[#121214] border border-white/10 rounded-3xl p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5"><Landmark className="w-48 h-48" /></div>
          
          <div className="relative z-10 w-full flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Active Institution</p>
              <h2 className="text-3xl font-black text-white capitalize">{selectedBank.replace('_', ' ')}</h2>
            </div>
            <button onClick={() => handleBankSelect(null)} className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl transition border border-white/10 backdrop-blur-md">Switch Bank</button>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          <div className="bg-black/40 border border-white/5 rounded-3xl p-8 shadow-inner">
            <h3 className="text-lg font-black text-white mb-6 text-center">Transfer Funds</h3>
            <p className="text-xs text-zinc-500 text-center mb-4">Move money between Current and Savings. Loan funds cannot be transferred to prevent network abuse.</p>
            <div className="flex flex-col items-center gap-6">
                <div className="relative w-full max-w-xs">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-400 font-mono">$</div>
                  <input type="number" value={transferAmount} onChange={(e) => setTransferAmount(e.target.value)} className="w-full bg-[#121214] border border-white/10 rounded-2xl py-3.5 pl-8 pr-4 text-white font-mono text-sm focus:outline-none focus:border-indigo-500 transition-colors" placeholder="0.00" />
                </div>
                <div className="flex w-full gap-3">
                  <button onClick={() => handleTransfer('to_savings')} className="flex-1 bg-white/5 hover:bg-indigo-500/20 text-white font-bold py-3.5 rounded-xl border border-white/10 hover:border-indigo-500/30 transition-all text-xs flex items-center justify-center gap-2"><ArrowRightLeft className="w-4 h-4" /> To Savings</button>
                  <button onClick={() => handleTransfer('to_current')} className="flex-1 bg-white/5 hover:bg-emerald-500/20 text-white font-bold py-3.5 rounded-xl border border-white/10 hover:border-emerald-500/30 transition-all text-xs flex items-center justify-center gap-2"><ArrowRightLeft className="w-4 h-4" /> To Current</button>
                </div>
            </div>
          </div>

          <div className="bg-black/40 border border-white/5 rounded-3xl p-8 shadow-inner">
            <h3 className="text-lg font-black text-white mb-2 text-center">Credit Line & Loans</h3>
            <p className="text-[10px] text-zinc-500 text-center mb-6 uppercase tracking-widest font-bold">Available Credit: <span className="text-emerald-400">${availableCredit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></p>
            <div className="flex justify-between items-center mb-6 bg-white/5 p-4 rounded-2xl border border-white/10">
                <div>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1">Outstanding Balance</p>
                  <p className="text-xl font-black text-red-400 font-mono">${Number(loanBalance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
            </div>
            <div className="flex flex-col items-center gap-4">
                <div className="relative w-full max-w-xs">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-400 font-mono">$</div>
                  <input type="number" value={loanInput} onChange={(e) => setLoanInput(e.target.value)} className="w-full bg-[#121214] border border-white/10 rounded-2xl py-3.5 pl-8 pr-4 text-white font-mono text-sm focus:outline-none focus:border-indigo-500 transition-colors" placeholder="0.00" />
                </div>
                <div className="flex w-full gap-3">
                  <button onClick={() => { handleTakeLoan(loanInput); setLoanInput(''); }} className="flex-1 bg-white/5 hover:bg-orange-500/20 text-white font-bold py-3.5 rounded-xl border border-white/10 hover:border-orange-500/30 transition-all text-xs">Take Loan</button>
                  <button onClick={() => { handleRepayLoan(loanInput); setLoanInput(''); }} className="flex-1 bg-white/5 hover:bg-emerald-500/20 text-white font-bold py-3.5 rounded-xl border border-white/10 hover:border-emerald-500/30 transition-all text-xs">Repay</button>
                </div>
            </div>
          </div>
      </div>
    </div>
  );
}