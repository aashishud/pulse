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
  
  const [corporateLevel, setCorporateLevel] = useState(1);
  const [currentLocation, setCurrentLocation] = useState('bali');
  const [ownedProperties, setOwnedProperties] = useState<string[]>([]);
  const [ownedVehicles, setOwnedVehicles] = useState<string[]>([]);
  const [portfolio, setPortfolio] = useState<Record<string, any>>({});
  
  const [startupData, setStartupData] = useState<any>({ workload: 50, payroll: 50, morale: 100, is_strike: false, level: 1, companyName: "", ticker: "", equityOwned: 100, moraleBoostUntil: 0, upgrades: [], acquisitions: [] });
  
  const activeLevel = playerPath === 'founder' ? (startupData.level || 1) : corporateLevel;
  const maxEnergy = 100 + ((activeLevel - 1) * 50); 

  const [pendingSalary, setPendingSalary] = useState(0); 
  const [lastLocalSync, setLastLocalSync] = useState<number | null>(null);
  const [lastEnergySyncState, setLastEnergySyncState] = useState<number | null>(null);
  
  const [nextTaxTime, setNextTaxTime] = useState<number | null>(null);
  const [taxCycleMinutes, setTaxCycleMinutes] = useState<number>(10);
  const [lazinessPenaltyUntil, setLazinessPenaltyUntil] = useState<number>(0);
  const [energyBlockUntil, setEnergyBlockUntil] = useState<number>(0);

  const [marketEvent, setMarketEvent] = useState<{type: 'boom' | 'recession' | 'labor_shortage' | 'none', name: string, message: string, expiresAt: number} | null>(null);

  const [activeTab, setActiveTab] = useState('overview');
  const [activeJob, setActiveJob] = useState<any>(null);
  const [showPathSelection, setShowPathSelection] = useState(false);
  const [transferAmount, setTransferAmount] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [modal, setModal] = useState<{isOpen: boolean, type: 'alert'|'confirm'|'prompt'|'account-select', title: string, message: string, placeholder: string, resolve: any, accounts?: any[], amount?: number}>({
     isOpen: false, type: 'alert', title: '', message: '', placeholder: '', resolve: null
  });
  const [modalInput, setModalInput] = useState("");

  const showAlert = (title: string, message: string) => new Promise<void>((resolve) => setModal({ isOpen: true, type: 'alert', title, message, placeholder: '', resolve }));
  const showConfirm = (title: string, message: string) => new Promise<boolean>((resolve) => setModal({ isOpen: true, type: 'confirm', title, message, placeholder: '', resolve }));
  const showPrompt = (title: string, message: string, placeholder = "") => new Promise<string | null>((resolve) => { setModalInput(""); setModal({ isOpen: true, type: 'prompt', title, message, placeholder, resolve }); });
  const showAccountSelect = (title: string, message: string, amount: number, accounts: any[]) => new Promise<string | null>((resolve) => setModal({ isOpen: true, type: 'account-select', title, message, placeholder: '', resolve, accounts, amount }));
  const closeModal = (result: any) => { if (modal.resolve) modal.resolve(result); setModal(prev => ({ ...prev, isOpen: false })); };

  const displaySalaryRef = useRef(pendingSalary); const startupDataRef = useRef(startupData); const balanceRef = useRef(balance); const ficoRef = useRef(fico); const ownedPropertiesRef = useRef(ownedProperties); const currentLocationRef = useRef(currentLocation); const nextTaxTimeRef = useRef(nextTaxTime); const lazinessPenaltyUntilRef = useRef(lazinessPenaltyUntil); const energyBlockUntilRef = useRef(energyBlockUntil); const taxCycleMinutesRef = useRef(taxCycleMinutes); const marketEventRef = useRef(marketEvent); const portfolioRef = useRef(portfolio);
  
  useEffect(() => { displaySalaryRef.current = pendingSalary; }, [pendingSalary]); 
  useEffect(() => { startupDataRef.current = startupData; }, [startupData]); 
  useEffect(() => { balanceRef.current = balance; }, [balance]); 
  useEffect(() => { ficoRef.current = fico; }, [fico]); 
  useEffect(() => { ownedPropertiesRef.current = ownedProperties; }, [ownedProperties]); 
  useEffect(() => { currentLocationRef.current = currentLocation; }, [currentLocation]); 
  useEffect(() => { nextTaxTimeRef.current = nextTaxTime; }, [nextTaxTime]); 
  useEffect(() => { lazinessPenaltyUntilRef.current = lazinessPenaltyUntil; }, [lazinessPenaltyUntil]); 
  useEffect(() => { energyBlockUntilRef.current = energyBlockUntil; }, [energyBlockUntil]); 
  useEffect(() => { taxCycleMinutesRef.current = taxCycleMinutes; }, [taxCycleMinutes]); 
  useEffect(() => { marketEventRef.current = marketEvent; }, [marketEvent]); 
  useEffect(() => { portfolioRef.current = portfolio; }, [portfolio]);

  const locStats = LOCATIONS[currentLocation] || LOCATIONS.bali;
  const realEstateValue = ownedProperties.reduce((sum, propId) => { for (const city in REAL_ESTATE) { const prop = REAL_ESTATE[city].find(p => p.id === propId); if (prop) return sum + prop.price; } return sum; }, 0);
  const vehicleValue = ownedVehicles.reduce((sum, vId) => sum + (VEHICLES[vId]?.price || 0) * 0.8, 0); 
  
  const [livePortfolioValue, setLivePortfolioValue] = useState(0);
  
  useEffect(() => {
     const fetchPortfolioValue = async () => {
        if (document.hidden) return;
        let baseVal = ((portfolio.funds?.vanguard || 0) + (portfolio.funds?.citadel || 0));
        (portfolio.angel || []).forEach((deal: any) => baseVal += deal.status === 'pending' ? deal.invested : (deal.status === 'won' ? deal.payout : 0));
        const hasStocks = portfolio.stocks && Object.keys(portfolio.stocks).length > 0;
        const hasOldStocks = Object.keys(portfolio).some(k => k !== 'funds' && k !== 'stocks' && k !== 'angel');
        if (!hasStocks && !hasOldStocks) return setLivePortfolioValue(baseVal);
        try {
           const [cryptoRes, stockRes] = await Promise.all([fetch(`/api/crypto`), fetch(`/api/stocks`)]);
           const combinedData = [...(cryptoRes.ok ? await cryptoRes.json() : []), ...(stockRes.ok ? await stockRes.json() : [])];
           let val = baseVal;
           [...Object.entries(CRYPTO_ASSETS), ...Object.entries(STOCK_ASSETS)].forEach(([ticker, asset]) => {
              const shares = portfolio.stocks?.[ticker]?.shares || portfolio[ticker]?.shares || 0;
              if (shares > 0) { const item = combinedData.find((d: any) => d.symbol === asset.symbol); if (item && !isNaN(parseFloat(item.price))) val += shares * parseFloat(item.price); }
           });
           setLivePortfolioValue(val);
        } catch(e) { setLivePortfolioValue(baseVal); }
     };
     fetchPortfolioValue(); const int = setInterval(fetchPortfolioValue, 10000); return () => clearInterval(int);
  }, [portfolio]);

  const assetValue = realEstateValue + vehicleValue + livePortfolioValue;
  const totalNetWorth = Number(balance) + Number(savingsBalance) + Number(loanAccountBalance) + assetValue - Number(loanBalance);
  
  useEffect(() => { setNetWorthHistory(prev => { const next = [...prev, totalNetWorth]; if (next.length > 20) next.shift(); return next; }); }, [totalNetWorth]);

  const getCorporateRole = (level: number) => {
    let base = level >= 5 ? 10 + ((level - 4) * 5) : [0.5, 1.5, 4, 10][level-1] || 0.5;
    return { title: level >= 5 ? `Executive Lv.${level}` : ["Junior Developer", "Mid-Level Developer", "Senior Developer", "Lead Developer"][level-1], payPerMinute: base * locStats.multiplier };
  };
  const currentRole = getCorporateRole(corporateLevel);
  const monthlySalaryTarget = currentRole.payPerMinute * 450; 

  // --- THE MATH FIX: Additive Multipliers to prevent Exponential Explosions ---
  const getStartupMultipliers = (sData: any, evt: any) => {
     let gAdd = 0, cRed = 0, mRetain = 0, eGM = 1, eCM = 1;
     const u = sData.upgrades || [], a = sData.acquisitions || [];
     
     // 1. Additive R&D Tech Tree Upgrades (Added to base 1.0)
     if(u.includes('viral_4')) gAdd+=1.5; else if(u.includes('viral_3')) gAdd+=0.8; else if(u.includes('viral_2')) gAdd+=0.4; else if(u.includes('viral_1')) gAdd+=0.15;
     if(u.includes('dev_3')) gAdd+=3.0; else if(u.includes('dev_2')) gAdd+=1.2; else if(u.includes('dev_1')) gAdd+=0.5;
     if(u.includes('ai_3')) gAdd+=7.0; else if(u.includes('ai_2')) gAdd+=3.0; else if(u.includes('ai_1')) gAdd+=1.0;
     if(u.includes('qc_3')) gAdd+=14.0; else if(u.includes('qc_2')) gAdd+=5.0; else if(u.includes('qc_1')) gAdd+=2.0;
     
     // 2. HR & Server Cost Reductions
     if(u.includes('hr_3')) mRetain=0.8; else if(u.includes('hr_2')) mRetain=0.5; else if(u.includes('hr_1')) mRetain=0.3;
     if(u.includes('server_3')) cRed=0.6; else if(u.includes('server_2')) cRed=0.4; else if(u.includes('server_1')) cRed=0.2;
     
     // 3. Additive M&A Takeovers
     if(a.includes('acq_rival')) gAdd+=0.5;
     if(a.includes('acq_data')) gAdd+=1.0;
     if(a.includes('acq_log')) gAdd+=2.0;
     if(a.includes('acq_social')) gAdd+=4.0;
     if(a.includes('acq_bank')) gAdd+=9.0;
     
     // 4. Temporary Global Events (The only multiplicative effect)
     if(evt && Date.now() < evt.expiresAt){ 
         if(evt.type==='boom') eGM=1.5; 
         if(evt.type==='recession') eGM=0.7; 
         if(evt.type==='labor_shortage') eCM=cRed>0?1.2:1.4; 
     }
     
     return { finalGross: (1 + gAdd) * eGM, finalCost: eCM, baseCostMod: (1-cRed), moraleRetain: mRetain };
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) { router.push("/"); return; }
      try {
        const q = query(collection(db, "users"), where("owner_uid", "==", user.uid));
        const querySnapshot = await getDocs(q);
        let username = "Agent";
        if (!querySnapshot.empty) { const p = querySnapshot.docs[0].data(); setPulseProfile(p); username = p.username || p.displayName || "Agent"; }
        const res = await fetch("/api/bank", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ firebaseUid: user.uid, username }) });
        const dbData = await res.json();
        
        if (dbData.data) {
          const d = dbData.data;
          setBalance(Number(d.bank_balance||0)); setFico(Number(d.fico_score||700)); setPlayerPath(d.player_path||null); setPathUpdatedAt(d.path_updated_at||null); setSelectedBank(d.selected_bank||null); setAccountNumber(d.account_number||null); setSavingsBalance(Number(d.savings_balance||0)); setLoanAccountBalance(Number(d.loan_account_balance||0)); setLoanBalance(Number(d.loan_balance||0)); setCurrentLocation(d.location||'bali');
          
          const lT = JSON.parse(localStorage.getItem('pulse_tax_state') || '{}');
          setNextTaxTime(Number(lT.next_tax_at||Date.now()+(10*60000))); setTaxCycleMinutes(Number(lT.tax_cycle_minutes||10)); setLazinessPenaltyUntil(Number(lT.laziness_penalty_until||0)); setEnergyBlockUntil(Number(lT.energy_block_until||0)); setFreePathSwitchUsed(Boolean(lT.free_path_switch_used||false));
          
          const pJSON = (data:any, f:any) => (!data ? f : (typeof data==='string'?JSON.parse(data):data));
          setOwnedProperties(pJSON(d.owned_properties, [])); setOwnedVehicles(pJSON(d.owned_vehicles, []));
          
          const safePort = pJSON(d.portfolio, { funds: {}, stocks: {}, angel: [] }); if(!safePort.funds)safePort.funds={}; if(!safePort.stocks)safePort.stocks={}; if(!safePort.angel)safePort.angel=[]; setPortfolio(safePort);
          const sData = pJSON(d.startup_data, { workload: 50, payroll: 50, morale: 100, is_strike: false, level: 1, companyName: "", ticker: "", equityOwned: 100, moraleBoostUntil: 0, upgrades: [], acquisitions: [] });
          if(!sData.upgrades) sData.upgrades=[]; if(!sData.acquisitions) sData.acquisitions=[]; setStartupData(sData);
          
          const level = Number(d.corporate_level||1); setCorporateLevel(level);
          const eLevel = d.player_path === 'founder' ? (sData.level||1) : level; const dMaxE = 100+((eLevel-1)*50); let lE = Number(d.energy!=null?d.energy:dMaxE);
          let offE = 0; let sSync = Date.now();
          
          if ((d.player_path === 'corporate' || d.player_path === 'founder') && d.last_salary_sync) {
              const lS = new Date(d.last_salary_sync).getTime(); const mOff = Math.floor((Date.now()-lS)/60000);
              if (mOff > 0 && mOff < 525600) { 
                 offE += mOff * (((safePort.funds?.vanguard||0)*0.001) + ((safePort.funds?.citadel||0)*0.005));
                 if (d.player_path === 'corporate') { 
                     offE += mOff * (getCorporateRole(level).payPerMinute); 
                 } 
                 else if (d.player_path === 'founder') {
                     const lvlM = sData.level||1; const locM = LOCATIONS[d.location||'bali'].multiplier;
                     const mults = getStartupMultipliers(sData, null);
                     const bCost = 100 * locM * lvlM * mults.baseCostMod;
                     
                     let mBst = 0; let mUnb = mOff;
                     if (sData.moraleBoostUntil && sData.moraleBoostUntil > lS) { const bL = Math.floor((sData.moraleBoostUntil-lS)/60000); if(bL>=mOff){mBst=mOff;mUnb=0;}else{mBst=bL;mUnb=mOff-bL;} }
                     let fM = sData.morale; let dStrk = sData.is_strike;
                     
                     if (mBst > 0) { 
                         fM = 100; dStrk = false; 
                         const g = sData.workload*15*locM*lvlM*mults.finalGross; 
                         const c = (sData.payroll*10*locM*lvlM*mults.finalCost)+bCost; 
                         let rN = (g-c); if(rN>0)rN*=(sData.equityOwned/100); offE += mBst*rN; 
                     }
                     if (mUnb > 0) {
                         let mChg = (sData.payroll-sData.workload)*0.5; if(sData.workload>50) mChg-=(sData.workload-50)*1.0; if(mults.moraleRetain>0 && mChg<0) mChg*=(1-mults.moraleRetain);
                         fM+=mChg*mUnb; if(fM<=0 && !dStrk){dStrk=true;fM=0;} else if(fM>=50 && dStrk){dStrk=false;fM=50;} fM=Math.max(0,Math.min(100,fM));
                         if(!dStrk){ 
                             const g = sData.workload*15*locM*lvlM*mults.finalGross; 
                             const c = (sData.payroll*10*locM*lvlM*mults.finalCost)+bCost; 
                             let rN = (g-c); if(rN>0)rN*=(sData.equityOwned/100); offE += mUnb*rN; 
                         } 
                         else { const sC = (sData.payroll*20*locM*lvlM*mults.finalCost)+bCost; offE += mUnb*-sC; }
                     }
                     setStartupData({...sData, morale: fM, is_strike: dStrk});
                 }
                 sSync = lS + (mOff * 60000);
              } else { sSync = lS; }
          }
          
          const tSal = Number(d.pending_salary||0) + offE; setPendingSalary(tSal); setLastLocalSync(sSync); if(offE!==0) saveGameState({ pending_salary: tSal, last_salary_sync: new Date(sSync).toISOString() });
          
          let eSync = Date.now();
          if (d.last_energy_sync) { const lES = new Date(d.last_energy_sync).getTime(); const mOff = Math.floor((Date.now()-lES)/60000); if (mOff > 0 && lE < dMaxE && Date.now() > Number(lT.energy_block_until||0)) { const i = Math.floor(mOff/2); lE = Math.min(dMaxE, lE+(i*5)); eSync = lES+(i*120000); } else { eSync = lES; } }
          setEnergy(lE); setLastEnergySyncState(eSync); if(lE!==Number(d.energy!=null?d.energy:dMaxE)) saveGameState({ energy: lE, last_energy_sync: new Date(eSync).toISOString() });
        }
      } catch (error) { console.error(error); } finally { setLoading(false); }
    });
    return () => unsubscribe();
  }, [router]);

  const saveGameState = async (updates: any) => {
    if (!auth.currentUser) return;
    try {
      const safe = { ...updates };
      ['bank_balance','savings_balance','loan_account_balance','loan_balance','fico_score'].forEach(k => { if(safe[k]!==undefined) safe[k]=Math.floor(Number(safe[k])); });
      if(safe.pending_salary!==undefined) safe.pending_salary=Number(Number(safe.pending_salary).toFixed(2));
      const lT:any={}; ['next_tax_at','tax_cycle_minutes','laziness_penalty_until','energy_block_until'].forEach(k => { if(safe[k]!==undefined){lT[k]=Number(safe[k]); delete safe[k];} });
      if(safe.free_path_switch_used!==undefined){lT.free_path_switch_used=Boolean(safe.free_path_switch_used); delete safe.free_path_switch_used;}
      if(Object.keys(lT).length>0) localStorage.setItem('pulse_tax_state', JSON.stringify({ ...JSON.parse(localStorage.getItem('pulse_tax_state')||'{}'), ...lT }));
      ['owned_properties','owned_vehicles','portfolio','startup_data'].forEach(k => { if(safe[k]!==undefined) safe[k]=JSON.stringify(safe[k]); });
      await fetch("/api/bank", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ firebaseUid: auth.currentUser.uid, updates: safe }) });
    } catch (e) { console.error("Save state error:", e); }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      if (nextTaxTimeRef.current && now >= nextTaxTimeRef.current) {
         const locId = currentLocationRef.current; const locStats = LOCATIONS[locId] || LOCATIONS.bali;
         const ownsHome = ownedPropertiesRef.current.some((id: string) => REAL_ESTATE[locId]?.find((p: any) => p.id === id));
         const upkeepCost = (ownsHome ? 0 : locStats.rent) + locStats.living;
         let newBal = balanceRef.current - upkeepCost; let newFico = ficoRef.current;
         if (newBal < 0) { newFico = Math.max(300, newFico - 20); newBal = 0; if (balanceRef.current <= 0) showAlert("Upkeep Failed", `You couldn't afford your $${upkeepCost} living expenses. FICO score dropped by 20 points!`); }
         setBalance(newBal); setFico(newFico); const newNext = now + 10*60000; nextTaxTimeRef.current = newNext; setTaxCycleMinutes(10); setNextTaxTime(newNext);
         saveGameState({ bank_balance: newBal, fico_score: newFico, tax_cycle_minutes: 10, next_tax_at: newNext });
      }
    }, 1000); return () => clearInterval(interval);
  }, []);

  useEffect(() => {
      if (playerPath !== 'founder') return;
      const eventInterval = setInterval(() => {
          const now = Date.now(); const level = startupDataRef.current?.level || 1;
          if (!marketEventRef.current || now > marketEventRef.current.expiresAt) {
              const roll = Math.random();
              if (level < 5) { if (roll < 0.15) setMarketEvent({ type: 'boom', name: 'TECH BOOM', message: 'Consumer spending surges! Gross Revenue +50%', expiresAt: now + (3 * 60000) }); else setMarketEvent(null); } 
              else { if (roll < 0.15) setMarketEvent({ type: 'boom', name: 'TECH BOOM', message: 'Consumer spending surges! Gross Revenue +50%', expiresAt: now + (3 * 60000) }); else if (roll < 0.30) setMarketEvent({ type: 'recession', name: 'MARKET DOWNTURN', message: 'Investors are pulling out. Gross Revenue -30%', expiresAt: now + (3 * 60000) }); else if (roll < 0.40) setMarketEvent({ type: 'labor_shortage', name: 'LABOR SHORTAGE', message: 'Workers demand higher pay. Payroll Costs +40%', expiresAt: now + (3 * 60000) }); else setMarketEvent(null); }
          }
      }, 60000); return () => clearInterval(eventInterval);
  }, [playerPath]);

  useEffect(() => {
    if (!lastLocalSync) return;
    let currentSync = lastLocalSync;
    const interval = setInterval(() => {
      const now = Date.now(); const sec = Math.floor((now - currentSync) / 1000);
      if (sec >= 1) {
          let net = 0; const isLazy = now < lazinessPenaltyUntilRef.current;
          if (!isLazy) {
              const funds = portfolioRef.current?.funds || {}; net += sec * ((((funds.vanguard||0)*0.001)/60) + (((funds.citadel||0)*0.005)/60));
              if (playerPath === 'corporate') { net += sec * (currentRole.payPerMinute / 60); } 
              else if (playerPath === 'founder' && startupDataRef.current?.companyName) {
                 const sD = startupDataRef.current; const evt = marketEventRef.current; const lM = sD.level||1; const locM = LOCATIONS[currentLocation]?.multiplier||1;
                 const mults = getStartupMultipliers(sD, evt);
                 const bCost = 100 * locM * lM * mults.baseCostMod;
                 if (!sD.is_strike) { const g = sD.workload*15*locM*lM*mults.finalGross; const c = (sD.payroll*10*locM*lM*mults.finalCost)+bCost; let rN = (g-c)/60; if(rN>0)rN*=(sD.equityOwned/100); net+=sec*rN; } 
                 else { const sC = (sD.payroll*20*locM*lM*mults.finalCost)+bCost; net+=sec*(-sC/60); }
              }
          }
          if (!isLazy && playerPath === 'founder' && startupDataRef.current?.companyName) {
             const sD = startupDataRef.current; const isBoost = Date.now() < (sD.moraleBoostUntil||0);
             if (isBoost) { if (sD.morale!==100 || sD.is_strike) setStartupData({ ...sD, morale: 100, is_strike: false }); } 
             else {
                 let mC = (sD.payroll-sD.workload)*0.5; if(sD.workload>50) mC-=(sD.workload-50)*1.0; 
                 const mults = getStartupMultipliers(sD, null); if(mults.moraleRetain>0 && mC<0) mC*=(1-mults.moraleRetain);
                 let nM = sD.morale + (sec*(mC/60)); nM = Math.max(0, Math.min(100, nM)); let nS = sD.is_strike;
                 if (nM<=0 && !nS) { nS=true; showAlert("🚨 WORKER STRIKE! 🚨", "Employees walked out! Production halted, but rent & payroll bleed continues!"); } 
                 else if (nM>=50 && nS) { nS=false; showAlert("✅ Strike Resolved", "Employees returned to work."); }
                 if (nM!==sD.morale || nS!==sD.is_strike) setStartupData({ ...sD, morale: nM, is_strike: nS });
             }
          }
          setPendingSalary(p => Number(p)+net); currentSync += sec*1000;
      }
    }, 1000); return () => clearInterval(interval);
  }, [playerPath, currentRole.payPerMinute, lastLocalSync, currentLocation]);

  useEffect(() => {
    const saveInterval = setInterval(() => { if (document.hidden) return; saveGameState({ pending_salary: displaySalaryRef.current, startup_data: startupDataRef.current, last_salary_sync: new Date().toISOString() }); }, 60000);
    return () => clearInterval(saveInterval);
  }, []);

  const handleSleep = async () => {
     const now = Date.now();
     if (now < energyBlockUntilRef.current) return await showAlert("Energy Blocked", `Energy is locked for ${Math.ceil((energyBlockUntilRef.current-now)/60000)}m due to a Corporate Retreat.`);
     if (now < lazinessPenaltyUntilRef.current) return await showAlert("Laziness Penalty", `Earnings paused for ${Math.ceil((lazinessPenaltyUntilRef.current-now)/60000)}m. Wake up!`);
     let nC = taxCycleMinutesRef.current; nC = nC===10?7 : nC===7?5 : nC===5?3 : nC===3?1 : 0;
     if (nC <= 0) {
         const pT = now+5*60000; const nT = now+10*60000; nextTaxTimeRef.current=nT; setLazinessPenaltyUntil(pT); setTaxCycleMinutes(10); setEnergy(maxEnergy); setNextTaxTime(nT);
         saveGameState({ energy: maxEnergy, laziness_penalty_until: pT, tax_cycle_minutes: 10, next_tax_at: nT });
         return await showAlert("Laziness Penalty!", "You slept too much! Passive income paused for 5m, tax cycle reset to 10m.");
     }
     const nT = now+nC*60000; nextTaxTimeRef.current=nT; setEnergy(maxEnergy); setTaxCycleMinutes(nC); setNextTaxTime(nT);
     saveGameState({ energy: maxEnergy, tax_cycle_minutes: nC, next_tax_at: nT });
     await showAlert("Well Rested", `Restored ${maxEnergy} Energy! Next tax cut arrives in just ${nC} minute(s).`);
  };

  const handleBankSelect = async (bankId: string | null) => {
     setSelectedBank(bankId); const updates: any = { selected_bank: bankId };
     if (bankId && !accountNumber) { const n = Array.from({length:25},()=>Math.floor(Math.random()*10)).join(''); setAccountNumber(n); updates.account_number=n; }
     saveGameState(updates); if(bankId) await showAlert("Account Opened", `Welcome to ${bankId.toUpperCase()}`);
  };

  const handleTransfer = async (dir: 'to_savings'|'to_current', nB?: number, nS?: number) => {
     if (nB!==undefined && nS!==undefined) { setBalance(nB); setSavingsBalance(nS); saveGameState({ bank_balance: nB, savings_balance: nS }); return; }
     const amt = parseFloat(transferAmount); if (isNaN(amt) || amt <= 0) return await showAlert("Error", "Invalid amount.");
     const cL = Number(balance); const cS = Number(savingsBalance);
     if (dir === 'to_savings') { if (cL < amt) return await showAlert("Error", "Insufficient liquid funds."); const nb=cL-amt, ns=cS+amt; setBalance(nb); setSavingsBalance(ns); saveGameState({ bank_balance: nb, savings_balance: ns }); } 
     else { if (cS < amt) return await showAlert("Error", "Insufficient savings funds."); const nb=cL+amt, ns=cS-amt; setBalance(nb); setSavingsBalance(ns); saveGameState({ bank_balance: nb, savings_balance: ns }); }
     setTransferAmount("");
  };

  const handleTakeLoan = async (amtStr: string) => {
     const amt = parseFloat(amtStr); if (isNaN(amt) || amt <= 0) return await showAlert("Error", "Invalid amount.");
     const mx = selectedBank==='summit_one'?fico*200:fico*100; const av = Math.max(0, mx-loanBalance);
     if (amt > av) return await showAlert("Credit Limit Exceeded", `Borrow limit: $${av.toLocaleString()}`);
     const nA = Number(loanAccountBalance)+amt; const nL = Number(loanBalance)+amt;
     setLoanAccountBalance(nA); setLoanBalance(nL); saveGameState({ loan_account_balance: nA, loan_balance: nL });
     await showAlert("Loan Approved", `$${amt.toLocaleString()} deposited to Loan Account.`);
  };

  const handleRepayLoan = async (amtStr: string) => {
     const amt = parseFloat(amtStr); if (isNaN(amt) || amt <= 0) return await showAlert("Error", "Invalid amount.");
     const act = Math.min(amt, loanBalance); if (act <= 0) return await showAlert("Notice", "No debt owed!");
     const accs = [{ id: "1", initials: "CA", name: "Current Account", details: `Available: $${balance.toLocaleString('en-US', {maximumFractionDigits:2})}` }, { id: "2", initials: "LA", name: "Loan Account", details: `Available: $${loanAccountBalance.toLocaleString('en-US', {maximumFractionDigits:2})}` }];
     const ch = await showAccountSelect("Repay Loan", `Choose source account.`, act, accs); if (!ch) return; 
     let nb=Number(balance), nl=Number(loanAccountBalance);
     if (ch==="1") { if (act>nb) return await showAlert("Error", "Insufficient liquid funds."); nb-=act; } 
     else if (ch==="2") { if (act>nl) return await showAlert("Error", "Insufficient loan funds."); nl-=act; } else return; 
     const nd = Number(loanBalance)-act; const fb = Math.floor(act/1000); const nf = Math.min(850, fico+(fb>0?fb:1));
     setBalance(nb); setLoanAccountBalance(nl); setLoanBalance(nd); setFico(nf); saveGameState({ bank_balance: nb, loan_account_balance: nl, loan_balance: nd, fico_score: nf });
     await showAlert("Repayment Successful", `Repaid $${act.toLocaleString()}! FICO increased by ${fb>0?fb:1} points.`);
  };

  const handleRelocate = async (cityId: string) => {
    const cost = 500; if (Number(balance) < cost) return await showAlert("Error", `Need $500 for a ticket.`);
    const nb = Number(balance) - cost; setBalance(nb); setCurrentLocation(cityId); saveGameState({ bank_balance: nb, location: cityId }); await showAlert("Flight Landed", `Welcome to ${LOCATIONS[cityId].name}.`);
  };

  const handleBuyProperty = async (propertyId: string) => {
    if (!selectedBank) return await showAlert("Bank Account Required", "Open a bank account first.");
    let pInfo:any=null; let cInfo:any=null; for (const [cId, props] of Object.entries(REAL_ESTATE)) { const f = props.find(p => p.id === propertyId); if(f){ pInfo=f; cInfo=LOCATIONS[cId]; break; } }
    if (!pInfo) return; const pr = pInfo.price;
    const accs = [{ id:"1", initials:"CA", name:"Current Account", details:`Avail: $${balance.toLocaleString()}` }, { id:"2", initials:"SV", name:"Savings Vault", details:`Avail: $${savingsBalance.toLocaleString()}` }, { id:"3", initials:"LA", name:"Loan Account", details:`Avail: $${loanAccountBalance.toLocaleString()}` }];
    const ch = await showAccountSelect("Purchase Property", `Purchasing ${pInfo.name}`, pr, accs); if (!ch) return;
    const nP = [...ownedProperties, pInfo.id]; let upds:any = { owned_properties: nP }; let nb=balance, ns=savingsBalance, nl=loanAccountBalance;
    if(ch==="1"){ if(balance<pr) return await showAlert("Error", `Need $${pr.toLocaleString()}`); nb-=pr; setBalance(nb); upds.bank_balance=nb; }
    else if(ch==="2"){ if(savingsBalance<pr) return await showAlert("Error", `Need $${pr.toLocaleString()}`); ns-=pr; setSavingsBalance(ns); upds.savings_balance=ns; }
    else if(ch==="3"){ if(loanAccountBalance<pr) return await showAlert("Error", `Need $${pr.toLocaleString()}`); nl-=pr; setLoanAccountBalance(nl); upds.loan_account_balance=nl; }
    setOwnedProperties(nP); saveGameState(upds); await showAlert("Purchase Successful", `Owned ${pInfo.name} in ${cInfo.name}! Rent permanently waived.`);
  };

  const handleSellProperty = async (propertyId: string) => {
    let pInfo:any=null; for (const [c, pps] of Object.entries(REAL_ESTATE)) { const f = pps.find(p => p.id === propertyId); if(f){ pInfo=f; break; } } if(!pInfo) return;
    const cf = await showConfirm("Sell Property", `Sell ${pInfo.name} for $${pInfo.price.toLocaleString()}?`); if (!cf) return;
    const nb = Number(balance) + pInfo.price; const nP = ownedProperties.filter(id => id !== propertyId);
    setBalance(nb); setOwnedProperties(nP); saveGameState({ bank_balance: nb, owned_properties: nP }); await showAlert("Property Sold", `$${pInfo.price.toLocaleString()} deposited.`);
  };

  const handleClaimSalary = async () => {
    const cS = Number(pendingSalary);
    if (playerPath === 'corporate') {
       if (cS < monthlySalaryTarget) return await showAlert("Error", `Need $${monthlySalaryTarget.toLocaleString()} accumulated.`);
       const tA = cS * locStats.tax; const nA = cS - tA;
       if (!selectedBank && balance+nA>50000) return await showAlert("Wallet Full", "Cannot hold >$50k without a bank account.");
       const nb = balance + nA; setBalance(nb); setPendingSalary(0); setLastLocalSync(Date.now()); saveGameState({ bank_balance: nb, pending_salary: 0, last_salary_sync: new Date().toISOString() });
       await showAlert("Payday!", `Gross: $${cS.toLocaleString()}\nTax: -$${tA.toLocaleString()}\nNet: $${nA.toLocaleString()}`);
    } else if (playerPath === 'founder') {
       if (cS >= 0) {
          const tA = cS * locStats.tax; const nA = cS - tA;
          if (!selectedBank && balance+nA>50000) return await showAlert("Wallet Full", "Cannot hold >$50k without a bank.");
          const nb = balance + nA; setBalance(nb); setPendingSalary(0); setLastLocalSync(Date.now()); saveGameState({ bank_balance: nb, pending_salary: 0, last_salary_sync: new Date().toISOString() });
          await showAlert("Dividend Claimed", `Gross Profit: $${cS.toLocaleString()}\nCorp Tax: -$${tA.toLocaleString()}\nNet: $${nA.toLocaleString()}`);
       } else {
          const d = Math.abs(cS); if (balance < d) return await showAlert("Warning", `Company in $${d.toLocaleString()} debt, insufficient funds to cover!`);
          const nb = balance - d; setBalance(nb); setPendingSalary(0); setLastLocalSync(Date.now()); saveGameState({ bank_balance: nb, pending_salary: 0, last_salary_sync: new Date().toISOString() });
          await showAlert("Debt Paid", `Wired $${d.toLocaleString()} to keep startup afloat.`);
       }
    }
  };

  const handleSwitchPathClick = async () => {
    if (pathUpdatedAt) { const h = (Date.now() - new Date(pathUpdatedAt).getTime()) / 3600000; if (h < 24) { if (!freePathSwitchUsed) { const c = await showConfirm("Free Switch", `Use your 1 free switch now?`); if(!c) return; } else return await showAlert("Access Denied", `Wait ${Math.ceil(24-h)} hrs to switch.`); } }
    setShowPathSelection(true);
  };

  const handlePathSelect = async (newPath: string) => {
    let fB = balance, fS = savingsBalance, fL = loanAccountBalance;
    if (newPath === 'founder') {
        const accs = [{ id:"1", initials:"CA", name:"Current", details:`$${balance.toLocaleString()}` }, { id:"2", initials:"SV", name:"Savings", details:`$${savingsBalance.toLocaleString()}` }, { id:"3", initials:"LA", name:"Loan", details:`$${loanAccountBalance.toLocaleString()}` }];
        const ch = await showAccountSelect("Startup Investment", "$50,000 init investment required.", 50000, accs); if (!ch) return;
        if(ch==="1"){if(balance<50000)return await showAlert("Error","Insufficient."); fB-=50000;} else if(ch==="2"){if(savingsBalance<50000)return await showAlert("Error","Insufficient."); fS-=50000;} else if(ch==="3"){if(loanAccountBalance<50000)return await showAlert("Error","Insufficient."); fL-=50000;}
        setBalance(fB); setSavingsBalance(fS); setLoanAccountBalance(fL);
    }
    let uFS = freePathSwitchUsed; if(pathUpdatedAt && (Date.now()-new Date(pathUpdatedAt).getTime())/3600000 < 24 && !freePathSwitchUsed){ uFS=true; setFreePathSwitchUsed(true); }
    const ns = new Date().toISOString(); setPlayerPath(newPath); setPathUpdatedAt(ns); setShowPathSelection(false);
    const u:any = { player_path: newPath, path_updated_at: ns, free_path_switch_used: uFS, last_salary_sync: ns, last_energy_sync: lastEnergySyncState?new Date(lastEnergySyncState).toISOString():ns };
    if (newPath === 'founder') { u.bank_balance=fB; u.savings_balance=fS; u.loan_account_balance=fL; const dS={ workload: 50, payroll: 50, morale: 100, is_strike: false, level: 1, companyName: "", ticker: "", equityOwned: 100, moraleBoostUntil: 0, upgrades: [], acquisitions: [] }; setStartupData(dS); u.startup_data=dS; } 
    else if (newPath === 'corporate') { setPendingSalary(0); setLastLocalSync(Date.now()); }
    const nE = 100+(((newPath==='founder'?1:corporateLevel)-1)*50); if(energy>nE){setEnergy(nE); u.energy=nE;} saveGameState(u);
  };

  const handleDevBypass = async () => {
     const i = await showPrompt("God Mode", "Add Cash:", "1000000"); if (!i) return; const a = parseFloat(i); if (isNaN(a)) return;
     const nb = balance+a; const nm = 100+(((playerPath==='founder'?(startupData.level||1):corporateLevel)-1)*50);
     const sd = {...startupData, upgrades:startupData.upgrades||[], acquisitions:startupData.acquisitions||[]};
     setBalance(nb); setEnergy(nm); setFico(850); setLoanBalance(0); setPathUpdatedAt(null); setFreePathSwitchUsed(false); setPendingSalary(playerPath==='corporate'?monthlySalaryTarget:0); setLastLocalSync(Date.now()); setLastEnergySyncState(Date.now()); setStartupData(sd); setEnergyBlockUntil(0); setLazinessPenaltyUntil(0);
     saveGameState({ bank_balance: nb, energy: nm, fico_score: 850, loan_balance: 0, path_updated_at: null, free_path_switch_used: false, pending_salary: playerPath==='corporate'?monthlySalaryTarget:0, last_salary_sync: new Date().toISOString(), last_energy_sync: new Date().toISOString(), startup_data: sd, energy_block_until: 0, laziness_penalty_until: 0 });
     await showAlert("God Mode", `Added $${a.toLocaleString()}, max FICO, clears debt/hangovers.`);
  };

  const handleResetState = async () => {
     const c = await showConfirm("Hard Reset", "Wipe game state back to 0?"); if (!c) return;
     const ds = { workload: 50, payroll: 50, morale: 100, is_strike: false, level: 1, companyName: "", ticker: "", equityOwned: 100, moraleBoostUntil: 0, upgrades: [], acquisitions: [] };
     setBalance(0); setSavingsBalance(0); setLoanAccountBalance(0); setLoanBalance(0); setFico(700); setEnergy(100); setPendingSalary(0); setCurrentLocation('bali'); setOwnedProperties([]); setOwnedVehicles([]); setPortfolio({ funds: {}, stocks: {}, angel: [] }); setStartupData(ds); setCorporateLevel(1); setEnergyBlockUntil(0); setLazinessPenaltyUntil(0); localStorage.removeItem('pulse_tax_state');
     saveGameState({ bank_balance: 0, savings_balance: 0, loan_account_balance: 0, loan_balance: 0, fico_score: 700, energy: 100, pending_salary: 0, location: 'bali', owned_properties: [], owned_vehicles: [], portfolio: { funds: {}, stocks: {}, angel: [] }, startup_data: ds, corporate_level: 1, path_updated_at: null, free_path_switch_used: false, last_salary_sync: new Date().toISOString(), last_energy_sync: new Date().toISOString(), energy_block_until: 0, laziness_penalty_until: 0 });
     await showAlert("Success", "Game state reset.");
  };

  if (loading) return <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-white"><Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-4" /><p className="text-zinc-500 font-mono text-sm uppercase tracking-widest animate-pulse">Syncing Secure Database...</p></div>;
  const displayName = pulseProfile?.username || pulseProfile?.displayName || "PlayerOne";
  const avatarUrl = pulseProfile?.theme?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=Fallback";

  return (
    <div className="flex h-screen bg-[#050505] text-zinc-300 font-sans selection:bg-indigo-500/30 overflow-hidden relative">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none z-0"></div>
      {modal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#050505]/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          {modal.type === 'account-select' ? <AccountSelectorUI modal={modal} closeModal={closeModal} /> : (
             <div className="bg-[#121214] border border-white/10 rounded-[24px] w-full max-w-md overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-200 flex flex-col"><div className="p-6"><div className="flex items-center gap-3 mb-4"><div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20"><AlertCircle className="w-5 h-5 text-indigo-400" /></div><h3 className="text-xl font-black text-white">{modal.title}</h3></div><p className="text-zinc-400 text-sm mb-6 whitespace-pre-wrap leading-relaxed">{modal.message}</p>{modal.type === 'prompt' && (<input type="text" autoFocus value={modalInput} onChange={(e) => setModalInput(e.target.value)} placeholder={modal.placeholder} className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors mb-6 font-mono text-sm shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]" onKeyDown={(e) => { if(e.key === 'Enter') closeModal(modalInput); }} />)}<div className="flex gap-3 justify-end mt-2">{(modal.type === 'confirm' || modal.type === 'prompt') && (<button onClick={() => closeModal(modal.type === 'prompt' ? null : false)} className="px-5 py-2.5 rounded-xl font-bold text-xs text-zinc-400 hover:text-white hover:bg-white/5 transition-colors border border-transparent hover:border-white/10">Cancel</button>)}<button onClick={() => closeModal(modal.type === 'prompt' ? modalInput : (modal.type === 'confirm' ? true : undefined))} className="px-6 py-2.5 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-[0_0_20px_rgba(79,70,229,0.3)]">{modal.type === 'alert' ? 'Acknowledge' : 'Confirm'}</button></div></div></div>
          )}
        </div>
      )}
      {(!playerPath || showPathSelection) && !modal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050505]/95 backdrop-blur-2xl p-4 overflow-y-auto">
           {playerPath && <button onClick={() => setShowPathSelection(false)} className="absolute top-8 right-8 text-zinc-500 hover:text-white transition-colors bg-white/5 p-2 rounded-full"><X className="w-6 h-6" /></button>}
           <div className="max-w-5xl w-full py-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
              <div className="text-center mb-12"><h1 className="text-5xl md:text-6xl font-black tracking-tighter text-white mb-4">Choose Your Path</h1><p className="text-zinc-400 text-lg max-w-xl mx-auto">Your choice determines your gameplay mechanics, income style, and risks.</p></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <button onClick={() => handlePathSelect('hustler')} className={`group border rounded-3xl p-8 text-left transition-all flex flex-col justify-between min-h-[400px] cursor-pointer ${playerPath === 'hustler' ? 'bg-emerald-500/10 border-emerald-500/50 shadow-[0_0_40px_rgba(16,185,129,0.15)]' : 'bg-[#121214] border-white/10 hover:border-emerald-500/50 hover:-translate-y-2'}`}><div><div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20 mb-6"><Zap className="w-7 h-7 text-emerald-400" /></div><h3 className="text-2xl font-black text-white mb-2">The Street Hustler</h3><p className="text-zinc-400 text-sm leading-relaxed mb-6">Active gameplay. Take on gig economy jobs. Click to complete tasks. Finish fast for bonuses.</p></div></button>
                 <button onClick={() => handlePathSelect('corporate')} className={`group border rounded-3xl p-8 text-left transition-all flex flex-col justify-between min-h-[400px] cursor-pointer ${playerPath === 'corporate' ? 'bg-indigo-500/10 border-indigo-500/50 shadow-[0_0_40px_rgba(99,102,241,0.15)]' : 'bg-[#121214] border-white/10 hover:border-indigo-500/50 hover:-translate-y-2'}`}><div><div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20 mb-6"><Briefcase className="w-7 h-7 text-indigo-400" /></div><h3 className="text-2xl font-black text-white mb-2">Corporate Worker</h3><p className="text-zinc-400 text-sm leading-relaxed mb-6">Stable passive income. Accrue salary per minute and claim monthly. Perform "Boss Tasks" to earn promotions.</p></div></button>
                 <button onClick={() => handlePathSelect('founder')} className={`group border rounded-3xl p-8 text-left transition-all flex flex-col justify-between min-h-[400px] cursor-pointer relative overflow-hidden ${playerPath === 'founder' ? 'bg-orange-500/10 border-orange-500/50 shadow-[0_0_40px_rgba(249,115,22,0.15)]' : 'bg-[#121214] border-white/10 hover:border-orange-500/50 hover:-translate-y-2'}`}><div><div className="w-14 h-14 bg-orange-500/10 rounded-2xl flex items-center justify-center border border-orange-500/20 mb-6"><Building2 className="w-7 h-7 text-orange-400" /></div><h3 className="text-2xl font-black text-white mb-2">The Founder</h3><p className="text-zinc-400 text-sm leading-relaxed mb-6">Manage a global startup. Balance workload and payroll. Highly volatile income, massive upside potential, but strikes can bankrupt you.</p></div><div className="mt-auto pt-6"><p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest border border-orange-500/20 bg-orange-500/10 px-3 py-1.5 rounded-lg inline-block w-max">Requires $50,000 Investment</p></div></button>
              </div>
           </div>
        </div>
      )}
      {activeJob && (
        <ActiveJobModal job={activeJob} onClose={() => setActiveJob(null)} onComplete={async (success, tRem) => { setActiveJob(null); let nBal = Number(balance); if (activeJob.isPromotion) { if (success) { const nLvl = corporateLevel + 1; setCorporateLevel(nLvl); const nE = 100 + ((nLvl - 1) * 50); await showAlert("Rank Up!", `You leveled up to Level ${nLvl}! Max Energy increased to ${nE}.`); saveGameState({ corporate_level: nLvl }); } else { await showAlert("Failed", `Time's up! You failed the challenge.`); } return; } if (activeJob.isExpansion) { if (success) { const sD = startupDataRef.current; const nLvl = (sD.level || 1) + 1; const nSD = { ...sD, level: nLvl }; const nE = 100 + ((nLvl - 1) * 50); setStartupData(nSD); saveGameState({ startup_data: nSD }); await showAlert("Expansion Successful!", `Startup is now Level ${nLvl}. Max Energy is ${nE}, revenue/costs scaled up!`); } else { await showAlert("Expansion Failed", `Time's up! Expansion failed. Better luck next time.`); } return; } if (success) { const bonus = tRem * 0.50; let tE = activeJob.basePay + bonus; if (!selectedBank && nBal + tE > 50000) { const a = 50000 - nBal; if (a <= 0) { await showAlert("Wallet Full!", "Pockets are full! Need bank account. Job payout discarded."); tE = 0; } else { await showAlert("Wallet Full!", `Only room for $${a.toFixed(2)}. Claimed partial payout.`); tE = a; } } else { await showAlert("Job Complete!", `Earned $${activeJob.basePay} + $${bonus.toFixed(2)} speed bonus!`); } nBal += tE; } else { const pen = activeJob.basePay * 0.20; nBal -= pen; await showAlert("Job Failed", `Failed job. Fined $${pen.toFixed(2)}!`); } setBalance(nBal); saveGameState({ bank_balance: nBal }); }} />
      )}
      <aside className="hidden lg:flex w-64 bg-[#0a0a0c]/80 backdrop-blur-xl border-r border-white/5 flex-col z-20 shrink-0">
        <div className="p-6 border-b border-white/5 flex items-center gap-3"><img src="/icon.svg" alt="Pulse" className="w-7 h-7 object-contain" /><span className="font-black text-xl tracking-tighter text-white">Pulse<span className="text-zinc-600">Network</span></span></div>
        <div className="flex-1 px-4 py-6 space-y-8 overflow-y-auto">
          <div><p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest ml-2 mb-3">Central Hub</p><div className="space-y-1">{TABS.map(tab => (<button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors ${activeTab === tab.id ? 'bg-gradient-to-r from-indigo-500/10 to-transparent text-indigo-400 border-l-2 border-indigo-500 shadow-[inset_0_0_20px_rgba(99,102,241,0.05)]' : 'text-zinc-400 hover:bg-white/5 hover:text-white font-medium'}`}><tab.icon className="w-4 h-4" /> {tab.label}</button>))}</div></div>
        </div>
      </aside>
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[60] bg-[#0a0a0c]/90 backdrop-blur-xl border-t border-white/10 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
         <div className="flex justify-between items-center px-2 py-2">
            {MOBILE_TABS.map(tab => (<button key={tab.id} onClick={() => { setActiveTab(tab.id); setIsMobileMenuOpen(false); }} className={`flex-1 flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${activeTab === tab.id && !isMobileMenuOpen ? 'text-indigo-400' : 'text-zinc-500 hover:text-zinc-300'}`}><div className={`p-1.5 rounded-lg transition-colors ${activeTab === tab.id && !isMobileMenuOpen ? 'bg-indigo-500/20' : 'bg-transparent'}`}><tab.icon className="w-5 h-5" /></div><span className="text-[9px] font-bold tracking-widest uppercase truncate max-w-[60px]">{tab.label.split(' ')[0]}</span></button>))}
            <button onClick={() => setIsMobileMenuOpen(true)} className={`flex-1 flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${isMobileMenuOpen ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}><div className={`p-1.5 rounded-lg transition-colors ${isMobileMenuOpen ? 'bg-white/10' : 'bg-transparent'}`}><Menu className="w-5 h-5" /></div><span className="text-[9px] font-bold tracking-widest uppercase">More</span></button>
         </div>
      </div>
      {isMobileMenuOpen && (
         <div className="lg:hidden fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 flex flex-col justify-end"><div className="absolute inset-0" onClick={() => setIsMobileMenuOpen(false)}></div><div className="bg-[#121214] border-t border-white/10 rounded-t-[32px] p-6 pb-8 shadow-[0_-20px_50px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom-8 relative z-10"><div className="flex justify-between items-center mb-6"><h2 className="text-xl font-black text-white">Network Hub</h2><button onClick={() => setIsMobileMenuOpen(false)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition"><X className="w-5 h-5"/></button></div><div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-6">{TABS.map(tab => (<button key={tab.id} onClick={() => { setActiveTab(tab.id); setIsMobileMenuOpen(false); }} className={`flex flex-col items-center justify-center gap-3 p-4 rounded-2xl border transition-all ${activeTab === tab.id ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400' : 'bg-black/40 border-white/5 text-zinc-400 hover:bg-white/5 hover:text-white'}`}><tab.icon className="w-6 h-6" /><span className="text-[9px] font-bold uppercase tracking-wider text-center leading-tight">{tab.label.replace(' & ', '\n& ')}</span></button>))}</div><div className="pt-6 border-t border-white/5 space-y-3">{displayName.toLowerCase() === 'sour' && (<div className="flex gap-3 mb-3"><button onClick={() => { handleResetState(); setIsMobileMenuOpen(false); }} className="flex-1 flex items-center justify-center gap-2 bg-orange-500/10 border border-orange-500/30 text-orange-500 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-500/20 transition"><RefreshCw className="w-4 h-4" /> Reset</button><button onClick={() => { handleDevBypass(); setIsMobileMenuOpen(false); }} className="flex-1 flex items-center justify-center gap-2 bg-red-500/10 border border-red-500/30 text-red-500 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500/20 transition"><Zap className="w-4 h-4" /> God Mode</button></div>)}</div></div></div>
      )}
      <main className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden relative z-10 min-h-0" style={{ transform: 'translateZ(0)' }}>
        <style dangerouslySetInnerHTML={{ __html: `html, body { overflow: hidden !important; } ::-webkit-scrollbar { width: 6px; height: 0px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; } ::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.2); } * { scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.1) transparent; }`}} />
        <header className="p-4 sm:p-6 md:px-8 flex justify-between items-center sticky top-0 z-30 bg-[#050505]/80 backdrop-blur-md border-b border-white/5">
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="flex flex-col cursor-pointer group" onClick={() => setActiveTab('real_estate')}>
               <span className="hidden sm:block text-[9px] font-bold tracking-widest text-zinc-500 uppercase ml-1 mb-1 group-hover:text-cyan-400 transition-colors">Location</span>
               <div className="flex items-center gap-1.5 sm:gap-2 bg-[#121214] border border-white/10 rounded-full pl-1 pr-3 sm:pr-4 py-1 shadow-md group-hover:bg-white/5 transition-colors"><div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-cyan-900/30 border border-cyan-500/30 flex items-center justify-center group-hover:scale-105 transition-transform"><MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400" /></div><span className="text-sm font-bold text-white tracking-wide">{locStats.name} <span className={`hidden sm:inline-block font-mono text-[10px] uppercase ml-1 px-1.5 py-0.5 rounded ${locStats.tax === 0 ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'}`}>{(locStats.tax * 100).toFixed(0)}% Tax</span></span></div>
            </div>
            <div className="flex flex-col">
               <span className="hidden sm:block text-[9px] font-bold tracking-widest text-zinc-500 uppercase ml-1 mb-1">Energy Bar</span>
               <div className="flex items-center gap-2 sm:gap-3 bg-[#121214] border border-white/10 rounded-full pl-1 pr-3 sm:pr-4 py-1 shadow-md"><div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-yellow-900/30 border border-yellow-500/30 flex items-center justify-center"><Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-400 fill-yellow-400/20" /></div><div className="flex flex-col justify-center"><div className="w-16 sm:w-24 h-1.5 bg-white/10 rounded-full overflow-hidden mb-1"><div className="h-full bg-gradient-to-r from-orange-500 to-yellow-400 rounded-full transition-all duration-300" style={{ width: `${(energy / maxEnergy) * 100}%` }}></div></div><span className="text-[9px] sm:text-[10px] font-mono text-zinc-400 leading-none">{Math.floor(energy)}/{maxEnergy}</span></div></div>
            </div>
            <div className="flex sm:mt-4"><button onClick={handleSleep} className="flex items-center justify-center sm:gap-2 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 w-9 h-9 sm:w-auto sm:h-auto sm:px-4 sm:py-2 rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-indigo-500/20 transition shadow-[0_0_15px_rgba(99,102,241,0.2)]"><Moon className="w-4 h-4 sm:w-3.5 sm:h-3.5" /> <span className="hidden sm:block">Sleep ({maxEnergy}⚡)</span></button></div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
             {Date.now() < lazinessPenaltyUntil && <div className="hidden lg:flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-500 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest mr-2 animate-pulse">[LAZY]</div>}
             {Date.now() < energyBlockUntil && <div className="hidden lg:flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest mr-2 animate-pulse">[BLOCKED]</div>}
             {displayName.toLowerCase() === 'sour' && (<div className="hidden lg:flex items-center gap-2"><button onClick={handleResetState} className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 text-orange-500 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-orange-500/20 transition shadow-[0_0_15px_rgba(249,115,22,0.2)]"><RefreshCw className="w-3 h-3" /> Reset</button><button onClick={handleDevBypass} className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-500 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-red-500/20 transition shadow-[0_0_15px_rgba(239,68,68,0.2)]"><Zap className="w-3 h-3" /> God Mode</button></div>)}
             <div className="flex items-center gap-2 sm:gap-3 bg-[#121214] border border-white/10 rounded-full pl-2 sm:pl-4 pr-1 py-1 shadow-md cursor-pointer hover:bg-white/5 transition-colors"><div className="hidden sm:flex flex-col items-end"><span className="text-[9px] font-bold tracking-widest text-zinc-500 uppercase">Agent</span><span className="text-sm font-bold text-white tracking-wide">{displayName}</span></div><img src={avatarUrl} alt="Avatar" className="w-7 h-7 sm:w-10 sm:h-10 rounded-full border-2 border-zinc-800 bg-zinc-900 object-cover" /><ChevronDown className="hidden sm:block w-4 h-4 text-zinc-500 mr-2" /></div>
          </div>
        </header>
        <div className="p-4 sm:p-6 md:p-8 pt-4 pb-32 lg:pb-12">
          {activeTab === 'overview' && (
             <OverviewTab 
                netWorth={totalNetWorth} balance={balance} savingsBalance={savingsBalance} loanAccountBalance={loanAccountBalance} assetValue={assetValue} loanBalance={loanBalance} fico={fico} playerPath={playerPath} netWorthHistory={netWorthHistory} currentLocName={locStats.name} energy={energy} ownedVehicles={ownedVehicles} setBalance={setBalance} setSavingsBalance={setSavingsBalance} setLoanAccountBalance={setLoanAccountBalance} setEnergy={setEnergy} setActiveJob={setActiveJob} saveGameState={saveGameState} handleSwitchPathClick={handleSwitchPathClick} corporateLevel={corporateLevel} currentRole={currentRole} displaySalary={displaySalaryRef.current} pendingSalary={pendingSalary} monthlySalaryTarget={monthlySalaryTarget} salaryProgressPercentage={Math.min(100, (Number(pendingSalary) / monthlySalaryTarget) * 100)} handleClaimSalary={handleClaimSalary} currentLocation={currentLocation} ownedProperties={ownedProperties} startupData={startupData} setStartupData={setStartupData} locMultiplier={locStats.multiplier} getStartupMultipliers={getStartupMultipliers} showAlert={showAlert} showConfirm={showConfirm} showPrompt={showPrompt} nextTaxTime={nextTaxTime} taxCycleMinutes={taxCycleMinutes} marketEvent={marketEvent} energyBlockUntil={energyBlockUntil} setEnergyBlockUntil={setEnergyBlockUntil} showAccountSelect={showAccountSelect}
             />
          )}
          {activeTab === 'banking' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
               <BankingTab balance={balance} savingsBalance={savingsBalance} loanBalance={loanBalance} loanAccountBalance={loanAccountBalance} fico={fico} selectedBank={selectedBank} accountNumber={accountNumber} transferAmount={transferAmount} setTransferAmount={setTransferAmount} handleBankSelect={handleBankSelect} handleTransfer={handleTransfer} handleTakeLoan={handleTakeLoan} handleRepayLoan={handleRepayLoan} displayName={displayName} showPrompt={showPrompt} showAlert={showAlert} showConfirm={showConfirm} showAccountSelect={showAccountSelect} />
            </div>
          )}
          {activeTab === 'real_estate' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
               <RealEstateTab currentLocation={currentLocation} ownedProperties={ownedProperties} handleRelocate={handleRelocate} handleBuyProperty={handleBuyProperty} handleSellProperty={handleSellProperty} />
            </div>
          )}
          {activeTab === 'lifestyle' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
               <LifestyleTab balance={balance} energy={energy} maxEnergy={maxEnergy} ownedVehicles={ownedVehicles} setBalance={setBalance} setEnergy={setEnergy} setOwnedVehicles={setOwnedVehicles} saveGameState={saveGameState} showAlert={showAlert} showConfirm={showConfirm} showAccountSelect={showAccountSelect} selectedBank={selectedBank} savingsBalance={savingsBalance} loanAccountBalance={loanAccountBalance} setSavingsBalance={setSavingsBalance} setLoanAccountBalance={setLoanAccountBalance} energyBlockUntil={energyBlockUntil} />
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