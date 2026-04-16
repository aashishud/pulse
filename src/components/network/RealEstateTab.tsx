"use client";

import React, { useState } from 'react';
import { Plane, Home, MapPin, Globe2 } from 'lucide-react';
import { LOCATIONS, REAL_ESTATE } from '@/lib/network-data';
import AnalyticsGlobe from '../AnalyticsGlobe';

export default function RealEstateTab({ currentLocation, ownedProperties, handleRelocate, handleBuyProperty, handleSellProperty }: any) {
  const [selectedCityId, setSelectedCityId] = useState<string>(currentLocation || 'bali');
  const [isRelocating, setIsRelocating] = useState(false);

  const focusTarget = [LOCATIONS[selectedCityId]?.lat || 0, LOCATIONS[selectedCityId]?.lng || 0] as [number, number];
  
  const city = LOCATIONS[selectedCityId];
  const cityProperties = REAL_ESTATE[selectedCityId] || [];
  const isCurrent = currentLocation === selectedCityId;
  const ownsAnyHere = cityProperties.some(p => ownedProperties.includes(p.id));

  const handleFlightWrapper = async () => {
    setIsRelocating(true);
    await handleRelocate(selectedCityId);
    setIsRelocating(false);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 animate-in fade-in duration-500">
      
      {/* 3D GLOBE HERO SECTION */}
      <div className="relative w-full h-[300px] bg-[#050505] border border-white/10 rounded-[32px] overflow-hidden flex flex-col items-center justify-center shadow-2xl group">
         <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.15),transparent_70%)] pointer-events-none"></div>
         <div className="absolute top-0 w-full h-24 bg-gradient-to-b from-[#050505] to-transparent z-10 pointer-events-none"></div>
         <div className="absolute bottom-0 w-full h-24 bg-gradient-to-t from-[#050505] to-transparent z-10 pointer-events-none"></div>
         
         <div className="w-[300px] h-[300px] absolute inset-0 m-auto flex items-center justify-center">
            <AnalyticsGlobe focusLocation={focusTarget} className="opacity-90" speed={0} />
         </div>
         
         <div className="absolute top-6 left-8 right-8 z-20 pointer-events-none flex justify-between items-start">
            <div>
              <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight drop-shadow-lg flex items-center gap-3">
                 <Globe2 className="w-6 h-6 text-indigo-400" />
                 Global Relocation
              </h2>
              <p className="text-zinc-400 mt-2 max-w-sm drop-shadow-md text-xs">Target a sector. Relocating adjusts your income tax bands and local living expenses.</p>
            </div>
            
            <div className="backdrop-blur-md bg-black/40 border border-white/10 rounded-2xl p-3 text-right hidden sm:block">
               <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Target Coordinates</p>
               <p className="text-indigo-400 font-mono font-bold text-xs">LAT: {focusTarget[0].toFixed(4)}</p>
               <p className="text-indigo-400 font-mono font-bold text-xs">LNG: {focusTarget[1].toFixed(4)}</p>
            </div>
         </div>
      </div>

      {/* HORIZONTAL LOCATION SELECTOR */}
      <div className="flex gap-4 overflow-x-auto pb-4 snap-x [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-black/20 [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full">
         {Object.entries(LOCATIONS).map(([cityId, c]) => {
            const active = selectedCityId === cityId;
            const isHome = currentLocation === cityId;
            return (
               <button
                  key={cityId}
                  onClick={() => setSelectedCityId(cityId)}
                  className={`shrink-0 snap-center w-64 p-5 rounded-3xl border text-left flex flex-col transition-all duration-300 ${active ? 'bg-indigo-500/10 border-indigo-500/50 shadow-[0_0_30px_rgba(99,102,241,0.2)] scale-100' : 'bg-[#121214] border-white/5 hover:border-white/20 scale-95 opacity-70 hover:opacity-100'}`}
               >
                  <div className="flex justify-between items-start mb-4">
                     <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${active ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-400' : 'bg-black/50 border-white/10 text-zinc-500'}`}>
                        {isHome ? <Home className="w-5 h-5" /> : <Plane className="w-5 h-5" />}
                     </div>
                     {isHome && <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-widest">Active</span>}
                  </div>
                  <h3 className={`text-xl font-black mb-1 ${active ? 'text-white' : 'text-zinc-300'}`}>{c.name}</h3>
                  <p className={`text-xs ${active ? 'text-indigo-300' : 'text-zinc-500'}`}>{c.perk}</p>
               </button>
            )
         })}
      </div>

      {/* SELECTED CITY DETAILS PANEL */}
      <div className="bg-[#121214] border border-white/5 rounded-[32px] p-6 md:p-8 flex flex-col lg:flex-row gap-8 animate-in slide-in-from-bottom-4 duration-500">
         
         {/* LEFT COLUMN: CITY STATS & RELOCATE */}
         <div className="lg:w-1/3 flex flex-col">
            <h3 className="text-3xl font-black text-white mb-2">{city.name} Economy</h3>
            <p className="text-zinc-400 text-sm mb-8">{city.perk}. Establishing residency here subjects you to local tax laws.</p>
            
            <div className="space-y-3 mb-8">
               <div className="flex justify-between items-center bg-black/40 p-4 rounded-2xl border border-white/5">
                  <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Income Tax</span>
                  <span className={city.tax === 0 ? 'text-emerald-400 font-mono font-bold text-lg' : 'text-red-400 font-mono font-bold text-lg'}>{(city.tax * 100).toFixed(0)}%</span>
               </div>
               <div className="flex justify-between items-center bg-black/40 p-4 rounded-2xl border border-white/5">
                  <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Living Cost</span>
                  <span className="text-red-400 font-mono font-bold">-${city.living}/day</span>
               </div>
               <div className="flex justify-between items-center bg-black/40 p-4 rounded-2xl border border-white/5">
                  <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Property Rent</span>
                  <span className={ownsAnyHere ? 'text-emerald-400 font-mono font-bold text-xs' : 'text-red-400 font-mono font-bold'}>{ownsAnyHere ? 'Waived (Owner)' : `-$${city.rent}/day`}</span>
               </div>
            </div>

            <div className="mt-auto">
               {isCurrent ? (
                  <div className="w-full py-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center gap-2 text-emerald-400 font-bold uppercase tracking-widest text-sm">
                     <MapPin className="w-5 h-5" /> Resident
                  </div>
               ) : (
                  <button 
                     onClick={handleFlightWrapper} 
                     disabled={isRelocating}
                     className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:text-indigo-300 text-white rounded-2xl transition flex justify-between px-6 items-center shadow-[0_0_30px_rgba(99,102,241,0.2)] font-black uppercase tracking-widest text-sm"
                  >
                     <span>{isRelocating ? 'Boarding...' : 'Book Flight'}</span>
                     <span className="font-mono text-indigo-200">-$500</span>
                  </button>
               )}
            </div>
         </div>

         <div className="w-px bg-white/5 mx-2 hidden lg:block"></div>

         {/* RIGHT COLUMN: REAL ESTATE MARKET */}
         <div className="lg:w-2/3 flex flex-col">
            <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-6">Local Real Estate Market</h4>
            
            {cityProperties.length === 0 ? (
               <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-3xl p-8 text-center bg-black/20">
                  <Home className="w-12 h-12 text-zinc-600 mb-4" />
                  <p className="text-zinc-500 font-bold">No properties available on market.</p>
               </div>
            ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {cityProperties.map(prop => {
                     const isOwned = ownedProperties.includes(prop.id);
                     return (
                        <div key={prop.id} className={`p-5 rounded-2xl border flex flex-col transition-all ${isOwned ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-black/40 border-white/5 hover:border-white/10'}`}>
                           <div className="mb-6 flex justify-between items-start">
                              <div>
                                 <p className={`text-lg font-black mb-1 ${isOwned ? 'text-emerald-400' : 'text-white'}`}>{prop.name}</p>
                                 <p className="text-xs text-zinc-500 font-mono">ID: {prop.id}</p>
                              </div>
                              {isOwned && <span className="bg-emerald-500/20 text-emerald-400 text-[9px] font-bold px-2 py-0.5 rounded border border-emerald-500/20 uppercase tracking-widest">Owned</span>}
                           </div>
                           
                           <div className="mt-auto flex justify-between items-end">
                              <div>
                                 <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-0.5">Market Value</p>
                                 <p className="text-lg font-black font-mono text-white">${prop.price.toLocaleString()}</p>
                              </div>
                              <button 
                                 onClick={() => isOwned ? handleSellProperty(prop.id) : handleBuyProperty(prop.id)} 
                                 className={`px-6 py-2.5 rounded-xl font-bold text-xs transition shadow-md ${isOwned ? 'bg-red-500/20 text-red-500 border border-red-500/30 hover:bg-red-500/30' : 'bg-white text-black hover:bg-zinc-200'}`}
                              >
                                 {isOwned ? 'Liquidate' : 'Purchase'}
                              </button>
                           </div>
                        </div>
                     );
                  })}
               </div>
            )}
         </div>

      </div>
    </div>
  );
}