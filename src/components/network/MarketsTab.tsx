"use client";

import React, { useState, useEffect } from 'react';
import { TrendingUp, Coins, LineChart, X } from 'lucide-react';
import { CRYPTO_ASSETS, STOCK_ASSETS } from '@/lib/network-data';
import { AreaChart, Area, Grid, XAxis, ChartTooltip } from '@/components/ui/area-chart';

// --- Generates a realistic, volatile past trend with OHLC (Open, High, Low, Close) data ---
const generateInitialHistory = (currentPrice: number, ticker: string) => {
  const data = [];
  const now = Date.now();
  
  // Use the ticker characters to deterministically decide if the past 30 mins were bullish or bearish
  const seed = ticker.charCodeAt(0) + ticker.charCodeAt(ticker.length - 1);
  const isBullish = seed % 2 === 0;
  
  let prevChange = 0;
  let currentClose = currentPrice;
  
  // Work backwards from the current time to generate 30 minutes of past data
  for (let i = 1; i <= 30; i++) {
     const volatility = currentPrice * 0.003; // Base volatility multiplier
     
     // 1. Random jagged noise
     const noise = (Math.random() - 0.5) * 2;
     
     // 2. A sine wave to create overarching, organic "curves" and swings
     const wave = Math.sin(i * 0.3) * 0.8;
     
     // 3. The general trend. Since we are working BACKWARDS in time:
     // If it's bullish (went up to get here), past prices should be lower (negative trend)
     const trend = isBullish ? -0.4 : 0.4; 
     
     // FIX: Multiply the factors by volatility FIRST, then add the decaying momentum.
     // Previously, momentum was multiplied by volatility every loop, causing exponential explosions!
     const change = ((noise * 0.4 + wave * 0.4 + trend * 0.2) * volatility) + (prevChange * 0.5);
     prevChange = change;
     
     let open = currentClose - change; 
     if (open <= 0.01) open = 0.01; // Floor
     
     // Calculate randomized wicks (high/low)
     const high = Math.max(open, currentClose) + Math.random() * volatility * 1.5;
     const low = Math.max(0.01, Math.min(open, currentClose) - Math.random() * volatility * 1.5);
     
     data.unshift({ 
         date: new Date(now - i * 60000), 
         price: currentClose, 
         open, 
         high, 
         low, 
         close: currentClose 
     });
     
     currentClose = open; // The open of this backwards candle becomes the close of the previous one
  }
  
  // Fix the first candle's wicks
  data[0].high = Math.max(data[0].open, data[0].close) + Math.random() * currentPrice * 0.001;
  data[0].low = Math.max(0.01, Math.min(data[0].open, data[0].close) - Math.random() * currentPrice * 0.001);
  
  return data;
};

// --- CUSTOM SVG CANDLESTICK CHART ---
const CandlestickChart = ({ data, minPrice, maxPrice }: { data: any[], minPrice: number, maxPrice: number }) => {
   const viewBoxWidth = 1000;
   const viewBoxHeight = 300;
   
   const range = (maxPrice - minPrice) || 1;
   const paddedMin = minPrice - (range * 0.15); // Padding bottom
   const paddedMax = maxPrice + (range * 0.15); // Padding top
   const paddedRange = paddedMax - paddedMin;
   
   const getY = (val: number) => viewBoxHeight - ((val - paddedMin) / paddedRange) * viewBoxHeight;
   const step = viewBoxWidth / Math.max(data.length, 1);
   const candleWidth = Math.max(step * 0.6, 4);

   return (
      <svg viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`} className="w-full h-full overflow-visible" preserveAspectRatio="none">
         {/* Simple Grid Lines */}
         {[0.25, 0.5, 0.75].map(ratio => (
             <line key={ratio} x1="0" x2={viewBoxWidth} y1={viewBoxHeight * ratio} y2={viewBoxHeight * ratio} stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" strokeWidth="2" />
         ))}
         
         {data.map((d, i) => {
             const x = i * step + step / 2;
             const isUp = d.close >= d.open;
             const color = isUp ? "#22c55e" : "#ef4444"; // emerald-500 : red-500
             
             const yHigh = getY(d.high);
             const yLow = getY(d.low);
             const yTop = getY(Math.max(d.open, d.close));
             const yBottom = getY(Math.min(d.open, d.close));
             const bodyHeight = Math.max(yBottom - yTop, 2); // Minimum 2px body height

             return (
                 <g key={i} className="transition-all duration-300 hover:opacity-80">
                    {/* Wick */}
                    <line x1={x} x2={x} y1={yHigh} y2={yLow} stroke={color} strokeWidth={3} strokeLinecap="round" />
                    {/* Body */}
                    <rect x={x - candleWidth/2} y={yTop} width={candleWidth} height={bodyHeight} fill={color} rx={2} />
                 </g>
             );
         })}
      </svg>
   );
};


export default function MarketsTab({ balance, portfolio, setBalance, setPortfolio, saveGameState, showAlert, showPrompt, selectedBank }: any) {
   const [prices, setPrices] = useState<Record<string, number>>({});
   const [prevPrices, setPrevPrices] = useState<Record<string, number>>({});
   const [priceHistory, setPriceHistory] = useState<Record<string, any[]>>({});
   
   const [marketView, setMarketView] = useState<'crypto' | 'stocks'>('stocks');
   const [expandedAsset, setExpandedAsset] = useState<string | null>(null);
   const [chartMode, setChartMode] = useState<'line' | 'candle'>('candle');

   // 1. Fetch Live Prices
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

   // 2. Append Live Prices to the Chart History Array
   useEffect(() => {
      if (Object.keys(prices).length === 0) return;
      
      setPriceHistory(prev => {
         const newHistory = { ...prev };
         Object.entries(prices).forEach(([ticker, currentPrice]) => {
            if (!newHistory[ticker]) {
               // First load: Generate fake history anchored to the real live price
               newHistory[ticker] = generateInitialHistory(currentPrice, ticker);
            } else {
               // Subsequent loads: Append the real live price and pop the oldest to keep it at 30 points
               const lastPoint = newHistory[ticker][newHistory[ticker].length - 1];
               if (lastPoint.price !== currentPrice) {
                  const open = lastPoint.close;
                  const close = currentPrice;
                  const vol = currentPrice * 0.002;
                  const high = Math.max(open, close) + Math.random() * vol;
                  const low = Math.max(0.01, Math.min(open, close) - Math.random() * vol);
                  
                  newHistory[ticker] = [...newHistory[ticker].slice(1), { 
                     date: new Date(), price: currentPrice, open, high, low, close 
                  }];
               }
            }
         });
         return newHistory;
      });
   }, [prices]);

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
                     onClick={() => { setMarketView('stocks'); setExpandedAsset(null); }} 
                     className={`px-6 py-2 rounded-lg font-bold text-sm transition flex items-center gap-2 ${marketView === 'stocks' ? 'bg-white/10 text-white shadow-md' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}
                  >
                     <LineChart className="w-4 h-4" /> Wall Street
                  </button>
                  <button 
                     onClick={() => { setMarketView('crypto'); setExpandedAsset(null); }} 
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

         {/* grid-flow-dense ensures expanded cards don't leave empty gaps in the row! */}
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 grid-flow-dense">
            {Object.entries(activeAssets).map(([ticker, asset]) => {
               const livePrice = prices[ticker] || 0;
               const prevPrice = prevPrices[ticker] || livePrice;
               const isUp = livePrice >= prevPrice;
               const priceColor = livePrice === 0 ? "text-zinc-500" : (isUp ? "text-emerald-400" : "text-red-400");
               
               const ownedShares = portfolio[ticker]?.shares || 0;
               const ownedValue = ownedShares * livePrice;
               const isExpanded = expandedAsset === ticker;

               // --- RELATIVE CHART SCALING ALGORITHM ---
               let chartData: any[] = [];
               let minPrice = 0;
               let maxPrice = 0;

               if (isExpanded && priceHistory[ticker] && priceHistory[ticker].length > 0) {
                  const history = priceHistory[ticker];
                  
                  // Calculate true Min/Max including wicks
                  minPrice = Math.min(...history.map(d => d.low || d.price));
                  maxPrice = Math.max(...history.map(d => d.high || d.price));
                  
                  const range = (maxPrice - minPrice) || (livePrice * 0.01); 
                  const base = minPrice - (range * 0.1); 
                  
                  chartData = history.map(d => ({
                     date: d.date,
                     displayPrice: Math.max(0.0001, d.price - base), // Used strictly for visual curve scaling in AreaChart
                     realPrice: d.price, // Used for accurate tooltip display
                     open: d.open,
                     high: d.high,
                     low: d.low,
                     close: d.close
                  }));
               }

               return (
                  <div 
                     key={ticker} 
                     onClick={() => { if (!isExpanded) setExpandedAsset(ticker); }}
                     className={`bg-[#121214] rounded-[24px] p-5 shadow-xl flex flex-col relative overflow-hidden group transition-all duration-500 ${
                        isExpanded 
                           ? 'col-span-1 md:col-span-2 lg:col-span-3 border-2 border-indigo-500/50 shadow-[0_0_40px_rgba(99,102,241,0.15)] cursor-default' 
                           : 'border border-white/5 hover:border-white/10 cursor-pointer'
                     }`}
                  >
                     <div className="flex justify-between items-start mb-6">
                        <div>
                           <h3 className="text-lg font-black text-white flex items-center gap-2">
                              {marketView === 'crypto' ? <Coins className={`w-4 h-4 ${asset.color}`} /> : <LineChart className={`w-4 h-4 ${asset.color}`} />} 
                              {asset.name}
                           </h3>
                           <p className="text-[10px] font-mono font-bold text-zinc-500 mt-1">{ticker}</p>
                        </div>
                        <div className="flex items-start gap-4">
                           <div className="text-right">
                              <p className={`text-2xl font-black font-mono transition-colors duration-300 ${priceColor}`}>
                                 ${livePrice > 0 ? formatPrice(livePrice) : "---"}
                              </p>
                              <p className={`text-[8px] uppercase tracking-widest ${isUp ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'} px-2 py-0.5 rounded inline-block mt-1 transition-colors duration-300`}>
                                 Live Feed
                              </p>
                           </div>
                           {isExpanded && (
                              <button 
                                onClick={(e) => { e.stopPropagation(); setExpandedAsset(null); }} 
                                className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors shrink-0"
                              >
                                <X className="w-4 h-4 text-zinc-400" />
                              </button>
                           )}
                        </div>
                     </div>

                     {/* THE CHART EXPANSION */}
                     {isExpanded && chartData.length > 0 && (
                         <div className="w-full h-[200px] sm:h-[300px] mb-6 animate-in fade-in duration-700 relative">
                            
                            {/* Chart Style Toggle */}
                            <div className="absolute top-4 right-4 z-20 flex bg-black/60 border border-white/10 rounded-lg p-1 backdrop-blur-md shadow-xl">
                               <button 
                                  onClick={(e) => { e.stopPropagation(); setChartMode('line'); }} 
                                  className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-md transition ${chartMode === 'line' ? 'bg-white/10 text-white shadow-md' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}
                               >
                                  Line
                               </button>
                               <button 
                                  onClick={(e) => { e.stopPropagation(); setChartMode('candle'); }} 
                                  className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-md transition ${chartMode === 'candle' ? 'bg-white/10 text-white shadow-md' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}
                               >
                                  Candle
                               </button>
                            </div>

                            {chartMode === 'line' ? (
                               <div className="w-full h-full"
                                  style={{
                                     "--chart-background": "transparent",
                                     "--chart-foreground": "white",
                                     "--chart-foreground-muted": "#a1a1aa",
                                     "--chart-label": "#71717a",
                                     "--chart-line-primary": isUp ? "#34d399" : "#ef4444", 
                                     "--chart-crosshair": "#3f3f46",
                                     "--chart-grid": "rgba(255,255,255,0.05)",
                                   } as React.CSSProperties}
                               >
                                  <AreaChart data={chartData} xDataKey="date" aspectRatio="auto" className="h-full w-full">
                                    <Grid horizontal strokeDasharray="0" stroke="var(--chart-grid)" />
                                    <Area dataKey="displayPrice" fill="var(--chart-line-primary)" fillOpacity={0.2} strokeWidth={3} fadeEdges />
                                    <XAxis />
                                    <ChartTooltip 
                                       showCrosshair 
                                       showDots 
                                       showDatePill 
                                       rows={(point) => [{ 
                                          color: isUp ? "#34d399" : "#ef4444", 
                                          label: "Price", 
                                          value: `$${(point.realPrice as number)?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}` 
                                       }]} 
                                    />
                                  </AreaChart>
                               </div>
                            ) : (
                               <div className="w-full h-full pt-10 pb-4">
                                  <CandlestickChart data={chartData} minPrice={minPrice} maxPrice={maxPrice} />
                               </div>
                            )}

                         </div>
                     )}

                     <div className={`bg-black/40 border border-white/5 rounded-xl p-3 mb-4 flex justify-between items-center ${isExpanded ? 'mt-auto' : ''}`}>
                        <div>
                           <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">Your Position</p>
                           <p className="font-mono text-xs text-white">{ownedShares > 0 ? ownedShares.toFixed(4) : "0"} {ticker}</p>
                        </div>
                        <div className="text-right">
                           <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">Current Value</p>
                           <p className="font-mono text-xs text-emerald-400">${ownedValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        </div>
                     </div>

                     <div className="flex gap-2">
                        {/* We use e.stopPropagation() here so clicking Buy/Sell doesn't trigger the card's Expand onClick! */}
                        <button onClick={(e) => { e.stopPropagation(); handleTrade(ticker, 'buy'); }} disabled={livePrice === 0} className="flex-1 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 disabled:bg-white/5 disabled:border-transparent disabled:text-zinc-600 text-emerald-400 border border-emerald-500/30 rounded-xl text-[10px] uppercase tracking-widest font-bold transition-colors">
                           BUY
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleTrade(ticker, 'sell'); }} disabled={ownedShares === 0 || livePrice === 0} className="flex-1 py-2.5 bg-red-500/10 hover:bg-red-500/20 disabled:bg-white/5 disabled:border-transparent disabled:text-zinc-600 text-red-400 border border-red-500/30 rounded-xl text-[10px] uppercase tracking-widest font-bold transition-colors">
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