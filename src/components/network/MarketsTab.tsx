"use client";

import React, { useState, useEffect } from 'react';
import { TrendingUp, Coins } from 'lucide-react';
import { CRYPTO_ASSETS } from '@/lib/network-data';

export default function MarketsTab({ balance, portfolio, setBalance, setPortfolio, saveGameState }: any) {
   const [prices, setPrices] = useState<Record<string, number>>({});
   const [prevPrices, setPrevPrices] = useState<Record<string, number>>({});

   // Live Internal Proxy Fetcher
   useEffect(() => {
      const fetchPrices = async () => {
         try {
            // Fetching from our own Next.js server to bypass blocks
            const res = await fetch(`/api/crypto`);
            if (!res.ok) throw new Error("API unreachable");
            
            const data = await res.json();
            if (!Array.isArray(data)) throw new Error("Invalid API format");
            
            setPrices(current => {
               setPrevPrices(current);
               const newPrices: any = { ...current };
               
               Object.entries(CRYPTO_ASSETS).forEach(([ticker, crypto]: [string, any]) => {
                  const item = data.find((d: any) => d.symbol === crypto.symbol);
                  
                  if (item && !isNaN(parseFloat(item.price))) {
                     newPrices[ticker] = parseFloat(item.price);
                  }
               });
               return newPrices;
            });
         } catch(e) {
            console.error("Live Crypto API Error:", e);
         }
      };
      
      fetchPrices();
      const interval = setInterval(fetchPrices, 3000);
      return () => clearInterval(interval);
   }, []);

   const handleTrade = (ticker: string, action: 'buy' | 'sell', sharesStr: string | null) => {
      if (!sharesStr) return;
      const shares = parseFloat(sharesStr);
      if (!prices[ticker] || isNaN(shares) || shares <= 0) return;
      
      const currentPrice = prices[ticker];
      const currentShares = portfolio[ticker]?.shares || 0;

      if (action === 'buy') {
         const cost = currentPrice * shares;
         if (balance < cost) return alert(`Insufficient liquid cash. You need $${cost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.`);
         
         const newBal = balance - cost;
         const newPortfolio = { ...portfolio, [ticker]: { shares: currentShares + shares } };
         setBalance(newBal); setPortfolio(newPortfolio);
         saveGameState({ bank_balance: newBal, portfolio: newPortfolio });
         
      } else if (action === 'sell') {
         if (currentShares < shares) return alert("You don't own that many shares.");
         
         const revenue = currentPrice * shares;
         const newBal = balance + revenue;
         
         const newPortfolio = { ...portfolio };
         // Clean up dust
         if (currentShares - shares <= 0.000001) {
             delete newPortfolio[ticker]; 
         } else {
             newPortfolio[ticker] = { shares: currentShares - shares };
         }
         
         setBalance(newBal); setPortfolio(newPortfolio);
         saveGameState({ bank_balance: newBal, portfolio: newPortfolio });
      }
   };

   const formatPrice = (price: number) => {
      return price < 1 
         ? price.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 })
         : price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
   };

   return (
      <div className="max-w-6xl mx-auto animate-in fade-in duration-500">
         <div className="flex justify-between items-end mb-8 border-b border-white/5 pb-6">
            <div>
               <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight flex items-center gap-3"><TrendingUp className="text-emerald-400 w-8 h-8"/> Live Crypto Exchange</h2>
               <p className="text-zinc-400 text-sm mt-2">Trade real-world cryptocurrencies powered by live Binance feeds & algorithmic backups.</p>
            </div>
            <div className="text-right">
               <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Available Buying Power</p>
               <p className="text-2xl font-mono font-black text-white">${Number(balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(CRYPTO_ASSETS).map(([ticker, crypto]) => {
               const livePrice = prices[ticker] || 0;
               const prevPrice = prevPrices[ticker] || livePrice;
               const isUp = livePrice >= prevPrice;
               const priceColor = livePrice === 0 ? "text-zinc-500" : (isUp ? "text-emerald-400" : "text-red-400");
               
               const ownedShares = portfolio[ticker]?.shares || 0;
               const ownedValue = ownedShares * livePrice;

               return (
                  <div key={ticker} className="bg-[#121214] border border-white/5 rounded-[24px] p-5 shadow-xl flex flex-col relative overflow-hidden group hover:border-white/10 transition-colors">
                     <div className="flex justify-between items-start mb-6">
                        <div>
                           <h3 className="text-lg font-black text-white flex items-center gap-2">
                              <Coins className={`w-4 h-4 ${crypto.color}`} /> {crypto.name}
                           </h3>
                           <p className="text-[10px] font-mono font-bold text-zinc-500 mt-1">{ticker}</p>
                        </div>
                        <div className="text-right">
                           <p className={`text-2xl font-black font-mono transition-colors duration-300 ${priceColor}`}>
                              ${livePrice > 0 ? formatPrice(livePrice) : "---"}
                           </p>
                           <p className={`text-[8px] uppercase tracking-widest ${isUp ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'} px-2 py-0.5 rounded inline-block mt-1 transition-colors duration-300`}>
                              Live Feed
                           </p>
                        </div>
                     </div>

                     <div className="bg-black/40 border border-white/5 rounded-xl p-3 mb-4 flex justify-between items-center">
                        <div>
                           <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">Your Position</p>
                           <p className="font-mono text-xs text-white">{ownedShares > 0 ? ownedShares.toFixed(4) : "0"} {ticker}</p>
                        </div>
                        <div className="text-right">
                           <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">Current Value</p>
                           <p className="font-mono text-xs text-emerald-400">${ownedValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        </div>
                     </div>

                     <div className="flex gap-2 mt-auto">
                        <button onClick={() => handleTrade(ticker, 'buy', prompt(`How much ${ticker} to BUY? (e.g. 0.05)`))} disabled={livePrice === 0} className="flex-1 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 disabled:bg-white/5 disabled:border-transparent disabled:text-zinc-600 text-emerald-400 border border-emerald-500/30 rounded-xl text-[10px] uppercase tracking-widest font-bold transition-colors">
                           BUY
                        </button>
                        <button onClick={() => handleTrade(ticker, 'sell', prompt(`How much ${ticker} to SELL? (e.g. 0.05)`))} disabled={ownedShares === 0 || livePrice === 0} className="flex-1 py-2.5 bg-red-500/10 hover:bg-red-500/20 disabled:bg-white/5 disabled:border-transparent disabled:text-zinc-600 text-red-400 border border-red-500/30 rounded-xl text-[10px] uppercase tracking-widest font-bold transition-colors">
                           SELL
                        </button>
                     </div>
                  </div>
               );
            })}
         </div>
      </div>
   );
}