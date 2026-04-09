"use client";

import React, { useState, useEffect } from 'react';
import { TrendingUp, Coins, LineChart } from 'lucide-react';
import { CRYPTO_ASSETS, STOCK_ASSETS } from '@/lib/network-data';

export default function MarketsTab({ balance, portfolio, setBalance, setPortfolio, saveGameState, showAlert, showPrompt, selectedBank }: any) {
   const [prices, setPrices] = useState<Record<string, number>>({});
   const [prevPrices, setPrevPrices] = useState<Record<string, number>>({});
   const [marketView, setMarketView] = useState<'crypto' | 'stocks'>('stocks');

   useEffect(() => {
      const fetchPrices = async () => {
         if (document.hidden) return;

         try {
            const [cryptoRes, stockRes] = await Promise.all([
               fetch(`/api/crypto`),
               fetch(`/api/stocks`)
            ]);
            
            const cryptoData = cryptoRes.ok ? await cryptoRes.json() : [];
            const stockData = stockRes.ok ? await stockRes.json() : [];
            
            const combinedData = [
               ...(Array.isArray(cryptoData) ? cryptoData : []),
               ...(Array.isArray(stockData) ? stockData : [])
            ];
            
            setPrices(current => {
               setPrevPrices(current);
               const newPrices: any = { ...current };
               
               Object.entries(CRYPTO_ASSETS).forEach(([ticker, crypto]) => {
                  const item = combinedData.find((d: any) => d.symbol === crypto.symbol);
                  if (item && !isNaN(parseFloat(item.price))) newPrices[ticker] = parseFloat(item.price);
               });
               
               Object.entries(STOCK_ASSETS).forEach(([ticker, stock]) => {
                  const item = combinedData.find((d: any) => d.symbol === stock.symbol);
                  if (item && !isNaN(parseFloat(item.price))) newPrices[ticker] = parseFloat(item.price);
               });

               return newPrices;
            });
         } catch(e) {
            console.error("Live Markets API Error:", e);
         }
      };
      
      fetchPrices();
      const interval = setInterval(fetchPrices, 10000);
      return () => clearInterval(interval);
   }, []);

   const handleTrade = async (ticker: string, action: 'buy' | 'sell') => {
      if (!selectedBank) return await showAlert("Bank Account Required", "You must open a bank account before trading on the global markets.");

      const currentPrice = prices[ticker];
      if (!currentPrice) return;

      const sharesStr = await showPrompt(`Trade ${ticker}`, `How many shares of ${ticker} to ${action.toUpperCase()} at $${currentPrice.toLocaleString('en-US', {minimumFractionDigits: 2})}? (e.g. 1.5)`, "1");
      if (!sharesStr) return;
      
      const shares = parseFloat(sharesStr);
      if (isNaN(shares) || shares <= 0) return await showAlert("Error", "Please enter a valid number of shares.");
      
      const currentShares = portfolio[ticker]?.shares || 0;

      if (action === 'buy') {
         const cost = currentPrice * shares;
         if (balance < cost) return await showAlert("Insufficient Funds", `You need $${cost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} to buy this.`);
         
         const newBal = balance - cost;
         const newPortfolio = { ...portfolio, [ticker]: { shares: currentShares + shares } };
         setBalance(newBal); setPortfolio(newPortfolio);
         saveGameState({ bank_balance: newBal, portfolio: newPortfolio });
         
      } else if (action === 'sell') {
         if (currentShares < shares) return await showAlert("Error", "You don't own that many shares.");
         
         const revenue = currentPrice * shares;
         const newBal = balance + revenue;
         
         const newPortfolio = { ...portfolio };
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

   const activeAssets = marketView === 'crypto' ? CRYPTO_ASSETS : STOCK_ASSETS;

   return (
      <div className="max-w-6xl mx-auto animate-in fade-in duration-500">
         <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 border-b border-white/5 pb-6 gap-6">
            <div>
               <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight flex items-center gap-3">
                  <TrendingUp className="text-emerald-400 w-8 h-8"/> Live Global Markets
               </h2>
               <p className="text-zinc-400 text-sm mt-2">Trade real-world stocks and crypto powered by live market feeds.</p>
               
               <div className="flex gap-2 mt-6 p-1 bg-black/40 border border-white/5 rounded-xl w-max">
                  <button 
                     onClick={() => setMarketView('stocks')} 
                     className={`px-6 py-2 rounded-lg font-bold text-sm transition flex items-center gap-2 ${marketView === 'stocks' ? 'bg-white/10 text-white shadow-md' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}
                  >
                     <LineChart className="w-4 h-4" /> Wall Street
                  </button>
                  <button 
                     onClick={() => setMarketView('crypto')} 
                     className={`px-6 py-2 rounded-lg font-bold text-sm transition flex items-center gap-2 ${marketView === 'crypto' ? 'bg-white/10 text-white shadow-md' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}
                  >
                     <Coins className="w-4 h-4" /> Crypto
                  </button>
               </div>
            </div>
            
            <div className="text-left md:text-right bg-black/20 p-4 rounded-2xl border border-white/5 w-full md:w-auto">
               <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Available Buying Power</p>
               <p className="text-2xl font-mono font-black text-white">${Number(balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(activeAssets).map(([ticker, asset]) => {
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
                              {marketView === 'crypto' ? <Coins className={`w-4 h-4 ${asset.color}`} /> : <LineChart className={`w-4 h-4 ${asset.color}`} />} 
                              {asset.name}
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
                        <button onClick={() => handleTrade(ticker, 'buy')} disabled={livePrice === 0} className="flex-1 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 disabled:bg-white/5 disabled:border-transparent disabled:text-zinc-600 text-emerald-400 border border-emerald-500/30 rounded-xl text-[10px] uppercase tracking-widest font-bold transition-colors">
                           BUY
                        </button>
                        <button onClick={() => handleTrade(ticker, 'sell')} disabled={ownedShares === 0 || livePrice === 0} className="flex-1 py-2.5 bg-red-500/10 hover:bg-red-500/20 disabled:bg-white/5 disabled:border-transparent disabled:text-zinc-600 text-red-400 border border-red-500/30 rounded-xl text-[10px] uppercase tracking-widest font-bold transition-colors">
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