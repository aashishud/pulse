"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Activity, Globe, MapPin, Zap, ChevronDown, Loader2, LogOut, X, Landmark, TrendingUp, ShoppingBag, Briefcase, Lock, Building2, RefreshCw, AlertCircle, Check, Moon, Menu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { LOCATIONS, REAL_ESTATE, VEHICLES, CRYPTO_ASSETS, STOCK_ASSETS } from '@/lib/network-data';
import { ActiveJobModal } from '@/components/network/SharedUI';
import OverviewTab from '@/components/network/OverviewTab';
import BankingTab from '@/components/network/BankingTab';
import RealEstateTab from '@/components/network/RealEstateTab';
import LifestyleTab from '@/components/network/LifestyleTab';
import MarketsTab from '@/components/network/MarketsTab';
import PulseLogo from '@/components/PulseLogo';

// --- TABS CONFIGURATION ---
const TABS = [
  { id: 'overview', icon: Activity, label: 'Overview' },
  { id: 'banking', icon: Landmark, label: 'Banking' },
  { id: 'markets', icon: TrendingUp, label: 'Stock Markets' },
  { id: 'real_estate', icon: Globe, label: 'Real Estate' },
  { id: 'lifestyle', icon: ShoppingBag, label: 'Lifestyle & Cars' }
];

const MOBILE_TABS = [
  { id: 'overview', icon: Activity, label: 'Overview' },
  { id: 'banking', icon: Landmark, label: 'Banking' },
  { id: 'markets', icon: TrendingUp, label: 'Markets' },
  { id: 'lifestyle', icon: ShoppingBag, label: 'Lifestyle' }
];

// --- CUSTOM COMPONENT: Account Selector UI ---
const AccountSelectorUI = ({ modal, closeModal }: { modal: any, closeModal: (result: any) => void }) => {
   const [selectedId, setSelectedId] = useState(modal.accounts?.[0]?.id);

   return (
       <div className="bg-[#121214] border border-white/10 rounded-[32px] w-full max-w-sm p-6 sm:p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col space-y-6 animate-in zoom-in-95 duration-200">
           <div className="text-center">
               <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-2">{modal.title}</p>
               <p className="mt-1 text-4xl font-black tracking-tight text-white sm:text-5xl">
                 ${modal.amount?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
               </p>
               <p className="text-sm text-zinc-400 mt-2">{modal.message}</p>
           </div>

           <div className="flex-grow">
               <p className="mb-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Choose Account</p>
               <div className="space-y-3">
                  {modal.accounts?.map((acc: any) => {
                     const isSelected = selectedId === acc.id;
                     return (
                        <div key={acc.id} onClick={() => setSelectedId(acc.id)} className={`relative flex cursor-pointer items-center space-x-4 rounded-2xl p-4 transition-all duration-300 ${isSelected ? 'text-white' : 'bg-black/20 hover:bg-black/40 text-zinc-400 border border-white/5 hover:border-white/10'}`}>
                           {isSelected && (
                              <motion.div layoutId="sel-bg" className="absolute inset-0 z-0 rounded-2xl bg-indigo-600 shadow-[0_0_20px_rgba(99,102,241,0.3)]" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{type:"spring", stiffness:300, damping:30}} />
                           )}
                           <div className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold text-sm border shadow-sm ${isSelected ? 'bg-indigo-500/20 border-indigo-400/30 text-white' : 'bg-white/5 border-white/10 text-zinc-500'}`}>
                              {acc.initials}
                           </div>
                           <div className="relative z-10 flex-grow">
                              <p className={`font-bold text-sm ${isSelected ? 'text-white' : 'text-zinc-300'}`}>{acc.name}</p>
                              <p className={`text-xs ${isSelected ? 'text-indigo-200' : 'text-zinc-500'}`}>{acc.details}</p>
                           </div>
                           <div className="relative z-10 h-6 w-6">
                              <AnimatePresence>
                                 {isSelected && (
                                    <motion.div initial={{scale:0.5, opacity:0}} animate={{scale:1, opacity:1}} exit={{scale:0.5, opacity:0}} transition={{type:'spring', stiffness:400, damping:20}} className="flex h-full w-full items-center justify-center rounded-full bg-white text-indigo-600 shadow-md">
                                       <Check className="h-4 w-4" strokeWidth={3} />
                                    </motion.div>
                                 )}
                              </AnimatePresence>
                              {!isSelected && <div className="h-6 w-6 rounded-full border-2 border-white/10" />}
                           </div>
                        </div>
                     )
                  })}
               </div>
           </div>

           <div className="flex gap-3">
               <button onClick={() => closeModal(null)} className="w-1/3 rounded-xl py-4 text-xs font-bold text-zinc-400 hover:text-white hover:bg-white/5 transition-colors border border-transparent hover:border-white/10">Cancel</button>
               <button onClick={() => closeModal(selectedId)} className="w-2/3 rounded-xl py-4 text-sm font-black tracking-widest uppercase bg-white text-black hover:bg-zinc-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.1)]">Confirm</button>
           </div>
       </div>
   );
};
// ----------------------------------------------

export default function NetworkDashboard() {
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [pulseProfile, setPulseProfile] = useState<any>(null);
  
  const [accountNumber, setAccountNumber] = useState<string | null>(null);
  const [balance, setBalance] = useState(0);
  const [savingsBalance, setSavingsBalance] = useState(0);
  const [loanAccountBalance, setLoanAccountBalance] = useState(0);
  const [loanBalance, setLoanBalance] = useState(0); 

  const [netWorthHistory, setNetWorthHistory] = useState<number[]>([]);
  const [energy, setEnergy] = useState(100);
  const [fico, setFico] = useState(700);
  const [playerPath, setPlayerPath] = useState<string | null>(null);
  const [pathUpdatedAt, setPathUpdatedAt] = useState<string | null>(null);
  const [freePathSwitchUsed, setFreePathSwitchUsed] = useState<boolean>(false);
  const [selectedBank, setSelectedBank] = useState<string | null>(null);
  
  // SHARED PROGRESSION LEVEL (Corporate Level / Hustler Street Rep)
  const [corporateLevel, setCorporateLevel] = useState(1);
  
  const [currentLocation, setCurrentLocation] = useState('bali');
  const [ownedProperties, setOwnedProperties] = useState<string[]>([]);
  const [ownedVehicles, setOwnedVehicles] = useState<string[]>([]);
  const [portfolio, setPortfolio] = useState<Record<string, any>>({});
  
  // THE NEW STARTUP DATA MODEL WITH BRANDING AND EQUITY AND BOOST
  const [startupData, setStartupData] = useState<any>({ workload: 50, payroll: 50, morale: 100, is_strike: false, level: 1, companyName: "", ticker: "", equityOwned: 100, moraleBoostUntil: 0 });
  
  // DYNAMIC MAX ENERGY (Tracks Founder Level if on Founder Path, otherwise tracks Corporate Level)
  const activeLevel = playerPath === 'founder' ? (startupData.level || 1) : corporateLevel;
  const maxEnergy = 100 + ((activeLevel - 1) * 50); // scales to 250+

  const [pendingSalary, setPendingSalary] = useState(0); 
  const [lastLocalSync, setLastLocalSync] = useState<number | null>(null);
  const [lastEnergySyncState, setLastEnergySyncState] = useState<number | null>(null);
  
  // TAX & SLEEP STATES
  const [nextTaxTime, setNextTaxTime] = useState<number | null>(null);
  const [taxCycleMinutes, setTaxCycleMinutes] = useState<number>(10);
  const [lazinessPenaltyUntil, setLazinessPenaltyUntil] = useState<number>(0);

  // MACRO ECONOMY STATE
  const [marketEvent, setMarketEvent] = useState<{type: 'boom' | 'recession' | 'labor_shortage' | 'none', name: string, message: string, expiresAt: number} | null>(null);

  const [activeTab, setActiveTab] = useState('overview');
  const [activeJob, setActiveJob] = useState<any>(null);
  const [showPathSelection, setShowPathSelection] = useState(false);
  const [transferAmount, setTransferAmount] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // === CUSTOM MODAL SYSTEM ===
  const [modal, setModal] = useState<{isOpen: boolean, type: 'alert'|'confirm'|'prompt'|'account-select', title: string, message: string, placeholder: string, resolve: any, accounts?: any[], amount?: number}>({
     isOpen: false, type: 'alert', title: '', message: '', placeholder: '', resolve: null
  });
  const [modalInput, setModalInput] = useState("");

  const showAlert = (title: string, message: string) => {
     return new Promise<void>((resolve) => {
        setModal({ isOpen: true, type: 'alert', title, message, placeholder: '', resolve });
     });
  };

  const showConfirm = (title: string, message: string) => {
     return new Promise<boolean>((resolve) => {
        setModal({ isOpen: true, type: 'confirm', title, message, placeholder: '', resolve });
     });
  };

  const showPrompt = (title: string, message: string, placeholder = "") => {
     return new Promise<string | null>((resolve) => {
        setModalInput("");
        setModal({ isOpen: true, type: 'prompt', title, message, placeholder, resolve });
     });
  };

  const showAccountSelect = (title: string, message: string, amount: number, accounts: any[]) => {
      return new Promise<string | null>((resolve) => {
         setModal({ isOpen: true, type: 'account-select', title, message, placeholder: '', resolve, accounts, amount });
      });
  };

  const closeModal = (result: any) => {
     if (modal.resolve) modal.resolve(result);
     setModal(prev => ({ ...prev, isOpen: false }));
  };
  // ==========================

  // REFS for intervals
  const displaySalaryRef = useRef(pendingSalary);
  const startupDataRef = useRef(startupData);
  const balanceRef = useRef(balance);
  const ficoRef = useRef(fico);
  const ownedPropertiesRef = useRef(ownedProperties);
  const currentLocationRef = useRef(currentLocation);
  const nextTaxTimeRef = useRef(nextTaxTime);
  const lazinessPenaltyUntilRef = useRef(lazinessPenaltyUntil);
  const taxCycleMinutesRef = useRef(taxCycleMinutes);
  const marketEventRef = useRef(marketEvent);

  useEffect(() => { displaySalaryRef.current = pendingSalary; }, [pendingSalary]);
  useEffect(() => { startupDataRef.current = startupData; }, [startupData]);
  useEffect(() => { balanceRef.current = balance; }, [balance]);
  useEffect(() => { ficoRef.current = fico; }, [fico]);
  useEffect(() => { ownedPropertiesRef.current = ownedProperties; }, [ownedProperties]);
  useEffect(() => { currentLocationRef.current = currentLocation; }, [currentLocation]);
  useEffect(() => { nextTaxTimeRef.current = nextTaxTime; }, [nextTaxTime]);
  useEffect(() => { lazinessPenaltyUntilRef.current = lazinessPenaltyUntil; }, [lazinessPenaltyUntil]);
  useEffect(() => { taxCycleMinutesRef.current = taxCycleMinutes; }, [taxCycleMinutes]);
  useEffect(() => { marketEventRef.current = marketEvent; }, [marketEvent]);

  const locStats = LOCATIONS[currentLocation] || LOCATIONS.bali;
  
  const realEstateValue = ownedProperties.reduce((sum, propId) => {
      for (const city in REAL_ESTATE) {
         const prop = REAL_ESTATE[city].find(p => p.id === propId);
         if (prop) return sum + prop.price;
      }
      return sum;
  }, 0);
  
  const vehicleValue = ownedVehicles.reduce((sum, vId) => sum + (VEHICLES[vId]?.price || 0) * 0.8, 0); 
  
  const [livePortfolioValue, setLivePortfolioValue] = useState(0);
  
  useEffect(() => {
     const fetchPortfolioValue = async () => {
        if (document.hidden) return;

        if (Object.keys(portfolio).length === 0) {
           setLivePortfolioValue(0);
           return;
        }
        
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

           let val = 0;
           
           [...Object.entries(CRYPTO_ASSETS), ...Object.entries(STOCK_ASSETS)].forEach(([ticker, asset]) => {
              if (portfolio[ticker]?.shares) {
                 const item = combinedData.find((d: any) => d.symbol === asset.symbol);
                 if (item && !isNaN(parseFloat(item.price))) {
                    val += portfolio[ticker].shares * parseFloat(item.price);
                 }
              }
           });
           
           setLivePortfolioValue(val);
        } catch(e) {
           console.error("Portfolio sync error:", e);
        }
     };
     
     fetchPortfolioValue();
     const int = setInterval(fetchPortfolioValue, 10000);
     return () => clearInterval(int);
  }, [portfolio]);

  const assetValue = realEstateValue + vehicleValue + livePortfolioValue;
  const totalNetWorth = Number(balance) + Number(savingsBalance) + Number(loanAccountBalance) + assetValue - Number(loanBalance);

  useEffect(() => {
     setNetWorthHistory(prev => {
        const next = [...prev, totalNetWorth];
        if (next.length > 20) next.shift(); 
        return next;
     });
  }, [totalNetWorth]);

  const getCorporateRole = (level: number) => {
    let basePayPerMinute = 0.50;
    let title = "Junior Developer";
    if (level === 2) { title = "Mid-Level Developer"; basePayPerMinute = 1.50; }
    if (level === 3) { title = "Senior Developer"; basePayPerMinute = 4.00; }
    if (level === 4) { title = "Lead Developer"; basePayPerMinute = 10.00; }
    if (level >= 5) { title = `Executive Lv.${level}`; basePayPerMinute = 10.00 + ((level - 4) * 5); }
    return { title, payPerMinute: basePayPerMinute * locStats.multiplier };
  };
  const currentRole = getCorporateRole(corporateLevel);
  const monthlySalaryTarget = currentRole.payPerMinute * 450; 

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) { router.push("/"); return; }

      try {
        const q = query(collection(db, "users"), where("owner_uid", "==", user.uid));
        const querySnapshot = await getDocs(q);
        let username = "Agent";
        if (!querySnapshot.empty) {
          const profileData = querySnapshot.docs[0].data();
          setPulseProfile(profileData);
          username = profileData.username || profileData.displayName || "Agent";
        }

        const res = await fetch("/api/bank", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ firebaseUid: user.uid, username }) });
        const dbData = await res.json();
        
        if (dbData.data) {
          const initialBal = dbData.data.bank_balance != null ? Number(dbData.data.bank_balance) : 0;
          setBalance(initialBal);
          
          setFico(dbData.data.fico_score != null ? Number(dbData.data.fico_score) : 700);
          setPlayerPath(dbData.data.player_path || null);
          setPathUpdatedAt(dbData.data.path_updated_at || null);
          setSelectedBank(dbData.data.selected_bank || null);
          setAccountNumber(dbData.data.account_number || null);
          setSavingsBalance(dbData.data.savings_balance != null ? Number(dbData.data.savings_balance) : 0);
          setLoanAccountBalance(dbData.data.loan_account_balance != null ? Number(dbData.data.loan_account_balance) : 0);
          setLoanBalance(dbData.data.loan_balance != null ? Number(dbData.data.loan_balance) : 0);
          setCurrentLocation(dbData.data.location || 'bali');
          
          const localTaxData = JSON.parse(localStorage.getItem('pulse_tax_state') || '{}');
          
          const dbNextTaxAt = localTaxData.next_tax_at != null ? Number(localTaxData.next_tax_at) : Date.now() + 10 * 60000;
          const dbTaxCycle = localTaxData.tax_cycle_minutes != null ? Number(localTaxData.tax_cycle_minutes) : 10;
          const dbLaziness = localTaxData.laziness_penalty_until != null ? Number(localTaxData.laziness_penalty_until) : 0;
          const dbFreeSwitch = localTaxData.free_path_switch_used != null ? Boolean(localTaxData.free_path_switch_used) : false;

          setNextTaxTime(dbNextTaxAt);
          setTaxCycleMinutes(dbTaxCycle);
          setLazinessPenaltyUntil(dbLaziness);
          setFreePathSwitchUsed(dbFreeSwitch);

          const parseJSON = (data: any, fallback: any) => {
             if (!data) return fallback;
             return typeof data === 'string' ? JSON.parse(data) : data;
          };
          setOwnedProperties(parseJSON(dbData.data.owned_properties, []));
          setOwnedVehicles(parseJSON(dbData.data.owned_vehicles, []));
          setPortfolio(parseJSON(dbData.data.portfolio, {}));

          // PARSE NEW STARTUP DATA
          const sData = parseJSON(dbData.data.startup_data, { workload: 50, payroll: 50, morale: 100, is_strike: false, level: 1, companyName: "", ticker: "", equityOwned: 100, moraleBoostUntil: 0 });
          if (sData.equityOwned === undefined) sData.equityOwned = 100;
          if (sData.companyName === undefined) sData.companyName = "";
          if (sData.ticker === undefined) sData.ticker = "";
          if (sData.moraleBoostUntil === undefined) sData.moraleBoostUntil = 0;
          setStartupData(sData);

          const level = dbData.data.corporate_level != null ? Number(dbData.data.corporate_level) : 1;
          setCorporateLevel(level);
          
          // Apply dynamic energy logic immediately on load
          const effectiveLoadedLevel = dbData.data.player_path === 'founder' ? (sData.level || 1) : level;
          const dynamicMaxEnergy = 100 + ((effectiveLoadedLevel - 1) * 50);
          let loadedEnergy = dbData.data.energy != null ? Number(dbData.data.energy) : dynamicMaxEnergy;
          
          const dbSalary = dbData.data.pending_salary != null ? Number(dbData.data.pending_salary) : 0;
          
          let offlineEarnings = 0;
          let syncAnchor = Date.now();

          if ((dbData.data.player_path === 'corporate' || dbData.data.player_path === 'founder') && dbData.data.last_salary_sync) {
              const lastSync = new Date(dbData.data.last_salary_sync).getTime();
              const minutesOffline = Math.floor((Date.now() - lastSync) / 60000);
              
              if (minutesOffline > 0 && minutesOffline < 525600) { 
                 if (dbData.data.player_path === 'corporate') {
                     const basePay = level >= 5 ? 10 + ((level - 4) * 5) : [0.5, 1.5, 4, 10][level-1];
                     const currentLocMulti = LOCATIONS[dbData.data.location || 'bali'].multiplier;
                     offlineEarnings = minutesOffline * (basePay * currentLocMulti);
                 } else if (dbData.data.player_path === 'founder') {
                     const levelMult = sData.level || 1;
                     const locMulti = LOCATIONS[dbData.data.location || 'bali'].multiplier;
                     const baseOpCost = 100 * locMulti * levelMult;
                     
                     // Handle Offline Boost Logic perfectly
                     let minutesBoosted = 0;
                     let minutesUnboosted = minutesOffline;
                     
                     if (sData.moraleBoostUntil && sData.moraleBoostUntil > lastSync) {
                         const boostMinsLeft = Math.floor((sData.moraleBoostUntil - lastSync) / 60000);
                         if (boostMinsLeft >= minutesOffline) {
                             minutesBoosted = minutesOffline;
                             minutesUnboosted = 0;
                         } else {
                             minutesBoosted = boostMinsLeft;
                             minutesUnboosted = minutesOffline - boostMinsLeft;
                         }
                     }

                     let finalMorale = sData.morale;
                     let didStrikeOffline = sData.is_strike;

                     // Calculate Boosted Period (100% Morale, No Strikes)
                     if (minutesBoosted > 0) {
                         finalMorale = 100;
                         didStrikeOffline = false;
                         const gross = sData.workload * 15 * locMulti * levelMult;
                         const cost = (sData.payroll * 10 * locMulti * levelMult) + baseOpCost;
                         let rawNet = (gross - cost);
                         if (rawNet > 0) rawNet *= (sData.equityOwned / 100);
                         offlineEarnings += minutesBoosted * rawNet;
                     }

                     // Calculate Unboosted Period
                     if (minutesUnboosted > 0) {
                         let moraleChangePerMin = (sData.payroll - sData.workload) * 0.5;
                         if (sData.workload > 50) moraleChangePerMin -= (sData.workload - 50) * 1.0;
                         
                         finalMorale = finalMorale + (moraleChangePerMin * minutesUnboosted);
                         
                         if (finalMorale <= 0 && !didStrikeOffline) {
                             didStrikeOffline = true;
                             finalMorale = 0;
                         } else if (finalMorale >= 50 && didStrikeOffline) {
                             didStrikeOffline = false;
                             finalMorale = 50;
                         }
                         
                         finalMorale = Math.max(0, Math.min(100, finalMorale));

                         if (!didStrikeOffline) {
                            const gross = sData.workload * 15 * locMulti * levelMult;
                            const cost = (sData.payroll * 10 * locMulti * levelMult) + baseOpCost;
                            let rawNet = (gross - cost);
                            if (rawNet > 0) rawNet *= (sData.equityOwned / 100);
                            offlineEarnings += minutesUnboosted * rawNet;
                         } else {
                            const strikeCost = (sData.payroll * 20 * locMulti * levelMult) + baseOpCost;
                            offlineEarnings += minutesUnboosted * -strikeCost;
                         }
                     }
                     
                     setStartupData({...sData, morale: finalMorale, is_strike: didStrikeOffline});
                 }
                 syncAnchor = lastSync + (minutesOffline * 60000);
              } else {
                 syncAnchor = lastSync;
              }
          }

          const totalLoadedSalary = dbSalary + offlineEarnings;
          setPendingSalary(totalLoadedSalary);
          setLastLocalSync(syncAnchor);
          if (offlineEarnings !== 0) saveGameState({ pending_salary: totalLoadedSalary, last_salary_sync: new Date(syncAnchor).toISOString() });

          let energySyncAnchor = Date.now();
          if (dbData.data.last_energy_sync) {
              const lastEnergySync = new Date(dbData.data.last_energy_sync).getTime();
              const minutesOffline = Math.floor((Date.now() - lastEnergySync) / 60000);
              if (minutesOffline > 0 && loadedEnergy < dynamicMaxEnergy) {
                 const intervals = Math.floor(minutesOffline / 2);
                 loadedEnergy = Math.min(dynamicMaxEnergy, loadedEnergy + (intervals * 5));
                 energySyncAnchor = lastEnergySync + (intervals * 120000);
              } else { energySyncAnchor = lastEnergySync; }
          }
          setEnergy(loadedEnergy);
          setLastEnergySyncState(energySyncAnchor);
          if (loadedEnergy !== (dbData.data.energy != null ? Number(dbData.data.energy) : dynamicMaxEnergy)) saveGameState({ energy: loadedEnergy, last_energy_sync: new Date(energySyncAnchor).toISOString() });
        }
      } catch (error) { console.error(error); } finally { setLoading(false); }
    });
    return () => unsubscribe();
  }, [router]);

  const saveGameState = async (updates: any) => {
    if (!auth.currentUser) return;
    try {
      const safeUpdates = { ...updates };
      if (safeUpdates.bank_balance !== undefined) safeUpdates.bank_balance = Math.floor(Number(safeUpdates.bank_balance));
      if (safeUpdates.savings_balance !== undefined) safeUpdates.savings_balance = Math.floor(Number(safeUpdates.savings_balance));
      if (safeUpdates.loan_account_balance !== undefined) safeUpdates.loan_account_balance = Math.floor(Number(safeUpdates.loan_account_balance));
      if (safeUpdates.loan_balance !== undefined) safeUpdates.loan_balance = Math.floor(Number(safeUpdates.loan_balance));
      if (safeUpdates.fico_score !== undefined) safeUpdates.fico_score = Math.floor(Number(safeUpdates.fico_score));
      if (safeUpdates.pending_salary !== undefined) safeUpdates.pending_salary = Number(Number(safeUpdates.pending_salary).toFixed(2));
      
      const localTaxUpdates: any = {};
      if (safeUpdates.next_tax_at !== undefined) { localTaxUpdates.next_tax_at = Number(safeUpdates.next_tax_at); delete safeUpdates.next_tax_at; }
      if (safeUpdates.tax_cycle_minutes !== undefined) { localTaxUpdates.tax_cycle_minutes = Number(safeUpdates.tax_cycle_minutes); delete safeUpdates.tax_cycle_minutes; }
      if (safeUpdates.laziness_penalty_until !== undefined) { localTaxUpdates.laziness_penalty_until = Number(safeUpdates.laziness_penalty_until); delete safeUpdates.laziness_penalty_until; }
      if (safeUpdates.free_path_switch_used !== undefined) { localTaxUpdates.free_path_switch_used = Boolean(safeUpdates.free_path_switch_used); delete safeUpdates.free_path_switch_used; }
      
      if (Object.keys(localTaxUpdates).length > 0) {
          const currentLocalData = JSON.parse(localStorage.getItem('pulse_tax_state') || '{}');
          localStorage.setItem('pulse_tax_state', JSON.stringify({ ...currentLocalData, ...localTaxUpdates }));
      }

      if (safeUpdates.owned_properties !== undefined) safeUpdates.owned_properties = JSON.stringify(safeUpdates.owned_properties);
      if (safeUpdates.owned_vehicles !== undefined) safeUpdates.owned_vehicles = JSON.stringify(safeUpdates.owned_vehicles);
      if (safeUpdates.portfolio !== undefined) safeUpdates.portfolio = JSON.stringify(safeUpdates.portfolio);
      if (safeUpdates.startup_data !== undefined) safeUpdates.startup_data = JSON.stringify(safeUpdates.startup_data);

      await fetch("/api/bank", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ firebaseUid: auth.currentUser.uid, updates: safeUpdates }) });
    } catch (error) { console.error("Failed to sync game state:", error); }
  };

  // --- AUTOMATED 10-MINUTE TAX UPKEEP LOOP ---
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      if (nextTaxTimeRef.current && now >= nextTaxTimeRef.current) {
         const locId = currentLocationRef.current;
         const locStats = LOCATIONS[locId] || LOCATIONS.bali;
         const ownsHome = ownedPropertiesRef.current.some((id: string) => REAL_ESTATE[locId]?.find((p: any) => p.id === id));
         const rent = ownsHome ? 0 : locStats.rent;
         const upkeepCost = rent + locStats.living;

         let newBal = balanceRef.current - upkeepCost;
         let newFico = ficoRef.current;
         
         if (newBal < 0) {
             newFico = Math.max(300, newFico - 20); // Penalty
             newBal = 0;
             if (balanceRef.current <= 0) {
                 showAlert("Upkeep Failed", `You couldn't afford your $${upkeepCost} living expenses. FICO score dropped by 20 points!`);
             }
         }
         
         setBalance(newBal);
         setFico(newFico);
         
         const newNextTax = now + 10 * 60000; 
         nextTaxTimeRef.current = newNextTax; 
         setTaxCycleMinutes(10);
         setNextTaxTime(newNextTax);
         
         saveGameState({
             bank_balance: newBal,
             fico_score: newFico,
             tax_cycle_minutes: 10,
             next_tax_at: newNextTax
         });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // --- GLOBAL MACRO-ECONOMY EVENT LOOP (BALANCED BY LEVEL) ---
  useEffect(() => {
      if (playerPath !== 'founder') return;
      const eventInterval = setInterval(() => {
          const now = Date.now();
          const level = startupDataRef.current?.level || 1;

          if (!marketEventRef.current || now > marketEventRef.current.expiresAt) {
              const roll = Math.random();
              
              if (level < 5) {
                 // Early Game: Gentle environment, only positive events
                 if (roll < 0.15) {
                    setMarketEvent({ type: 'boom', name: 'TECH BOOM', message: 'Consumer spending surges! Gross Revenue +50%', expiresAt: now + (3 * 60000) });
                 } else {
                    setMarketEvent(null);
                 }
              } else {
                 // Late Game: Ruthless environment, positive and negative events
                 if (roll < 0.15) {
                    setMarketEvent({ type: 'boom', name: 'TECH BOOM', message: 'Consumer spending surges! Gross Revenue +50%', expiresAt: now + (3 * 60000) });
                 } else if (roll < 0.30) {
                    setMarketEvent({ type: 'recession', name: 'MARKET DOWNTURN', message: 'Investors are pulling out. Gross Revenue -30%', expiresAt: now + (3 * 60000) });
                 } else if (roll < 0.40) {
                    setMarketEvent({ type: 'labor_shortage', name: 'LABOR SHORTAGE', message: 'Workers demand higher pay. Payroll Costs +40%', expiresAt: now + (3 * 60000) });
                 } else {
                    setMarketEvent(null);
                 }
              }
          }
      }, 60000);
      return () => clearInterval(eventInterval);
  }, [playerPath]);

  // --- PASSIVE INCOME EARNINGS LOOP ---
  useEffect(() => {
    if ((playerPath !== 'corporate' && playerPath !== 'founder') || !lastLocalSync) return;
    
    let currentSync = lastLocalSync;

    const interval = setInterval(() => {
      const now = Date.now();
      const secondsPassed = Math.floor((now - currentSync) / 1000);
      
      if (secondsPassed >= 1) {
          let netEarnings = 0;
          const isPenalized = now < lazinessPenaltyUntilRef.current;
          const evt = marketEventRef.current;
          
          if (!isPenalized) {
              if (playerPath === 'corporate') {
                 netEarnings = secondsPassed * (currentRole.payPerMinute / 60);
              } 
              else if (playerPath === 'founder' && startupDataRef.current?.companyName) {
                 const sData = startupDataRef.current;
                 const levelMult = sData.level || 1;
                 const locMulti = LOCATIONS[currentLocation]?.multiplier || 1;
                 const baseOpCost = 100 * locMulti * levelMult;

                 let grossMult = 1;
                 let payrollCostMult = 1;
                 if (evt && now < evt.expiresAt) {
                     if (evt.type === 'boom') grossMult = 1.5;
                     if (evt.type === 'recession') grossMult = 0.7;
                     if (evt.type === 'labor_shortage') payrollCostMult = 1.4;
                 }

                 if (!sData.is_strike) {
                    const gross = sData.workload * 15 * locMulti * levelMult * grossMult;
                    const cost = (sData.payroll * 10 * locMulti * levelMult * payrollCostMult) + baseOpCost;
                    
                    let rawProfitPerSec = (gross - cost) / 60;
                    if (rawProfitPerSec > 0) rawProfitPerSec *= (sData.equityOwned / 100);

                    netEarnings = secondsPassed * rawProfitPerSec;
                 } else {
                    const strikeCost = (sData.payroll * 20 * locMulti * levelMult * payrollCostMult) + baseOpCost;
                    netEarnings = secondsPassed * (-strikeCost / 60); 
                 }
              }
          }

          if (!isPenalized && playerPath === 'founder' && startupDataRef.current?.companyName) {
             const sData = startupDataRef.current;
             const isBoosted = Date.now() < (sData.moraleBoostUntil || 0);

             if (isBoosted) {
                 // RETREAT ACTIVE: Lock Morale at 100!
                 if (sData.morale !== 100 || sData.is_strike) {
                    setStartupData({ ...sData, morale: 100, is_strike: false });
                 }
             } else {
                 // NORMAL MORALE DRAIN
                 let moraleChangePerMin = (sData.payroll - sData.workload) * 0.5;
                 if (sData.workload > 50) {
                     moraleChangePerMin -= (sData.workload - 50) * 1.0; 
                 }
                 let moraleChange = secondsPassed * (moraleChangePerMin / 60);
                 
                 let newMorale = sData.morale + moraleChange;
                 newMorale = Math.max(0, Math.min(100, newMorale));
                 
                 let newStrike = sData.is_strike;
                 if (newMorale <= 0 && !newStrike) {
                    newStrike = true;
                    showAlert("🚨 WORKER STRIKE! 🚨", "Your employees have walked out due to low morale! Production has halted, but you are still bleeding rent and payroll expenses!");
                 } else if (newMorale >= 50 && newStrike) {
                    newStrike = false;
                    showAlert("✅ Strike Resolved", "Your employees have returned to work.");
                 }

                 if (newMorale !== sData.morale || newStrike !== sData.is_strike) {
                    const newSData = { ...sData, morale: newMorale, is_strike: newStrike };
                    setStartupData(newSData);
                 }
             }
          }

          setPendingSalary(prev => Number(prev) + netEarnings);
          currentSync += secondsPassed * 1000;
      }
    }, 1000); 
    
    return () => clearInterval(interval);
  }, [playerPath, currentRole.payPerMinute, lastLocalSync, currentLocation]);

  useEffect(() => {
    if (playerPath !== 'corporate' && playerPath !== 'founder') return;
    const saveInterval = setInterval(() => {
        if (document.hidden) return;
        saveGameState({ pending_salary: displaySalaryRef.current, startup_data: startupDataRef.current, last_salary_sync: new Date().toISOString() });
    }, 60000);
    return () => clearInterval(saveInterval);
  }, [playerPath]);

  // --- SLEEP SYSTEM ---
  const handleSleep = async () => {
     const now = Date.now();
     if (now < lazinessPenaltyUntilRef.current) {
         const minsLeft = Math.ceil((lazinessPenaltyUntilRef.current - now) / 60000);
         return await showAlert("Laziness Penalty Active", `You slept too much! Your earnings are paused for another ${minsLeft} minute(s). Wake up!`);
     }

     let nextCycle = taxCycleMinutesRef.current;
     if (nextCycle === 10) nextCycle = 7;
     else if (nextCycle === 7) nextCycle = 5;
     else if (nextCycle === 5) nextCycle = 3;
     else if (nextCycle === 3) nextCycle = 1;
     else if (nextCycle <= 1) {
         const penaltyTime = now + 5 * 60000;
         const newNextTax = now + 10 * 60000;
         nextTaxTimeRef.current = newNextTax; 
         setLazinessPenaltyUntil(penaltyTime);
         setTaxCycleMinutes(10); 
         setEnergy(maxEnergy);
         setNextTaxTime(newNextTax);
         saveGameState({ energy: maxEnergy, laziness_penalty_until: penaltyTime, tax_cycle_minutes: 10, next_tax_at: newNextTax });
         return await showAlert("Laziness Penalty!", "You slept too much! Your passive income has been completely paused for 5 minutes, and your tax cycle has reset back to 10 minutes.");
     }

     const newNextTax = now + nextCycle * 60000;
     nextTaxTimeRef.current = newNextTax; 
     setEnergy(maxEnergy);
     setTaxCycleMinutes(nextCycle);
     setNextTaxTime(newNextTax);
     saveGameState({ energy: maxEnergy, tax_cycle_minutes: nextCycle, next_tax_at: newNextTax });
     await showAlert("Well Rested", `You slept and restored ${maxEnergy} Energy!\n\nHowever, because you are sleeping through the day, your next tax cut will arrive in just ${nextCycle} minute(s).`);
  };

  const handleBankSelect = async (bankId: string | null) => {
     setSelectedBank(bankId);
     const updates: any = { selected_bank: bankId };
     if (bankId && !accountNumber) {
        const newAccNum = Array.from({length: 25}, () => Math.floor(Math.random() * 10)).join('');
        setAccountNumber(newAccNum);
        updates.account_number = newAccNum;
     }
     saveGameState(updates);
     if(bankId) await showAlert("Account Opened", "Account successfully opened! Welcome to " + bankId.toUpperCase());
  };

  const handleTransfer = async (direction: 'to_savings' | 'to_current', newBal?: number, newSav?: number) => {
     if (newBal !== undefined && newSav !== undefined) {
         setBalance(newBal);
         setSavingsBalance(newSav);
         saveGameState({ bank_balance: newBal, savings_balance: newSav });
         return;
     }

     const amount = parseFloat(transferAmount);
     if (isNaN(amount) || amount <= 0) return await showAlert("Error", "Please enter a valid amount.");

     const currentLiquid = Number(balance);
     const currentSav = Number(savingsBalance);

     if (direction === 'to_savings') {
        if (currentLiquid < amount) return await showAlert("Error", "Insufficient liquid funds.");
        const nextBal = currentLiquid - amount;
        const nextSav = currentSav + amount;
        setBalance(nextBal);
        setSavingsBalance(nextSav);
        saveGameState({ bank_balance: nextBal, savings_balance: nextSav });
     } else {
        if (currentSav < amount) return await showAlert("Error", "Insufficient savings funds.");
        const nextBal = currentLiquid + amount;
        const nextSav = currentSav - amount;
        setBalance(nextBal);
        setSavingsBalance(nextSav);
        saveGameState({ bank_balance: nextBal, savings_balance: nextSav });
     }
     setTransferAmount("");
  };

  const handleTakeLoan = async (amountStr: string) => {
     const amount = parseFloat(amountStr);
     if (isNaN(amount) || amount <= 0) return await showAlert("Error", "Invalid amount.");
     
     const maxLoan = selectedBank === 'summit_one' ? fico * 200 : fico * 100;
     const availableCredit = Math.max(0, maxLoan - loanBalance);
     
     if (amount > availableCredit) return await showAlert("Credit Limit Exceeded", `You can only borrow up to $${availableCredit.toLocaleString('en-US')}.`);
     
     const newLoanAccBal = Number(loanAccountBalance) + amount;
     const newLoanDebt = Number(loanBalance) + amount;
     
     setLoanAccountBalance(newLoanAccBal);
     setLoanBalance(newLoanDebt);
     saveGameState({ loan_account_balance: newLoanAccBal, loan_balance: newLoanDebt });
     await showAlert("Loan Approved", `$${amount.toLocaleString('en-US')} has been deposited to your locked Loan Account.`);
  };

  const handleRepayLoan = async (amountStr: string) => {
     const amount = parseFloat(amountStr);
     if (isNaN(amount) || amount <= 0) return await showAlert("Error", "Invalid amount.");
     
     const actualRepayment = Math.min(amount, loanBalance);
     if (actualRepayment <= 0) return await showAlert("Notice", "You don't owe any money!");

     const accounts = [
        { id: "1", initials: "CA", name: "Current Account", details: `Available: $${balance.toLocaleString('en-US', {maximumFractionDigits: 2})}` },
        { id: "2", initials: "LA", name: "Loan Account", details: `Available: $${loanAccountBalance.toLocaleString('en-US', {maximumFractionDigits: 2})}` }
     ];

     const accountChoice = await showAccountSelect(
         "Repay Loan", 
         `Choose source account to repay funds.`,
         actualRepayment,
         accounts
     );
     
     if (!accountChoice) return; 
     
     let newBal = Number(balance);
     let newLoanAccBal = Number(loanAccountBalance);

     if (accountChoice === "1") {
         if (actualRepayment > newBal) return await showAlert("Error", "Insufficient liquid funds in Current Account.");
         newBal -= actualRepayment;
     } else if (accountChoice === "2") {
         if (actualRepayment > newLoanAccBal) return await showAlert("Error", "Insufficient funds in Loan Account.");
         newLoanAccBal -= actualRepayment;
     } else {
         return; 
     }

     const newLoanDebt = Number(loanBalance) - actualRepayment;
     const ficoBoost = Math.floor(actualRepayment / 1000);
     const newFico = Math.min(850, fico + (ficoBoost > 0 ? ficoBoost : 1));
     
     setBalance(newBal);
     setLoanAccountBalance(newLoanAccBal);
     setLoanBalance(newLoanDebt);
     setFico(newFico);
     saveGameState({ bank_balance: newBal, loan_account_balance: newLoanAccBal, loan_balance: newLoanDebt, fico_score: newFico });
     
     await showAlert("Repayment Successful", `Successfully repaid $${actualRepayment.toLocaleString('en-US')}! Your FICO score increased by ${ficoBoost > 0 ? ficoBoost : 1} points.`);
  };

  const handleRelocate = async (cityId: string) => {
    const flightCost = 500;
    if (Number(balance) < flightCost) return await showAlert("Error", `Insufficient liquid funds to relocate. You need $${flightCost} for a ticket.`);
    
    const newBal = Number(balance) - flightCost;
    setBalance(newBal);
    setCurrentLocation(cityId);
    saveGameState({ bank_balance: newBal, location: cityId });
    await showAlert("Flight Landed", `Welcome to ${LOCATIONS[cityId].name}.`);
  };

  const handleBuyProperty = async (propertyId: string) => {
    if (!selectedBank) return await showAlert("Bank Account Required", "You must open a bank account in the Banking tab before purchasing real estate.");

    let propertyInfo: any = null;
    let cityInfo: any = null;
    for (const [cId, props] of Object.entries(REAL_ESTATE)) {
       const found = props.find(p => p.id === propertyId);
       if (found) { propertyInfo = found; cityInfo = LOCATIONS[cId]; break; }
    }
    if (!propertyInfo) return;

    const price = propertyInfo.price;
    
    const accounts = [
        { id: "1", initials: "CA", name: "Current Account", details: `Available: $${balance.toLocaleString('en-US', {maximumFractionDigits: 2})}` },
        { id: "2", initials: "SV", name: "Savings Vault", details: `Available: $${savingsBalance.toLocaleString('en-US', {maximumFractionDigits: 2})}` },
        { id: "3", initials: "LA", name: "Loan Account", details: `Available: $${loanAccountBalance.toLocaleString('en-US', {maximumFractionDigits: 2})}` }
    ];

    const accountChoice = await showAccountSelect(
      "Purchase Property",
      `Purchasing ${propertyInfo.name}`, 
      price,
      accounts
    );

    if (!accountChoice) return;

    const newProps = [...ownedProperties, propertyInfo.id];
    let updates: any = { owned_properties: newProps };

    if (accountChoice === "1") {
       if (Number(balance) < price) return await showAlert("Error", `Insufficient liquid funds in Current Account. You need $${price.toLocaleString()}.`);
       const newBal = Number(balance) - price;
       setBalance(newBal);
       updates.bank_balance = newBal;
    } else if (accountChoice === "2") {
       if (Number(savingsBalance) < price) return await showAlert("Error", `Insufficient funds in Savings Vault. You need $${price.toLocaleString()}.`);
       const newSav = Number(savingsBalance) - price;
       setSavingsBalance(newSav);
       updates.savings_balance = newSav;
    } else if (accountChoice === "3") {
       if (Number(loanAccountBalance) < price) return await showAlert("Error", `Insufficient funds in Loan Account. You need $${price.toLocaleString()}.`);
       const newLoanAcc = Number(loanAccountBalance) - price;
       setLoanAccountBalance(newLoanAcc);
       updates.loan_account_balance = newLoanAcc;
    }

    setOwnedProperties(newProps);
    saveGameState(updates);
    await showAlert("Purchase Successful", `Congratulations! You are the proud new owner of the ${propertyInfo.name} in ${cityInfo.name}! Rent is now permanently waived here.`);
  };

  const handleSellProperty = async (propertyId: string) => {
    let propertyInfo: any = null;
    for (const [cId, props] of Object.entries(REAL_ESTATE)) {
       const found = props.find(p => p.id === propertyId);
       if (found) { propertyInfo = found; break; }
    }
    if (!propertyInfo) return;

    const price = propertyInfo.price;
    const confirmSell = await showConfirm("Sell Property", `Are you sure you want to sell the ${propertyInfo.name} for $${price.toLocaleString()}?\n\nThe funds will be deposited into your Current Account.`);
    if (!confirmSell) return;

    const newBal = Number(balance) + price;
    const newProps = ownedProperties.filter(id => id !== propertyId);
    setBalance(newBal);
    setOwnedProperties(newProps);
    saveGameState({ bank_balance: newBal, owned_properties: newProps });
    await showAlert("Property Sold", `$${price.toLocaleString()} has been deposited to your Current Account.`);
  };

  const handleClaimSalary = async () => {
    const currentSalary = Number(pendingSalary);
    
    if (playerPath === 'corporate') {
       if (currentSalary < monthlySalaryTarget) return await showAlert("Error", `You haven't completed a full month of work yet! You need $${monthlySalaryTarget.toLocaleString()} accumulated.`);
       const taxAmount = currentSalary * locStats.tax;
       const netAmount = currentSalary - taxAmount;
       
       if (!selectedBank && Number(balance) + netAmount > 50000) {
          return await showAlert("Wallet Full!", "You cannot hold more than $50,000 without a secure bank account. Please open an account in the Banking tab to receive this transfer.");
       }
       
       const newBalance = Number(balance) + netAmount;
       setBalance(newBalance);
       setPendingSalary(0);
       setLastLocalSync(Date.now());
       saveGameState({ bank_balance: newBalance, pending_salary: 0, last_salary_sync: new Date().toISOString() });
       await showAlert("Payday! 🏢", `Gross Salary: $${currentSalary.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\nIncome Tax (${(locStats.tax * 100).toFixed(0)}%): -$${taxAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n\nNet Added to Account: $${netAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
    } 
    else if (playerPath === 'founder') {
       if (currentSalary >= 0) {
          const taxAmount = currentSalary * locStats.tax;
          const netAmount = currentSalary - taxAmount;
          
          if (!selectedBank && Number(balance) + netAmount > 50000) {
             return await showAlert("Wallet Full!", "You cannot hold more than $50,000 without a secure bank account. Please open an account in the Banking tab to receive this transfer.");
          }
          
          const newBalance = Number(balance) + netAmount;
          setBalance(newBalance);
          setPendingSalary(0);
          setLastLocalSync(Date.now());
          saveGameState({ bank_balance: newBalance, pending_salary: 0, last_salary_sync: new Date().toISOString() });
          await showAlert("Dividend Claimed! 📈", `Gross Profit: $${currentSalary.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\nCorporate Tax (${(locStats.tax * 100).toFixed(0)}%): -$${taxAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n\nNet Deposited: $${netAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n(VC Investors automatically received their equity cut)`);
       } else {
          const debt = Math.abs(currentSalary);
          if (balance < debt) return await showAlert("Warning", `Your company is in $${debt.toLocaleString()} of debt, and you don't have enough liquid cash to cover it! Your FICO score will take a massive hit!`);
          const newBalance = Number(balance) - debt;
          setBalance(newBalance);
          setPendingSalary(0);
          setLastLocalSync(Date.now());
          saveGameState({ bank_balance: newBalance, pending_salary: 0, last_salary_sync: new Date().toISOString() });
          await showAlert("Company Debt Paid 📉", `You wired $${debt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} from your personal account to keep the startup afloat.`);
       }
    }
  };

  const handleSwitchPathClick = async () => {
    if (pathUpdatedAt) {
      const lastUpdate = new Date(pathUpdatedAt).getTime();
      const now = new Date().getTime();
      const hoursSince = (now - lastUpdate) / (1000 * 60 * 60);
      if (hoursSince < 24) {
         if (!freePathSwitchUsed) {
            const confirm = await showConfirm("Free Switch Available", `You normally have to wait 24 hours to switch careers, but you have 1 free switch available! Use it now?`);
            if (!confirm) return;
         } else {
            return await showAlert("Access Denied", `You must wait ${Math.ceil(24 - hoursSince)} more hours before switching your career path.`);
         }
      }
    }
    setShowPathSelection(true);
  };

  const handlePathSelect = async (newPath: string) => {
    let finalBal = balance;
    let finalSav = savingsBalance;
    let finalLoan = loanAccountBalance;

    if (newPath === 'founder') {
        const accounts = [
            { id: "1", initials: "CA", name: "Current Account", details: `Available: $${balance.toLocaleString('en-US', {maximumFractionDigits: 2})}` },
            { id: "2", initials: "SV", name: "Savings Vault", details: `Available: $${savingsBalance.toLocaleString('en-US', {maximumFractionDigits: 2})}` },
            { id: "3", initials: "LA", name: "Loan Account", details: `Available: $${loanAccountBalance.toLocaleString('en-US', {maximumFractionDigits: 2})}` }
        ];

        const accountChoice = await showAccountSelect(
            "Startup Investment",
            "Starting a business requires a $50,000 initial investment. Where should we pull the funds from?",
            50000,
            accounts
        );

        if (!accountChoice) return;

        if (accountChoice === "1") {
            if (balance < 50000) return await showAlert("Error", "Insufficient liquid funds in Current Account.");
            finalBal -= 50000;
        } else if (accountChoice === "2") {
            if (savingsBalance < 50000) return await showAlert("Error", "Insufficient funds in Savings Vault.");
            finalSav -= 50000;
        } else if (accountChoice === "3") {
            if (loanAccountBalance < 50000) return await showAlert("Error", "Insufficient funds in Loan Account.");
            finalLoan -= 50000;
        }

        setBalance(finalBal);
        setSavingsBalance(finalSav);
        setLoanAccountBalance(finalLoan);
    }

    let usedFreeSwitch = freePathSwitchUsed;
    if (pathUpdatedAt) {
      const lastUpdate = new Date(pathUpdatedAt).getTime();
      const now = new Date().getTime();
      const hoursSince = (now - lastUpdate) / (1000 * 60 * 60);
      if (hoursSince < 24 && !freePathSwitchUsed) {
          usedFreeSwitch = true;
          setFreePathSwitchUsed(true);
      }
    }

    const nowStr = new Date().toISOString();
    setPlayerPath(newPath); 
    setPathUpdatedAt(nowStr); 
    setShowPathSelection(false);
    
    const updates: any = { 
        player_path: newPath, 
        path_updated_at: nowStr, 
        free_path_switch_used: usedFreeSwitch,
        last_salary_sync: nowStr, 
        last_energy_sync: lastEnergySyncState ? new Date(lastEnergySyncState).toISOString() : nowStr 
    };

    if (newPath === 'founder') {
        updates.bank_balance = finalBal;
        updates.savings_balance = finalSav;
        updates.loan_account_balance = finalLoan;
        
        const defaultStartup = { workload: 50, payroll: 50, morale: 100, is_strike: false, level: 1, companyName: "", ticker: "", equityOwned: 100, moraleBoostUntil: 0 };
        setStartupData(defaultStartup);
        updates.startup_data = defaultStartup;
    } else if (newPath === 'corporate') { 
        setPendingSalary(0); 
        setLastLocalSync(Date.now()); 
    }

    // Cap energy gracefully if switching back to a lower-level path
    const newEffectiveLevel = newPath === 'founder' ? 1 : corporateLevel;
    const newMaxEnergy = 100 + ((newEffectiveLevel - 1) * 50);
    if (energy > newMaxEnergy) {
        setEnergy(newMaxEnergy);
        updates.energy = newMaxEnergy;
    }

    saveGameState(updates);
  };

  const handleDevBypass = async () => {
     const input = await showPrompt("God Mode", "Enter amount of cash to add (use negative to remove):", "1000000");
     if (input === null) return;
     const amountToAdd = parseFloat(input);
     if (isNaN(amountToAdd)) return await showAlert("Error", "Invalid number entered.");

     const newBal = Number(balance) + amountToAdd;
     const newStartupData = { workload: 50, payroll: 50, morale: 100, is_strike: false, level: 1, companyName: startupData.companyName, ticker: startupData.ticker, equityOwned: startupData.equityOwned, moraleBoostUntil: startupData.moraleBoostUntil };
     const newMaxEnergy = 100 + ((playerPath === 'founder' ? 1 : corporateLevel) - 1) * 50;
     
     setBalance(newBal); 
     setEnergy(newMaxEnergy); 
     setFico(850); 
     setLoanBalance(0); 
     setPathUpdatedAt(null);
     setFreePathSwitchUsed(false);
     setPendingSalary(playerPath === 'corporate' ? monthlySalaryTarget : 0); 
     setLastLocalSync(Date.now()); 
     setLastEnergySyncState(Date.now());
     setStartupData(newStartupData);
     
     saveGameState({ 
       bank_balance: newBal, 
       energy: newMaxEnergy, 
       fico_score: 850, 
       loan_balance: 0, 
       path_updated_at: null, 
       free_path_switch_used: false,
       pending_salary: playerPath === 'corporate' ? monthlySalaryTarget : 0, 
       last_salary_sync: new Date().toISOString(), 
       last_energy_sync: new Date().toISOString(),
       startup_data: newStartupData
     });
     await showAlert("God Mode Activated", `Added $${amountToAdd.toLocaleString()}, FICO 850, Loans Cleared, Strikes Resolved.`);
  };

  const handleResetState = async () => {
     const confirmReset = await showConfirm("Hard Reset", "Are you sure you want to hard reset your entire game state? This will wipe your money, level, assets, and startup data back to 0.");
     if (!confirmReset) return;

     const defaultStartup = { workload: 50, payroll: 50, morale: 100, is_strike: false, level: 1, companyName: "", ticker: "", equityOwned: 100, moraleBoostUntil: 0 };

     setBalance(0);
     setSavingsBalance(0);
     setLoanAccountBalance(0);
     setLoanBalance(0);
     setFico(700);
     setEnergy(100);
     setPendingSalary(0);
     setCurrentLocation('bali');
     setOwnedProperties([]);
     setOwnedVehicles([]);
     setPortfolio({});
     setStartupData(defaultStartup);
     setCorporateLevel(1);

     // Wipe localStorage vars too!
     localStorage.removeItem('pulse_tax_state');

     saveGameState({
         bank_balance: 0,
         savings_balance: 0,
         loan_account_balance: 0,
         loan_balance: 0,
         fico_score: 700,
         energy: 100,
         pending_salary: 0,
         location: 'bali',
         owned_properties: [],
         owned_vehicles: [],
         portfolio: {},
         startup_data: defaultStartup,
         corporate_level: 1,
         path_updated_at: null,
         free_path_switch_used: false,
         last_salary_sync: new Date().toISOString(),
         last_energy_sync: new Date().toISOString()
     });

     await showAlert("Success", "Game state successfully hard reset.");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-white">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-4" />
        <p className="text-zinc-500 font-mono text-sm uppercase tracking-widest animate-pulse">Syncing Secure Database...</p>
      </div>
    );
  }

  const displayName = pulseProfile?.username || pulseProfile?.displayName || "PlayerOne";
  const avatarUrl = pulseProfile?.theme?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=Fallback";

  return (
    <div className="flex h-screen bg-[#050505] text-zinc-300 font-sans selection:bg-indigo-500/30 overflow-hidden relative">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none z-0"></div>

      {/* --- CUSTOM MODAL UI OVERLAY --- */}
      {modal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#050505]/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          
          {modal.type === 'account-select' ? (
             <AccountSelectorUI modal={modal} closeModal={closeModal} />
          ) : (
             <div className="bg-[#121214] border border-white/10 rounded-[24px] w-full max-w-md overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-200 flex flex-col">
                <div className="p-6">
                   <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                         <AlertCircle className="w-5 h-5 text-indigo-400" />
                      </div>
                      <h3 className="text-xl font-black text-white">{modal.title}</h3>
                   </div>
                   
                   <p className="text-zinc-400 text-sm mb-6 whitespace-pre-wrap leading-relaxed">{modal.message}</p>

                   {modal.type === 'prompt' && (
                      <input
                         type="text"
                         autoFocus
                         value={modalInput}
                         onChange={(e) => setModalInput(e.target.value)}
                         placeholder={modal.placeholder}
                         className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors mb-6 font-mono text-sm shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]"
                         onKeyDown={(e) => { if(e.key === 'Enter') closeModal(modalInput); }}
                      />
                   )}

                   <div className="flex gap-3 justify-end mt-2">
                      {(modal.type === 'confirm' || modal.type === 'prompt') && (
                         <button onClick={() => closeModal(modal.type === 'prompt' ? null : false)} className="px-5 py-2.5 rounded-xl font-bold text-xs text-zinc-400 hover:text-white hover:bg-white/5 transition-colors border border-transparent hover:border-white/10">
                            Cancel
                         </button>
                      )}
                      <button onClick={() => closeModal(modal.type === 'prompt' ? modalInput : (modal.type === 'confirm' ? true : undefined))} className="px-6 py-2.5 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-[0_0_20px_rgba(79,70,229,0.3)]">
                         {modal.type === 'alert' ? 'Acknowledge' : 'Confirm'}
                      </button>
                   </div>
                </div>
             </div>
          )}
        </div>
      )}

      {/* --- PATH SELECTION OVERLAY --- */}
      {(!playerPath || showPathSelection) && !modal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050505]/95 backdrop-blur-2xl p-4 overflow-y-auto">
           {playerPath && (
             <button onClick={() => setShowPathSelection(false)} className="absolute top-8 right-8 text-zinc-500 hover:text-white transition-colors bg-white/5 p-2 rounded-full">
               <X className="w-6 h-6" />
             </button>
           )}
           <div className="max-w-5xl w-full py-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
              <div className="text-center mb-12">
                 <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-white mb-4">Choose Your Path</h1>
                 <p className="text-zinc-400 text-lg max-w-xl mx-auto">Your choice determines your gameplay mechanics, income style, and risks.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <button onClick={() => handlePathSelect('hustler')} className={`group border rounded-3xl p-8 text-left transition-all flex flex-col justify-between min-h-[400px] cursor-pointer ${playerPath === 'hustler' ? 'bg-emerald-500/10 border-emerald-500/50 shadow-[0_0_40px_rgba(16,185,129,0.15)]' : 'bg-[#121214] border-white/10 hover:border-emerald-500/50 hover:-translate-y-2'}`}>
                    <div>
                       <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20 mb-6"><Zap className="w-7 h-7 text-emerald-400" /></div>
                       <h3 className="text-2xl font-black text-white mb-2">The Street Hustler</h3>
                       <p className="text-zinc-400 text-sm leading-relaxed mb-6">Active gameplay. Take on gig economy jobs. Click to complete tasks. Finish fast for bonuses.</p>
                    </div>
                 </button>
                 <button onClick={() => handlePathSelect('corporate')} className={`group border rounded-3xl p-8 text-left transition-all flex flex-col justify-between min-h-[400px] cursor-pointer ${playerPath === 'corporate' ? 'bg-indigo-500/10 border-indigo-500/50 shadow-[0_0_40px_rgba(99,102,241,0.15)]' : 'bg-[#121214] border-white/10 hover:border-indigo-500/50 hover:-translate-y-2'}`}>
                    <div>
                       <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20 mb-6"><Briefcase className="w-7 h-7 text-indigo-400" /></div>
                       <h3 className="text-2xl font-black text-white mb-2">Corporate Worker</h3>
                       <p className="text-zinc-400 text-sm leading-relaxed mb-6">Stable passive income. Accrue salary per minute and claim monthly. Perform "Boss Tasks" to earn promotions.</p>
                    </div>
                 </button>
                 <button onClick={() => handlePathSelect('founder')} className={`group border rounded-3xl p-8 text-left transition-all flex flex-col justify-between min-h-[400px] cursor-pointer relative overflow-hidden bg-[#121214] border-white/10 hover:border-orange-500/50 hover:-translate-y-2 ${playerPath === 'founder' ? 'bg-orange-500/10 border-orange-500/50 shadow-[0_0_40px_rgba(249,115,22,0.15)]' : ''}`}>
                    <div>
                       <div className="w-14 h-14 bg-orange-500/10 rounded-2xl flex items-center justify-center border border-orange-500/20 mb-6"><Building2 className="w-7 h-7 text-orange-400" /></div>
                       <h3 className="text-2xl font-black text-white mb-2">The Founder</h3>
                       <p className="text-zinc-400 text-sm leading-relaxed mb-6">Manage a global startup. Balance workload and payroll. Highly volatile income, massive upside potential, but strikes can bankrupt you.</p>
                    </div>
                    <div className="mt-auto pt-6">
                       <p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest border border-orange-500/20 bg-orange-500/10 px-3 py-1.5 rounded-lg inline-block w-max">Requires $50,000 Investment</p>
                    </div>
                 </button>
              </div>
           </div>
        </div>
      )}

      {activeJob && (
        <ActiveJobModal 
           job={activeJob} 
           onClose={() => setActiveJob(null)} 
           onComplete={async (success, timeRemaining) => {
             setActiveJob(null);
             let newBalance = Number(balance);

             if (activeJob.isPromotion) {
                if (success) {
                   const newLevel = corporateLevel + 1;
                   setCorporateLevel(newLevel);
                   const newMaxEnergy = 100 + ((newLevel - 1) * 50);
                   setEnergy(newMaxEnergy);
                   await showAlert("Rank Up!", `You leveled up to Level ${newLevel}! Your Max Energy has increased to ${newMaxEnergy}.`);
                   saveGameState({ corporate_level: newLevel, energy: newMaxEnergy });
                } else { await showAlert("Failed", `Time's up! You failed the challenge. No rank up this time.`); }
                return;
             }
             
             if (activeJob.isExpansion) {
                if (success) {
                   const sData = startupDataRef.current;
                   const newLevel = (sData.level || 1) + 1;
                   const newSData = { ...sData, level: newLevel };
                   
                   // Leveling up your company permanently increases your Energy Cap!
                   const newMaxEnergy = 100 + ((newLevel - 1) * 50);
                   setEnergy(newMaxEnergy);
                   setStartupData(newSData);
                   saveGameState({ startup_data: newSData, energy: newMaxEnergy });
                   
                   await showAlert("Expansion Successful!", `Your startup is now Level ${newLevel}. Your Max Energy has increased to ${newMaxEnergy}, and revenue and costs have scaled up!`);
                } else {
                   await showAlert("Expansion Failed", `Time's up! The expansion failed. Better luck next time.`);
                }
                return;
             }

             if (success) {
                const bonus = timeRemaining * 0.50; 
                let totalEarned = activeJob.basePay + bonus;
                
                if (!selectedBank && newBalance + totalEarned > 50000) {
                   const allowed = 50000 - newBalance;
                   if (allowed <= 0) {
                      await showAlert("Wallet Full!", "Your pockets are full! You cannot hold more than $50,000 without a bank account. Job payout discarded.");
                      totalEarned = 0;
                   } else {
                      await showAlert("Wallet Full!", `You can only hold $50,000 without a bank account. You earned $${totalEarned.toFixed(2)}, but could only keep $${allowed.toFixed(2)}.`);
                      totalEarned = allowed;
                   }
                } else {
                   await showAlert("Job Complete!", `You earned $${activeJob.basePay} + $${bonus.toFixed(2)} speed bonus!`);
                }
                
                newBalance += totalEarned;
             } else {
                const penalty = activeJob.basePay * 0.20;
                newBalance -= penalty;
                await showAlert("Job Failed", `Time's up! You failed the job. The client was angry and fined you $${penalty.toFixed(2)}!`);
             }
             setBalance(newBalance); saveGameState({ bank_balance: newBalance });
           }} 
        />
      )}

      {/* --- Sidebar (DESKTOP ONLY) --- */}
      <aside className="hidden lg:flex w-64 bg-[#0a0a0c]/80 backdrop-blur-xl border-r border-white/5 flex-col z-20 shrink-0">
        <div className="p-6 border-b border-white/5 flex items-center gap-3">
          <img src="/icon.svg" alt="Pulse" className="w-7 h-7 object-contain" />
          <span className="font-black text-xl tracking-tighter text-white">Pulse<span className="text-zinc-600">Network</span></span>
        </div>
        
        <div className="flex-1 px-4 py-6 space-y-8 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-white/20 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.1)_transparent]">
          <div>
            <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest ml-2 mb-3">Central Hub</p>
            <div className="space-y-1">
              {TABS.map(tab => (
                <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)} 
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors ${activeTab === tab.id ? 'bg-gradient-to-r from-indigo-500/10 to-transparent text-indigo-400 border-l-2 border-indigo-500 shadow-[inset_0_0_20px_rgba(99,102,241,0.05)]' : 'text-zinc-400 hover:bg-white/5 hover:text-white font-medium'}`}
                >
                  <tab.icon className="w-4 h-4" /> {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* --- MOBILE BOTTOM NAVIGATION --- */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[60] bg-[#0a0a0c]/90 backdrop-blur-xl border-t border-white/10 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
         <div className="flex justify-between items-center px-2 py-2">
            {MOBILE_TABS.map(tab => (
               <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setIsMobileMenuOpen(false); }}
                  className={`flex-1 flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${activeTab === tab.id && !isMobileMenuOpen ? 'text-indigo-400' : 'text-zinc-500 hover:text-zinc-300'}`}
               >
                  <div className={`p-1.5 rounded-lg transition-colors ${activeTab === tab.id && !isMobileMenuOpen ? 'bg-indigo-500/20' : 'bg-transparent'}`}>
                     <tab.icon className="w-5 h-5" />
                  </div>
                  <span className="text-[9px] font-bold tracking-widest uppercase truncate max-w-[60px]">{tab.label.split(' ')[0]}</span>
               </button>
            ))}
            <button
               onClick={() => setIsMobileMenuOpen(true)}
               className={`flex-1 flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${isMobileMenuOpen ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
               <div className={`p-1.5 rounded-lg transition-colors ${isMobileMenuOpen ? 'bg-white/10' : 'bg-transparent'}`}>
                  <Menu className="w-5 h-5" />
               </div>
               <span className="text-[9px] font-bold tracking-widest uppercase">More</span>
            </button>
         </div>
      </div>

      {/* --- MOBILE OVERLAY "MORE" MENU --- */}
      {isMobileMenuOpen && (
         <div className="lg:hidden fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 flex flex-col justify-end">
            <div className="absolute inset-0" onClick={() => setIsMobileMenuOpen(false)}></div>
            <div className="bg-[#121214] border-t border-white/10 rounded-t-[32px] p-6 pb-8 shadow-[0_-20px_50px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom-8 relative z-10">
               <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-black text-white">Network Hub</h2>
                  <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition"><X className="w-5 h-5"/></button>
               </div>
               <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-6">
                  {TABS.map(tab => (
                     <button
                        key={tab.id}
                        onClick={() => { setActiveTab(tab.id); setIsMobileMenuOpen(false); }}
                        className={`flex flex-col items-center justify-center gap-3 p-4 rounded-2xl border transition-all ${activeTab === tab.id ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400' : 'bg-black/40 border-white/5 text-zinc-400 hover:bg-white/5 hover:text-white'}`}
                     >
                        <tab.icon className="w-6 h-6" />
                        <span className="text-[9px] font-bold uppercase tracking-wider text-center leading-tight">{tab.label.replace(' & ', '\n& ')}</span>
                     </button>
                  ))}
               </div>
               <div className="pt-6 border-t border-white/5 space-y-3">
                 {displayName.toLowerCase() === 'sour' && (
                    <div className="flex gap-3 mb-3">
                       <button onClick={() => { handleResetState(); setIsMobileMenuOpen(false); }} className="flex-1 flex items-center justify-center gap-2 bg-orange-500/10 border border-orange-500/30 text-orange-500 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-500/20 transition">
                          <RefreshCw className="w-4 h-4" /> Reset
                       </button>
                       <button onClick={() => { handleDevBypass(); setIsMobileMenuOpen(false); }} className="flex-1 flex items-center justify-center gap-2 bg-red-500/10 border border-red-500/30 text-red-500 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500/20 transition">
                          <Zap className="w-4 h-4" /> God Mode
                       </button>
                    </div>
                 )}
               </div>
            </div>
         </div>
      )}

      {/* --- Main Content Area --- */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto relative z-10">
        
        {/* Header - MOBILE OPTIMIZED */}
        <header className="p-4 sm:p-6 md:px-8 flex justify-between items-center sticky top-0 z-30 bg-[#050505]/80 backdrop-blur-md border-b border-white/5">
          <div className="flex items-center gap-2 sm:gap-4">
            
            {/* Location */}
            <div className="flex flex-col cursor-pointer group" onClick={() => setActiveTab('real_estate')}>
               <span className="hidden sm:block text-[9px] font-bold tracking-widest text-zinc-500 uppercase ml-1 mb-1 group-hover:text-cyan-400 transition-colors">Location</span>
               <div className="flex items-center gap-1.5 sm:gap-2 bg-[#121214] border border-white/10 rounded-full pl-1 pr-3 sm:pr-4 py-1 shadow-md group-hover:bg-white/5 transition-colors">
                 <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-cyan-900/30 border border-cyan-500/30 flex items-center justify-center group-hover:scale-105 transition-transform"><MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400" /></div>
                 <span className="text-sm font-bold text-white tracking-wide">
                   {locStats.name} <span className={`hidden sm:inline-block font-mono text-[10px] uppercase ml-1 px-1.5 py-0.5 rounded ${locStats.tax === 0 ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'}`}>{(locStats.tax * 100).toFixed(0)}% Tax</span>
                 </span>
               </div>
            </div>
            
            {/* Energy */}
            <div className="flex flex-col">
               <span className="hidden sm:block text-[9px] font-bold tracking-widest text-zinc-500 uppercase ml-1 mb-1">Energy Bar</span>
               <div className="flex items-center gap-2 sm:gap-3 bg-[#121214] border border-white/10 rounded-full pl-1 pr-3 sm:pr-4 py-1 shadow-md">
                 <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-yellow-900/30 border border-yellow-500/30 flex items-center justify-center"><Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-400 fill-yellow-400/20" /></div>
                 <div className="flex flex-col justify-center">
                   <div className="w-16 sm:w-24 h-1.5 bg-white/10 rounded-full overflow-hidden mb-1"><div className="h-full bg-gradient-to-r from-orange-500 to-yellow-400 rounded-full transition-all duration-300" style={{ width: `${(energy / maxEnergy) * 100}%` }}></div></div>
                   <span className="text-[9px] sm:text-[10px] font-mono text-zinc-400 leading-none">{Math.floor(energy)}/{maxEnergy}</span>
                 </div>
               </div>
            </div>
            
            {/* Sleep Button */}
            <div className="flex sm:mt-4">
              <button 
                onClick={handleSleep} 
                className="flex items-center justify-center sm:gap-2 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 w-9 h-9 sm:w-auto sm:h-auto sm:px-4 sm:py-2 rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-indigo-500/20 transition shadow-[0_0_15px_rgba(99,102,241,0.2)]"
              >
                <Moon className="w-4 h-4 sm:w-3.5 sm:h-3.5" /> <span className="hidden sm:block">Sleep ({maxEnergy}⚡)</span>
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3">
             {Date.now() < lazinessPenaltyUntil && (
                <div className="hidden lg:flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-500 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest mr-2 animate-pulse">
                   [LAZY]
                </div>
             )}
             {displayName.toLowerCase() === 'sour' && (
               <div className="hidden lg:flex items-center gap-2">
                 <button onClick={handleResetState} className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 text-orange-500 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-orange-500/20 transition shadow-[0_0_15px_rgba(249,115,22,0.2)]">
                    <RefreshCw className="w-3 h-3" /> Reset
                 </button>
                 <button onClick={handleDevBypass} className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-500 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-red-500/20 transition shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                    <Zap className="w-3 h-3" /> God Mode
                 </button>
               </div>
             )}
             <div className="flex items-center gap-2 sm:gap-3 bg-[#121214] border border-white/10 rounded-full pl-2 sm:pl-4 pr-1 py-1 shadow-md cursor-pointer hover:bg-white/5 transition-colors">
               <div className="hidden sm:flex flex-col items-end">
                 <span className="text-[9px] font-bold tracking-widest text-zinc-500 uppercase">Agent</span>
                 <span className="text-sm font-bold text-white tracking-wide">{displayName}</span>
               </div>
               <img src={avatarUrl} alt="Avatar" className="w-7 h-7 sm:w-10 sm:h-10 rounded-full border-2 border-zinc-800 bg-zinc-900 object-cover" />
               <ChevronDown className="hidden sm:block w-4 h-4 text-zinc-500 mr-2" />
             </div>
          </div>
        </header>

        {/* Extracted Bottom Padding for Mobile Nav Bar! */}
        <div className="p-4 sm:p-6 md:p-8 pt-4 pb-32 lg:pb-12">
          {activeTab === 'overview' && (
             <OverviewTab 
                netWorth={totalNetWorth} balance={balance} savingsBalance={savingsBalance} loanAccountBalance={loanAccountBalance} assetValue={assetValue} loanBalance={loanBalance} fico={fico} playerPath={playerPath} netWorthHistory={netWorthHistory} currentLocName={locStats.name} energy={energy} ownedVehicles={ownedVehicles} setBalance={setBalance} setEnergy={setEnergy} setActiveJob={setActiveJob} saveGameState={saveGameState} handleSwitchPathClick={handleSwitchPathClick} corporateLevel={corporateLevel} currentRole={currentRole} displaySalary={displaySalaryRef.current} pendingSalary={pendingSalary} monthlySalaryTarget={monthlySalaryTarget} salaryProgressPercentage={Math.min(100, (Number(pendingSalary) / monthlySalaryTarget) * 100)} handleClaimSalary={handleClaimSalary} currentLocation={currentLocation} ownedProperties={ownedProperties} startupData={startupData} setStartupData={setStartupData} locMultiplier={locStats.multiplier}
                showAlert={showAlert} showConfirm={showConfirm} showPrompt={showPrompt} nextTaxTime={nextTaxTime} taxCycleMinutes={taxCycleMinutes} marketEvent={marketEvent}
             />
          )}
          {activeTab === 'banking' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
               <BankingTab 
                 balance={balance} savingsBalance={savingsBalance} loanBalance={loanBalance} loanAccountBalance={loanAccountBalance} fico={fico} selectedBank={selectedBank} accountNumber={accountNumber} transferAmount={transferAmount} setTransferAmount={setTransferAmount} handleBankSelect={handleBankSelect} handleTransfer={handleTransfer} handleTakeLoan={handleTakeLoan} handleRepayLoan={handleRepayLoan}
                 displayName={displayName} showPrompt={showPrompt} showAlert={showAlert} showConfirm={showConfirm} showAccountSelect={showAccountSelect}
               />
            </div>
          )}
          {activeTab === 'real_estate' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
               <RealEstateTab currentLocation={currentLocation} ownedProperties={ownedProperties} handleRelocate={handleRelocate} handleBuyProperty={handleBuyProperty} handleSellProperty={handleSellProperty} />
            </div>
          )}
          {activeTab === 'lifestyle' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
               <LifestyleTab balance={balance} energy={energy} ownedVehicles={ownedVehicles} setBalance={setBalance} setEnergy={setEnergy} setOwnedVehicles={setOwnedVehicles} saveGameState={saveGameState} showAlert={showAlert} showConfirm={showConfirm} selectedBank={selectedBank} />
            </div>
          )}
          {activeTab === 'markets' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
               <MarketsTab balance={balance} portfolio={portfolio} setBalance={setBalance} setPortfolio={setPortfolio} saveGameState={saveGameState} showAlert={showAlert} showConfirm={showConfirm} showPrompt={showPrompt} selectedBank={selectedBank} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}