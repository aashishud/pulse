"use client";

import React from 'react';
import { Plane, Home, MapPin } from 'lucide-react';
import { LOCATIONS, REAL_ESTATE } from '@/lib/network-data';

export default function RealEstateTab({ currentLocation, ownedProperties, handleRelocate, handleBuyProperty, handleSellProperty }: any) {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="text-center mb-10">
         <h2 className="text-3xl md:text-4xl font-black text-white mb-4 tracking-tight">Global Real Estate & Migration</h2>
         <p className="text-zinc-400 max-w-xl mx-auto">Relocating changes your tax brackets and cost of living. Purchasing a property permanently removes rent expenses for that city and boosts your net worth.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Object.entries(LOCATIONS).map(([cityId, city]) => {
          const isCurrent = currentLocation === cityId;
          const cityProperties = REAL_ESTATE[cityId] || [];
          const ownsAnyHere = cityProperties.some(p => ownedProperties.includes(p.id));

          return (
            <div key={cityId} className={`bg-[#121214] border rounded-3xl p-6 flex flex-col transition-all ${isCurrent ? 'border-cyan-500/50 shadow-[0_0_30px_rgba(6,182,212,0.15)]' : 'border-white/10 hover:border-white/20 shadow-xl'}`}>
               <div className="flex justify-between items-start mb-6">
                 <div>
                    <h3 className="text-2xl font-black text-white mb-1">{city.name}</h3>
                    <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">{city.perk}</p>
                 </div>
                 {isCurrent ? (
                    <div className="w-10 h-10 bg-cyan-500/20 rounded-full flex items-center justify-center shrink-0 border border-cyan-500/30 text-cyan-400" title="Current Location"><MapPin className="w-5 h-5" /></div>
                 ) : (
                    <button onClick={() => handleRelocate(cityId)} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/10 text-xs font-bold transition flex items-center gap-2"><Plane className="w-4 h-4" /> Relocate ($500)</button>
                 )}
               </div>

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
                              <button onClick={() => isOwned ? handleSellProperty(prop.id) : handleBuyProperty(prop.id)} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition shadow-md ${isOwned ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-white text-black hover:bg-zinc-200'}`}>
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
}