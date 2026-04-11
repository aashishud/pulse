"use client";

import React from 'react';
import { Utensils, Coffee, Trophy, Car, Anchor, ShieldCheck, CheckCircle2, Zap } from 'lucide-react';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { VEHICLES } from '@/lib/network-data';

// --- High-Quality Imagery for the 2.5D Showcase ---
const VEHICLE_IMAGES: Record<string, string> = {
  "v_civic": "https://images.unsplash.com/photo-1619682817481-e994891cd1f5?q=80&w=1000&auto=format&fit=crop", 
  "v_tesla": "https://images.unsplash.com/photo-1560958089-b8a1929cea89?q=80&w=1000&auto=format&fit=crop",
  "v_porsche": "https://images.unsplash.com/photo-1583121274602-3e2820c69888?q=80&w=1000&auto=format&fit=crop",
  "v_lambo": "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?q=80&w=1000&auto=format&fit=crop",
  "v_yacht": "https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?q=80&w=1000&auto=format&fit=crop"
};

// ============================================================================
// 2.5D PARALLAX GLASSMORPHIC COMPONENT
// ============================================================================
const InteractiveCarCard = ({ id, car, isOwned, handleBuyCar, handleSellCar }: any) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["12deg", "-12deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-12deg", "12deg"]);
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

  const Icon = id === 'v_yacht' ? Anchor : Car;
  const bgImage = VEHICLE_IMAGES[id] || VEHICLE_IMAGES['v_porsche'];

  return (
    <div 
      // THE FIX: touchAction pan-y guarantees the browser allows vertical scrolling over this element!
      style={{ perspective: 1500, touchAction: 'pan-y', willChange: 'transform' }} 
      className="w-full h-[400px] z-20 group cursor-pointer"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className={`relative w-full h-full rounded-[32px] text-white flex flex-col justify-between transition-shadow duration-300 ${isOwned ? 'shadow-[0_0_40px_rgba(16,185,129,0.3)]' : 'shadow-[0_30px_60px_rgba(0,0,0,0.5)]'}`}
      >
        <div style={{ transform: "translateZ(-20px)" }} className={`absolute inset-0 rounded-[32px] overflow-hidden border border-white/10 ${isOwned ? 'ring-2 ring-emerald-500/50' : ''}`}>
           <img src={bgImage} alt={car.name} className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-110 group-hover:opacity-80 transition-all duration-700" />
           <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/60 to-transparent"></div>
        </div>

        <motion.div 
           style={{ x: glareX, y: glareY, transform: "translateZ(10px)" }}
           className="absolute inset-0 w-[200%] h-[200%] -top-[50%] -left-[50%] bg-gradient-to-tr from-white/0 via-white/10 to-white/0 pointer-events-none rounded-full blur-3xl z-10 transition-opacity opacity-0 group-hover:opacity-100"
        />

        <div style={{ transform: "translateZ(30px)" }} className="relative z-20 p-6 flex justify-between items-start">
           <div className="w-12 h-12 rounded-2xl bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 shadow-xl">
              <Icon className="w-6 h-6 text-white opacity-80" />
           </div>
           {isOwned && (
             <div className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 px-3 py-1.5 rounded-full flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest backdrop-blur-md shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                <CheckCircle2 className="w-3.5 h-3.5" /> Owned
             </div>
           )}
        </div>
        
        <div style={{ transform: "translateZ(50px)" }} className="relative z-20 p-6 pt-0 mt-auto">
           <h4 className="text-2xl md:text-3xl font-black text-white tracking-tight drop-shadow-xl mb-2">{car.name}</h4>
           <p className="text-xs text-zinc-300 mb-4 drop-shadow-md font-medium max-w-[90%] leading-relaxed opacity-80">{car.desc}</p>
           
           <div className="flex items-center justify-between mt-6">
              <p className="font-mono font-black text-xl text-white drop-shadow-lg">
                 ${car.price.toLocaleString('en-US')}
              </p>
              
              {isOwned ? (
                 <button 
                    onClick={(e) => { e.stopPropagation(); handleSellCar(id); }} 
                    className="px-6 py-3 rounded-xl font-bold text-xs transition-all bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.2)] uppercase tracking-widest backdrop-blur-md"
                 >
                    Sell ({(car.price * 0.8).toLocaleString('en-US')})
                 </button>
              ) : (
                 <button 
                    onClick={(e) => { e.stopPropagation(); handleBuyCar(id); }} 
                    className="px-8 py-3 rounded-xl font-black text-xs transition-all bg-white text-black hover:bg-zinc-200 shadow-[0_0_30px_rgba(255,255,255,0.3)] uppercase tracking-widest"
                 >
                    Purchase
                 </button>
              )}
           </div>
        </div>
      </motion.div>
    </div>
  );
};


// ============================================================================
// MAIN LIFESTYLE TAB COMPONENT
// ============================================================================
export default function LifestyleTab({ balance, energy, maxEnergy, ownedVehicles, setBalance, setEnergy, setOwnedVehicles, saveGameState, showAlert, showConfirm, showAccountSelect, selectedBank, savingsBalance, loanAccountBalance, setSavingsBalance, setLoanAccountBalance, energyBlockUntil }: any) {
   
   const handleBuyFood = async (item: string, cost: number, regen: number) => {
      if (balance < cost) return await showAlert("Insufficient Funds", "You don't have enough liquid funds for this meal.");
      if (energy >= maxEnergy) return await showAlert("Energy Full", "You are already full of energy!");
      
      // Energy Block Logic (Prevents eating after Pizza Party)
      if (Date.now() < energyBlockUntil) {
         const minsLeft = Math.ceil((energyBlockUntil - Date.now()) / 60000);
         return await showAlert("Energy Blocked", `You can't regain energy right now! Your energy is locked for another ${minsLeft} minute(s) due to your recent Corporate Retreat hangover.`);
      }
      
      const newBal = balance - cost;
      const newEnergy = Math.min(maxEnergy, energy + regen);
      setBalance(newBal); 
      setEnergy(newEnergy);
      saveGameState({ bank_balance: newBal, energy: newEnergy });
   };

   const handleBuyCar = async (id: string) => {
      if (!selectedBank) return await showAlert("Bank Account Required", "You must open a bank account in the Banking tab before purchasing luxury vehicles.");

      const car = VEHICLES[id];
      if (ownedVehicles.includes(id)) return await showAlert("Already Owned", "You already own this vehicle!");

      const accounts = [
          { id: "1", initials: "CA", name: "Current Account", details: `Available: $${balance.toLocaleString('en-US', {maximumFractionDigits: 2})}` },
          { id: "2", initials: "SV", name: "Savings Vault", details: `Available: $${savingsBalance.toLocaleString('en-US', {maximumFractionDigits: 2})}` },
          { id: "3", initials: "LA", name: "Loan Account", details: `Available: $${loanAccountBalance.toLocaleString('en-US', {maximumFractionDigits: 2})}` }
      ];

      const accountChoice = await showAccountSelect(
        "Purchase Vehicle",
        `Purchasing ${car.name}`, 
        car.price,
        accounts
      );

      if (!accountChoice) return;

      const newVehicles = [...ownedVehicles, id];
      let updates: any = { owned_vehicles: newVehicles };

      let newBal = balance;
      let newSav = savingsBalance;
      let newLoanAcc = loanAccountBalance;

      if (accountChoice === "1") {
         if (balance < car.price) return await showAlert("Error", `Insufficient liquid funds in Current Account. You need $${car.price.toLocaleString()}.`);
         newBal -= car.price;
         setBalance(newBal);
         updates.bank_balance = newBal;
      } else if (accountChoice === "2") {
         if (savingsBalance < car.price) return await showAlert("Error", `Insufficient funds in Savings Vault. You need $${car.price.toLocaleString()}.`);
         newSav -= car.price;
         setSavingsBalance(newSav);
         updates.savings_balance = newSav;
      } else if (accountChoice === "3") {
         if (loanAccountBalance < car.price) return await showAlert("Error", `Insufficient funds in Loan Account. You need $${car.price.toLocaleString()}.`);
         newLoanAcc -= car.price;
         setLoanAccountBalance(newLoanAcc);
         updates.loan_account_balance = newLoanAcc;
      }

      setOwnedVehicles(newVehicles);
      saveGameState(updates);
      
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
      <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in duration-500 pb-12">
         
         <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-black text-white mb-4 tracking-tight">Lifestyle & Status</h2>
            <p className="text-zinc-400 max-w-xl mx-auto text-sm md:text-base leading-relaxed">Replenish your energy with high-end dining, or buy exotic vehicles to flex your net worth and unlock exclusive networking opportunities.</p>
         </div>

         {/* --- DINING & ENERGY HUB --- */}
         <div className="bg-[#121214] border border-white/5 rounded-[32px] p-8 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none transition-transform duration-700 group-hover:scale-110 group-hover:rotate-12">
               <Utensils className="w-48 h-48 text-orange-400" />
            </div>
            
            <div className="relative z-10 mb-8">
               <h3 className="text-xl font-black text-white flex items-center gap-3">
                  <div className="p-2 bg-orange-500/10 rounded-xl border border-orange-500/20 text-orange-400"><Zap className="w-5 h-5"/></div>
                  Energy Replenishment
               </h3>
               <p className="text-sm text-zinc-500 mt-2">Spend liquid cash to instantly restore your ability to hustle.</p>
            </div>

            <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6">
               <button onClick={() => handleBuyFood('street', 25, 30)} className="bg-black/40 border border-white/10 hover:border-orange-500/50 hover:bg-orange-500/5 p-6 rounded-2xl flex flex-col justify-between group transition-all duration-300 text-left relative overflow-hidden">
                  <div className="flex justify-between items-start mb-6">
                     <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-400 border border-white/5 group-hover:scale-110 group-hover:bg-orange-500/20 group-hover:text-orange-400 transition-all duration-300 shadow-lg">
                        <Coffee className="w-6 h-6"/>
                     </div>
                     <span className="text-yellow-400 text-sm font-black font-mono bg-yellow-500/10 px-3 py-1 rounded-full border border-yellow-500/20 shadow-[0_0_15px_rgba(250,204,21,0.2)]">+30⚡</span>
                  </div>
                  <div>
                     <p className="font-black text-lg text-white mb-1">Street Food</p>
                     <p className="text-xs text-zinc-500 font-mono font-bold">Cost: $25</p>
                  </div>
               </button>

               <button onClick={() => handleBuyFood('restaurant', 150, 60)} className="bg-black/40 border border-white/10 hover:border-orange-500/50 hover:bg-orange-500/5 p-6 rounded-2xl flex flex-col justify-between group transition-all duration-300 text-left relative overflow-hidden">
                  <div className="flex justify-between items-start mb-6">
                     <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-400 border border-white/5 group-hover:scale-110 group-hover:bg-orange-500/20 group-hover:text-orange-400 transition-all duration-300 shadow-lg">
                        <Utensils className="w-6 h-6"/>
                     </div>
                     <span className="text-yellow-400 text-sm font-black font-mono bg-yellow-500/10 px-3 py-1 rounded-full border border-yellow-500/20 shadow-[0_0_15px_rgba(250,204,21,0.2)]">+60⚡</span>
                  </div>
                  <div>
                     <p className="font-black text-lg text-white mb-1">Nice Restaurant</p>
                     <p className="text-xs text-zinc-500 font-mono font-bold">Cost: $150</p>
                  </div>
               </button>

               <button onClick={() => handleBuyFood('michelin', 1500, maxEnergy)} className="bg-black/40 border border-orange-500/30 hover:border-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.1)] hover:shadow-[0_0_40px_rgba(249,115,22,0.2)] p-6 rounded-2xl flex flex-col justify-between group transition-all duration-300 text-left relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="flex justify-between items-start mb-6 relative z-10">
                     <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center text-orange-400 border border-orange-500/30 group-hover:scale-110 transition-all duration-300 shadow-lg">
                        <Trophy className="w-6 h-6"/>
                     </div>
                     <span className="text-yellow-400 text-sm font-black font-mono bg-yellow-500/10 px-3 py-1 rounded-full border border-yellow-500/20 shadow-[0_0_15px_rgba(250,204,21,0.4)]">MAX⚡</span>
                  </div>
                  <div className="relative z-10">
                     <p className="font-black text-lg text-white mb-1">Michelin Star Meal</p>
                     <p className="text-xs text-orange-400/80 font-mono font-bold">Cost: $1,500</p>
                  </div>
               </button>
            </div>
         </div>

         {/* --- SHOWROOM DEALERSHIP --- */}
         <div className="pt-8">
            <div className="flex items-center justify-between mb-8">
               <div>
                  <h3 className="text-2xl font-black text-white flex items-center gap-3">
                     <Car className="w-6 h-6 text-indigo-400"/> Luxury Dealership
                  </h3>
                  <p className="text-sm text-zinc-500 mt-2">Vehicles contribute to your Net Worth and unlock exclusive networking tiers.</p>
               </div>
               <div className="hidden sm:flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 px-4 py-2 rounded-xl text-indigo-400 text-[10px] font-bold uppercase tracking-widest">
                  <ShieldCheck className="w-4 h-4" /> Verified Seller
               </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               {Object.entries(VEHICLES).map(([id, car]) => (
                  <InteractiveCarCard 
                     key={id} 
                     id={id} 
                     car={car} 
                     isOwned={ownedVehicles.includes(id)} 
                     handleBuyCar={handleBuyCar} 
                     handleSellCar={handleSellCar} 
                  />
               ))}
            </div>
         </div>
      </div>
   );
}