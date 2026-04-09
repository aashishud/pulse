"use client";

import React from 'react';
import { Utensils, Coffee, Trophy, Car } from 'lucide-react';
import { VEHICLES } from '@/lib/network-data';

export default function LifestyleTab({ balance, energy, ownedVehicles, setBalance, setEnergy, setOwnedVehicles, saveGameState, showAlert, showConfirm, selectedBank }: any) {
   
   const handleBuyFood = async (item: string, cost: number, regen: number) => {
      if (balance < cost) return await showAlert("Insufficient Funds", "You don't have enough liquid funds for this meal.");
      if (energy >= 100) return await showAlert("Energy Full", "You are already full of energy!");
      
      const newBal = balance - cost;
      const newEnergy = Math.min(100, energy + regen);
      setBalance(newBal); 
      setEnergy(newEnergy);
      saveGameState({ bank_balance: newBal, energy: newEnergy });
   };

   const handleBuyCar = async (id: string) => {
      if (!selectedBank) return await showAlert("Bank Account Required", "You must open a bank account in the Banking tab before purchasing luxury vehicles.");

      const car = VEHICLES[id];
      if (balance < car.price) return await showAlert("Insufficient Funds", `Insufficient liquid funds to buy the ${car.name}.`);
      if (ownedVehicles.includes(id)) return await showAlert("Already Owned", "You already own this vehicle!");
      
      const confirm = await showConfirm("Confirm Purchase", `Are you sure you want to buy the ${car.name} for $${car.price.toLocaleString('en-US')}?`);
      if (!confirm) return;

      const newBal = balance - car.price;
      const newVehicles = [...ownedVehicles, id];
      setBalance(newBal); 
      setOwnedVehicles(newVehicles);
      saveGameState({ bank_balance: newBal, owned_vehicles: newVehicles });
      
      await showAlert("Keys Acquired!", `Congratulations! You are the proud new owner of a ${car.name}.`);
   };

   const handleSellCar = async (id: string) => {
      const car = VEHICLES[id];
      if (!ownedVehicles.includes(id)) return;

      const sellPrice = car.price * 0.8; // 20% depreciation

      const confirm = await showConfirm("Sell Vehicle", `Are you sure you want to sell your ${car.name} for $${sellPrice.toLocaleString('en-US')}?\n\nA 20% depreciation fee is applied to all vehicle sales.`);
      if (!confirm) return;

      const newBal = balance + sellPrice;
      const newVehicles = ownedVehicles.filter((vId: string) => vId !== id);
      
      setBalance(newBal); 
      setOwnedVehicles(newVehicles);
      saveGameState({ bank_balance: newBal, owned_vehicles: newVehicles });
      
      await showAlert("Vehicle Sold", `You successfully sold the ${car.name} for $${sellPrice.toLocaleString('en-US')}. The funds have been deposited into your Current Account.`);
   };

   return (
      <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
         <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-2 tracking-tight">Lifestyle & Dealership</h2>
            <p className="text-zinc-400 max-w-xl mx-auto text-sm">Replenish your energy with high-end dining, or buy exotic vehicles to flex your status and unlock exclusive hustles.</p>
         </div>

         <div>
            <h3 className="text-lg font-black text-white mb-4 flex items-center gap-2"><Utensils className="w-5 h-5 text-orange-400"/> Dining & Energy</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               <button onClick={() => handleBuyFood('street', 25, 30)} className="bg-[#121214] border border-white/5 hover:border-orange-500/30 p-4 rounded-2xl flex items-center justify-between group transition-all text-left">
                  <div className="flex items-center gap-3"><div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center text-orange-400"><Coffee className="w-5 h-5"/></div><div><p className="font-bold text-sm text-white">Street Food</p><p className="text-[10px] text-zinc-500 font-mono">Cost: $25</p></div></div>
                  <span className="text-yellow-400 text-xs font-bold font-mono">+30⚡</span>
               </button>
               <button onClick={() => handleBuyFood('restaurant', 150, 60)} className="bg-[#121214] border border-white/5 hover:border-orange-500/30 p-4 rounded-2xl flex items-center justify-between group transition-all text-left">
                  <div className="flex items-center gap-3"><div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center text-orange-400"><Utensils className="w-5 h-5"/></div><div><p className="font-bold text-sm text-white">Nice Restaurant</p><p className="text-[10px] text-zinc-500 font-mono">Cost: $150</p></div></div>
                  <span className="text-yellow-400 text-xs font-bold font-mono">+60⚡</span>
               </button>
               <button onClick={() => handleBuyFood('michelin', 1500, 100)} className="bg-[#121214] border border-orange-500/20 hover:border-orange-500/50 shadow-[0_0_20px_rgba(249,115,22,0.1)] p-4 rounded-2xl flex items-center justify-between group transition-all text-left">
                  <div className="flex items-center gap-3"><div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center text-orange-400"><Trophy className="w-5 h-5"/></div><div><p className="font-bold text-sm text-white">Michelin Star Meal</p><p className="text-[10px] text-zinc-500 font-mono">Cost: $1,500</p></div></div>
                  <span className="text-yellow-400 text-xs font-bold font-mono">MAX⚡</span>
               </button>
            </div>
         </div>

         <div>
            <h3 className="text-lg font-black text-white mb-4 flex items-center gap-2"><Car className="w-5 h-5 text-indigo-400"/> Luxury Dealership</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {Object.entries(VEHICLES).map(([id, car]) => {
                  const isOwned = ownedVehicles.includes(id);
                  return (
                     <div key={id} className="bg-[#121214] border border-white/5 rounded-2xl p-5 flex flex-col justify-between group relative overflow-hidden">
                        <div className="absolute -right-4 -top-4 opacity-5"><Car className="w-24 h-24" /></div>
                        <div className="relative z-10 mb-6">
                           <h4 className="text-xl font-black text-white">{car.name}</h4>
                           <p className="text-xs text-zinc-400 mt-1">{car.desc}</p>
                           <p className="font-mono font-bold text-indigo-400 mt-2">${car.price.toLocaleString('en-US')}</p>
                        </div>
                        
                        <div className="relative z-10 mt-auto">
                           {isOwned ? (
                              <button 
                                 onClick={() => handleSellCar(id)} 
                                 className="w-full py-3 rounded-xl font-bold text-sm transition-all bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]"
                              >
                                 Sell Vehicle (${(car.price * 0.8).toLocaleString('en-US')})
                              </button>
                           ) : (
                              <button 
                                 onClick={() => handleBuyCar(id)} 
                                 className="w-full py-3 rounded-xl font-bold text-sm transition-all bg-white text-black hover:bg-zinc-200 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                              >
                                 Purchase Vehicle
                              </button>
                           )}
                        </div>
                     </div>
                  );
               })}
            </div>
         </div>
      </div>
   );
}