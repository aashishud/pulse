"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Activity, Globe, MapPin, Zap, ChevronDown, Loader2, LogOut, X, Landmark, TrendingUp, ShoppingBag, Briefcase, Lock, Building2, RefreshCw } from 'lucide-react';

import { LOCATIONS, REAL_ESTATE, VEHICLES, CRYPTO_ASSETS } from '@/lib/network-data';
import { PulseNetworkLogo, ActiveJobModal } from '@/components/network/SharedUI';
import OverviewTab from '@/components/network/OverviewTab';
import BankingTab from '@/components/network/BankingTab';
import RealEstateTab from '@/components/network/RealEstateTab';
import LifestyleTab from '@/components/network/LifestyleTab';
import MarketsTab from '@/components/network/MarketsTab';

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
  const [selectedBank, setSelectedBank] = useState<string | null>(null);
  const [corporateLevel, setCorporateLevel] = useState(1);
  
  const [currentLocation, setCurrentLocation] = useState('bali');
  const [ownedProperties, setOwnedProperties] = useState<string[]>([]);
  const [ownedVehicles, setOwnedVehicles] = useState<string[]>([]);
  const [portfolio, setPortfolio] = useState<Record<string, any>>({});
  const [startupData, setStartupData] = useState<any>({ workload: 50, payroll: 50, morale: 100, is_strike: false, level: 1 });
  
  const [pendingSalary, setPendingSalary] = useState(0); 
  const [lastLocalSync, setLastLocalSync] = useState<number | null>(null);
  const [lastEnergySyncState, setLastEnergySyncState] = useState<number | null>(null);
  
  const [activeTab, setActiveTab] = useState('overview');
  const [activeJob, setActiveJob] = useState<any>(null);
  const [showPathSelection, setShowPathSelection] = useState(false);
  const [transferAmount, setTransferAmount] = useState("");

  const displaySalaryRef = useRef(pendingSalary);
  const startupDataRef = useRef(startupData);
  useEffect(() => { displaySalaryRef.current = pendingSalary; }, [pendingSalary]);
  useEffect(() => { startupDataRef.current = startupData; }, [startupData]);

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
        if (Object.keys(portfolio).length === 0) {
           setLivePortfolioValue(0);
           return;
        }
        try {
           const res = await fetch(`/api/crypto`);
           const data = await res.json();
           let val = 0;
           
           Object.entries(CRYPTO_ASSETS).forEach(([ticker, crypto]) => {
              if (portfolio[ticker]?.shares) {
                 const item = data.find((d: any) => d.symbol === crypto.symbol);
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
     const int = setInterval(fetchPortfolioValue, 3000);
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
          
          let loadedEnergy = dbData.data.energy != null ? Number(dbData.data.energy) : 100;
          
          setFico(dbData.data.fico_score != null ? Number(dbData.data.fico_score) : 700);
          setPlayerPath(dbData.data.player_path || null);
          setPathUpdatedAt(dbData.data.path_updated_at || null);
          setSelectedBank(dbData.data.selected_bank || null);
          setAccountNumber(dbData.data.account_number || null);
          setSavingsBalance(dbData.data.savings_balance != null ? Number(dbData.data.savings_balance) : 0);
          setLoanAccountBalance(dbData.data.loan_account_balance != null ? Number(dbData.data.loan_account_balance) : 0);
          setLoanBalance(dbData.data.loan_balance != null ? Number(dbData.data.loan_balance) : 0);
          setCurrentLocation(dbData.data.location || 'bali');
          
          const parseJSON = (data: any, fallback: any) => {
             if (!data) return fallback;
             return typeof data === 'string' ? JSON.parse(data) : data;
          };
          setOwnedProperties(parseJSON(dbData.data.owned_properties, []));
          setOwnedVehicles(parseJSON(dbData.data.owned_vehicles, []));
          setPortfolio(parseJSON(dbData.data.portfolio, {}));
          setStartupData(parseJSON(dbData.data.startup_data, { workload: 50, payroll: 50, morale: 100, is_strike: false, level: 1 }));

          const level = dbData.data.corporate_level != null ? Number(dbData.data.corporate_level) : 1;
          setCorporateLevel(level);
          
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
                     const sData = parseJSON(dbData.data.startup_data, { workload: 50, payroll: 50, is_strike: false, level: 1 });
                     const levelMult = sData.level || 1;
                     const locMulti = LOCATIONS[dbData.data.location || 'bali'].multiplier;
                     const baseOpCost = 100 * locMulti * levelMult;
                     
                     // === OFFLINE MORALE PENALTY CHECK ===
                     // If you log off with >50% Workload, you WILL trigger a strike while offline!
                     let moraleChangePerMin = (sData.payroll - sData.workload) * 0.5;
                     if (sData.workload > 50) moraleChangePerMin -= (sData.workload - 50) * 1.0;
                     
                     let finalMorale = sData.morale + (moraleChangePerMin * minutesOffline);
                     let didStrikeOffline = false;
                     
                     if (finalMorale <= 0 && !sData.is_strike) {
                         didStrikeOffline = true;
                         finalMorale = 0;
                     } else if (finalMorale >= 50 && sData.is_strike) {
                         finalMorale = 50;
                     }
                     
                     finalMorale = Math.max(0, Math.min(100, finalMorale));

                     if (!sData.is_strike && !didStrikeOffline) {
                        const gross = sData.workload * 15 * locMulti * levelMult;
                        const cost = (sData.payroll * 10 * locMulti * levelMult) + baseOpCost;
                        offlineEarnings = minutesOffline * (gross - cost);
                     } else {
                        // If they struck offline, punish them for the whole duration to prevent cheating
                        const strikeCost = (sData.payroll * 20 * locMulti * levelMult) + baseOpCost;
                        offlineEarnings = minutesOffline * -strikeCost;
                     }
                     
                     setStartupData({...sData, morale: finalMorale, is_strike: didStrikeOffline || sData.is_strike});
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
              if (minutesOffline > 0 && loadedEnergy < 100) {
                 const intervals = Math.floor(minutesOffline / 2);
                 loadedEnergy = Math.min(100, loadedEnergy + (intervals * 5));
                 energySyncAnchor = lastEnergySync + (intervals * 120000);
              } else { energySyncAnchor = lastEnergySync; }
          }
          setEnergy(loadedEnergy);
          setLastEnergySyncState(energySyncAnchor);
          if (loadedEnergy !== (dbData.data.energy != null ? Number(dbData.data.energy) : 100)) saveGameState({ energy: loadedEnergy, last_energy_sync: new Date(energySyncAnchor).toISOString() });
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
      
      if (safeUpdates.owned_properties !== undefined) safeUpdates.owned_properties = JSON.stringify(safeUpdates.owned_properties);
      if (safeUpdates.owned_vehicles !== undefined) safeUpdates.owned_vehicles = JSON.stringify(safeUpdates.owned_vehicles);
      if (safeUpdates.portfolio !== undefined) safeUpdates.portfolio = JSON.stringify(safeUpdates.portfolio);
      if (safeUpdates.startup_data !== undefined) safeUpdates.startup_data = JSON.stringify(safeUpdates.startup_data);

      await fetch("/api/bank", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ firebaseUid: auth.currentUser.uid, updates: safeUpdates }) });
    } catch (error) { console.error("Failed to sync game state:", error); }
  };

  useEffect(() => {
    if (!lastEnergySyncState) return;
    let currentSync = lastEnergySyncState;
    const interval = setInterval(() => {
      const now = Date.now();
      const minutesPassed = Math.floor((now - currentSync) / 60000);
      if (minutesPassed >= 2) {
          const intervals = Math.floor(minutesPassed / 2);
          setEnergy(prev => {
              const currentEnergy = Number(prev);
              if (currentEnergy >= 100) return currentEnergy;
              const newEnergy = Math.min(100, currentEnergy + (intervals * 5));
              saveGameState({ energy: newEnergy, last_energy_sync: new Date(now).toISOString() });
              return newEnergy;
          });
          currentSync += intervals * 120000;
          setLastEnergySyncState(currentSync); 
      }
    }, 1000); 
    return () => clearInterval(interval);
  }, [lastEnergySyncState]);

  useEffect(() => {
    if ((playerPath !== 'corporate' && playerPath !== 'founder') || !lastLocalSync) return;
    
    let currentSync = lastLocalSync;

    const interval = setInterval(() => {
      const now = Date.now();
      const secondsPassed = Math.floor((now - currentSync) / 1000);
      
      if (secondsPassed >= 1) {
          let netEarnings = 0;
          
          if (playerPath === 'corporate') {
             netEarnings = secondsPassed * (currentRole.payPerMinute / 60);
          } 
          else if (playerPath === 'founder') {
             const sData = startupDataRef.current;
             const levelMult = sData.level || 1;
             const locMulti = LOCATIONS[currentLocation]?.multiplier || 1;
             let moraleChange = 0;

             const baseOpCost = 100 * locMulti * levelMult;

             if (!sData.is_strike) {
                const gross = sData.workload * 15 * locMulti * levelMult;
                const cost = (sData.payroll * 10 * locMulti * levelMult) + baseOpCost;
                netEarnings = secondsPassed * ((gross - cost) / 60);
             } else {
                const strikeCost = (sData.payroll * 20 * locMulti * levelMult) + baseOpCost;
                netEarnings = secondsPassed * (-strikeCost / 60); 
             }
             
             // === NEW OVERWORK PENALTY MATH (LIVE TICKER) ===
             let moraleChangePerMin = (sData.payroll - sData.workload) * 0.5;
             if (sData.workload > 50) {
                 moraleChangePerMin -= (sData.workload - 50) * 1.0; 
             }
             moraleChange = secondsPassed * (moraleChangePerMin / 60);
             
             let newMorale = sData.morale + moraleChange;
             newMorale = Math.max(0, Math.min(100, newMorale));
             
             let newStrike = sData.is_strike;
             if (newMorale <= 0 && !newStrike) {
                newStrike = true;
                alert("🚨 WORKER STRIKE! 🚨 Your employees have walked out due to low morale! Production has halted, but you are still bleeding rent and payroll expenses!");
             } else if (newMorale >= 50 && newStrike) {
                newStrike = false;
                alert("✅ Strike Resolved! Your employees have returned to work.");
             }

             if (newMorale !== sData.morale || newStrike !== sData.is_strike) {
                const newSData = { ...sData, morale: newMorale, is_strike: newStrike };
                setStartupData(newSData);
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
        saveGameState({ pending_salary: displaySalaryRef.current, startup_data: startupDataRef.current, last_salary_sync: new Date().toISOString() });
    }, 15000);
    return () => clearInterval(saveInterval);
  }, [playerPath]);

  const handleBankSelect = (bankId: string | null) => {
     setSelectedBank(bankId);
     const updates: any = { selected_bank: bankId };
     if (bankId && !accountNumber) {
        const newAccNum = Array.from({length: 25}, () => Math.floor(Math.random() * 10)).join('');
        setAccountNumber(newAccNum);
        updates.account_number = newAccNum;
     }
     saveGameState(updates);
     if(bankId) alert("Account successfully opened! Welcome to " + bankId.toUpperCase());
  };

  const handleTransfer = (direction: 'to_savings' | 'to_current') => {
     const amount = parseFloat(transferAmount);
     if (isNaN(amount) || amount <= 0) return alert("Please enter a valid amount.");

     const currentLiquid = Number(balance);
     const currentSav = Number(savingsBalance);

     if (direction === 'to_savings') {
        if (currentLiquid < amount) return alert("Insufficient liquid funds.");
        const newBal = currentLiquid - amount;
        const newSav = currentSav + amount;
        setBalance(newBal);
        setSavingsBalance(newSav);
        saveGameState({ bank_balance: newBal, savings_balance: newSav });
     } else {
        if (currentSav < amount) return alert("Insufficient savings funds.");
        const newBal = currentLiquid + amount;
        const newSav = currentSav - amount;
        setBalance(newBal);
        setSavingsBalance(newSav);
        saveGameState({ bank_balance: newBal, savings_balance: newSav });
     }
     setTransferAmount("");
  };

  const handleTakeLoan = (amountStr: string) => {
     const amount = parseFloat(amountStr);
     if (isNaN(amount) || amount <= 0) return alert("Invalid amount.");
     
     const maxLoan = selectedBank === 'capital_none' ? fico * 200 : fico * 50;
     const availableCredit = Math.max(0, maxLoan - loanBalance);
     
     if (amount > availableCredit) return alert(`Credit limit exceeded. You can only borrow up to $${availableCredit.toLocaleString('en-US')}.`);
     
     const newLoanAccBal = Number(loanAccountBalance) + amount;
     const newLoanDebt = Number(loanBalance) + amount;
     
     setLoanAccountBalance(newLoanAccBal);
     setLoanBalance(newLoanDebt);
     saveGameState({ loan_account_balance: newLoanAccBal, loan_balance: newLoanDebt });
     alert(`Loan approved! $${amount.toLocaleString('en-US')} has been deposited to your locked Loan Account.`);
  };

  const handleRepayLoan = (amountStr: string) => {
     const amount = parseFloat(amountStr);
     if (isNaN(amount) || amount <= 0) return alert("Invalid amount.");
     
     const actualRepayment = Math.min(amount, loanBalance);
     if (actualRepayment <= 0) return alert("You don't owe any money!");

     const accountChoice = prompt(`Repay $${actualRepayment.toLocaleString()} from which account?\n\n1: Current Account\n2: Loan Account (Return unused funds)`, "1");
     
     let newBal = Number(balance);
     let newLoanAccBal = Number(loanAccountBalance);

     if (accountChoice === "1") {
         if (actualRepayment > newBal) return alert("Insufficient liquid funds in Current Account.");
         newBal -= actualRepayment;
     } else if (accountChoice === "2") {
         if (actualRepayment > newLoanAccBal) return alert("Insufficient funds in Loan Account.");
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
     
     alert(`Successfully repaid $${actualRepayment.toLocaleString('en-US')}! Your FICO score increased by ${ficoBoost > 0 ? ficoBoost : 1} points.`);
  };

  const handleRelocate = (cityId: string) => {
    const flightCost = 500;
    if (Number(balance) < flightCost) return alert(`Insufficient liquid funds to relocate. You need $${flightCost} for a ticket.`);
    
    const newBal = Number(balance) - flightCost;
    setBalance(newBal);
    setCurrentLocation(cityId);
    saveGameState({ bank_balance: newBal, location: cityId });
    alert(`Flight landed! Welcome to ${LOCATIONS[cityId].name}.`);
  };

  const handleBuyProperty = (propertyId: string) => {
    let propertyInfo: any = null;
    let cityInfo: any = null;
    for (const [cId, props] of Object.entries(REAL_ESTATE)) {
       const found = props.find(p => p.id === propertyId);
       if (found) { propertyInfo = found; cityInfo = LOCATIONS[cId]; break; }
    }
    if (!propertyInfo) return;

    const price = propertyInfo.price;
    const accountChoice = prompt(
      `Purchasing ${propertyInfo.name} for $${price.toLocaleString()}.\n\nType '1' for Current Account\nType '2' for Savings Vault\nType '3' for Loan Account`, 
      "1"
    );

    if (!["1", "2", "3"].includes(accountChoice as string)) return;

    const newProps = [...ownedProperties, propertyInfo.id];
    let updates: any = { owned_properties: newProps };

    if (accountChoice === "1") {
       if (Number(balance) < price) return alert(`Insufficient liquid funds in Current Account. You need $${price.toLocaleString()}.`);
       const newBal = Number(balance) - price;
       setBalance(newBal);
       updates.bank_balance = newBal;
    } else if (accountChoice === "2") {
       if (Number(savingsBalance) < price) return alert(`Insufficient funds in Savings Vault. You need $${price.toLocaleString()}.`);
       const newSav = Number(savingsBalance) - price;
       setSavingsBalance(newSav);
       updates.savings_balance = newSav;
    } else if (accountChoice === "3") {
       if (Number(loanAccountBalance) < price) return alert(`Insufficient funds in Loan Account. You need $${price.toLocaleString()}.`);
       const newLoanAcc = Number(loanAccountBalance) - price;
       setLoanAccountBalance(newLoanAcc);
       updates.loan_account_balance = newLoanAcc;
    }

    setOwnedProperties(newProps);
    saveGameState(updates);
    alert(`Congratulations! You are the proud new owner of the ${propertyInfo.name} in ${cityInfo.name}! Rent is now permanently waived here.`);
  };

  const handleSellProperty = (propertyId: string) => {
    let propertyInfo: any = null;
    for (const [cId, props] of Object.entries(REAL_ESTATE)) {
       const found = props.find(p => p.id === propertyId);
       if (found) { propertyInfo = found; break; }
    }
    if (!propertyInfo) return;

    const price = propertyInfo.price;
    const confirmSell = confirm(`Are you sure you want to sell the ${propertyInfo.name} for $${price.toLocaleString()}?\n\nThe funds will be deposited into your Current Account.`);
    if (!confirmSell) return;

    const newBal = Number(balance) + price;
    const newProps = ownedProperties.filter(id => id !== propertyId);
    setBalance(newBal);
    setOwnedProperties(newProps);
    saveGameState({ bank_balance: newBal, owned_properties: newProps });
    alert(`Property sold! $${price.toLocaleString()} has been deposited to your Current Account.`);
  };

  const handleClaimSalary = () => {
    const currentSalary = Number(pendingSalary);
    
    if (playerPath === 'corporate') {
       if (currentSalary < monthlySalaryTarget) return alert(`You haven't completed a full month of work yet! You need $${monthlySalaryTarget.toLocaleString()} accumulated.`);
       const taxAmount = currentSalary * locStats.tax;
       const netAmount = currentSalary - taxAmount;
       const newBalance = Number(balance) + netAmount;
       setBalance(newBalance);
       setPendingSalary(0);
       setLastLocalSync(Date.now());
       saveGameState({ bank_balance: newBalance, pending_salary: 0, last_salary_sync: new Date().toISOString() });
       alert(`Payday! 🏢\n\nGross Salary: $${currentSalary.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\nIncome Tax (${(locStats.tax * 100).toFixed(0)}%): -$${taxAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n\nNet Added to Account: $${netAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
    } 
    else if (playerPath === 'founder') {
       if (currentSalary >= 0) {
          const taxAmount = currentSalary * locStats.tax;
          const netAmount = currentSalary - taxAmount;
          const newBalance = Number(balance) + netAmount;
          setBalance(newBalance);
          setPendingSalary(0);
          setLastLocalSync(Date.now());
          saveGameState({ bank_balance: newBalance, pending_salary: 0, last_salary_sync: new Date().toISOString() });
          alert(`Dividend Claimed! 📈\n\nGross Revenue: $${currentSalary.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\nCorporate Tax (${(locStats.tax * 100).toFixed(0)}%): -$${taxAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n\nNet Deposited: $${netAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
       } else {
          const debt = Math.abs(currentSalary);
          if (balance < debt) return alert(`Your company is in $${debt.toLocaleString()} of debt, and you don't have enough liquid cash to cover it! Your FICO score will take a massive hit!`);
          const newBalance = Number(balance) - debt;
          setBalance(newBalance);
          setPendingSalary(0);
          setLastLocalSync(Date.now());
          saveGameState({ bank_balance: newBalance, pending_salary: 0, last_salary_sync: new Date().toISOString() });
          alert(`Company Debt Paid 📉\n\nYou wired $${debt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} from your personal account to keep the startup afloat.`);
       }
    }
  };

  const handleSwitchPathClick = () => {
    if (pathUpdatedAt) {
      const lastUpdate = new Date(pathUpdatedAt).getTime();
      const now = new Date().getTime();
      const hoursSince = (now - lastUpdate) / (1000 * 60 * 60);
      if (hoursSince < 24) return alert(`ACCESS DENIED: You must wait ${Math.ceil(24 - hoursSince)} more hours before switching your career path.`);
    }
    setShowPathSelection(true);
  };

  const handlePathSelect = (newPath: string) => {
    const now = new Date().toISOString();
    setPlayerPath(newPath); setPathUpdatedAt(now); setShowPathSelection(false);
    saveGameState({ player_path: newPath, path_updated_at: now, last_salary_sync: now, last_energy_sync: lastEnergySyncState ? new Date(lastEnergySyncState).toISOString() : now });
    if (newPath === 'corporate') { setPendingSalary(0); setLastLocalSync(Date.now()); }
  };

  const handleDevBypass = () => {
     const input = prompt("Enter amount of cash to add (use negative to remove):", "1000000");
     if (input === null) return;
     const amountToAdd = parseFloat(input);
     if (isNaN(amountToAdd)) return alert("Invalid number entered.");

     const newBal = Number(balance) + amountToAdd;
     const newStartupData = { workload: 50, payroll: 50, morale: 100, is_strike: false, level: 1 };
     
     setBalance(newBal); 
     setEnergy(100); 
     setFico(850); 
     setLoanBalance(0); 
     setPathUpdatedAt(null); 
     setPendingSalary(playerPath === 'corporate' ? monthlySalaryTarget : 0); 
     setLastLocalSync(Date.now()); 
     setLastEnergySyncState(Date.now());
     setStartupData(newStartupData);
     
     saveGameState({ 
       bank_balance: newBal, 
       energy: 100, 
       fico_score: 850, 
       loan_balance: 0, 
       path_updated_at: null, 
       pending_salary: playerPath === 'corporate' ? monthlySalaryTarget : 0, 
       last_salary_sync: new Date().toISOString(), 
       last_energy_sync: new Date().toISOString(),
       startup_data: newStartupData
     });
     alert(`God Mode Activated: Added $${amountToAdd.toLocaleString()}, FICO 850, Loans Cleared, Strikes Resolved.`);
  };

  const handleResetState = () => {
     const confirmReset = confirm("Are you sure you want to hard reset your entire game state? This will wipe your money, level, assets, and startup data back to 0.");
     if (!confirmReset) return;

     const defaultStartup = { workload: 50, payroll: 50, morale: 100, is_strike: false, level: 1 };

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
         last_salary_sync: new Date().toISOString(),
         last_energy_sync: new Date().toISOString()
     });

     alert("Game state successfully hard reset.");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-white">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-4" />
        <p className="text-zinc-500 font-mono text-sm uppercase tracking-widest animate-pulse">Syncing Secure Database...</p>
      </div>
    );
  }

  // --- PATH SELECTION OVERLAY ---
  if (!playerPath || showPathSelection) {
    return (
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
               <button disabled={balance < 50000} onClick={() => handlePathSelect('founder')} className={`group border rounded-3xl p-8 text-left transition-all flex flex-col justify-between min-h-[400px] cursor-pointer relative overflow-hidden ${balance < 50000 ? 'bg-[#121214]/50 border-white/5 opacity-70 cursor-not-allowed' : 'bg-[#121214] border-white/10 hover:border-orange-500/50 hover:-translate-y-2'} ${playerPath === 'founder' ? 'bg-orange-500/10 border-orange-500/50 shadow-[0_0_40px_rgba(249,115,22,0.15)]' : ''}`}>
                  {balance < 50000 && <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-10 flex flex-col items-center justify-center"><Lock className="w-8 h-8 text-zinc-500 mb-2" /><p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Requires $50k Bank</p></div>}
                  <div className={balance < 50000 ? "blur-sm" : ""}>
                     <div className="w-14 h-14 bg-orange-500/10 rounded-2xl flex items-center justify-center border border-orange-500/20 mb-6"><Building2 className="w-7 h-7 text-orange-400" /></div>
                     <h3 className="text-2xl font-black text-white mb-2">The Founder</h3>
                     <p className="text-zinc-400 text-sm leading-relaxed mb-6">Manage a global startup. Balance workload and payroll. Highly volatile income, massive upside potential, but strikes can bankrupt you.</p>
                  </div>
               </button>
            </div>
         </div>
      </div>
    );
  }

  const displayName = pulseProfile?.username || pulseProfile?.displayName || "PlayerOne";
  const avatarUrl = pulseProfile?.theme?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=Fallback";

  return (
    <div className="flex h-screen bg-[#050505] text-zinc-300 font-sans selection:bg-indigo-500/30 overflow-hidden relative">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none z-0"></div>

      {activeJob && (
        <ActiveJobModal 
           job={activeJob} 
           onClose={() => setActiveJob(null)} 
           onComplete={(success, timeRemaining) => {
             setActiveJob(null);
             let newBalance = Number(balance);

             if (activeJob.isPromotion) {
                if (success) {
                   const newLevel = corporateLevel + 1;
                   setCorporateLevel(newLevel);
                   alert(`Promotion Earned! You are now a ${getCorporateRole(newLevel).title}!`);
                   saveGameState({ corporate_level: newLevel });
                } else { alert(`Time's up! The boss wasn't impressed. No promotion this time.`); }
                return;
             }
             
             if (activeJob.isExpansion) {
                if (success) {
                   const sData = startupDataRef.current;
                   const newLevel = (sData.level || 1) + 1;
                   const newSData = { ...sData, level: newLevel };
                   setStartupData(newSData);
                   saveGameState({ startup_data: newSData });
                   alert(`Expansion Successful! Your startup is now Level ${newLevel}. Your revenue and costs have scaled up!`);
                } else {
                   alert(`Time's up! The expansion failed. Better luck next time.`);
                }
                return;
             }

             if (success) {
                const bonus = timeRemaining * 0.50; 
                const totalEarned = activeJob.basePay + bonus;
                newBalance += totalEarned;
                alert(`Job Complete! You earned $${activeJob.basePay} + $${bonus.toFixed(2)} speed bonus!`);
             } else {
                const penalty = activeJob.basePay * 0.20;
                newBalance -= penalty;
                alert(`Time's up! You failed the job. The client was angry and fined you $${penalty.toFixed(2)}!`);
             }
             setBalance(newBalance); saveGameState({ bank_balance: newBalance });
           }} 
        />
      )}

      {/* --- Sidebar --- */}
      <aside className="w-64 bg-[#0a0a0c]/80 backdrop-blur-xl border-r border-white/5 flex flex-col z-20 shrink-0">
        <div className="p-6 border-b border-white/5 flex items-center gap-3">
          <PulseNetworkLogo className="w-7 h-7 text-white" />
          <span className="font-black text-xl tracking-tighter text-white">Pulse<span className="text-zinc-600">Network</span></span>
        </div>
        
        <div className="flex-1 px-4 py-6 space-y-8 overflow-y-auto custom-scrollbar">
          <div>
            <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest ml-2 mb-3">Central Hub</p>
            <div className="space-y-1">
              <button onClick={() => setActiveTab('overview')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors ${activeTab === 'overview' ? 'bg-gradient-to-r from-indigo-500/10 to-transparent text-indigo-400 border-l-2 border-indigo-500 shadow-[inset_0_0_20px_rgba(99,102,241,0.05)]' : 'text-zinc-400 hover:bg-white/5 hover:text-white font-medium'}`}><Activity className="w-4 h-4" /> Overview</button>
              <button onClick={() => setActiveTab('banking')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors ${activeTab === 'banking' ? 'bg-gradient-to-r from-emerald-500/10 to-transparent text-emerald-400 border-l-2 border-emerald-500 shadow-[inset_0_0_20px_rgba(16,185,129,0.05)]' : 'text-zinc-400 hover:bg-white/5 hover:text-white font-medium'}`}><Landmark className="w-4 h-4" /> Banking</button>
              <button onClick={() => setActiveTab('markets')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors ${activeTab === 'markets' ? 'bg-gradient-to-r from-emerald-500/10 to-transparent text-emerald-400 border-l-2 border-emerald-500 shadow-[inset_0_0_20px_rgba(16,185,129,0.05)]' : 'text-zinc-400 hover:bg-white/5 hover:text-white font-medium'}`}><TrendingUp className="w-4 h-4" /> Stock Markets</button>
              <button onClick={() => setActiveTab('real_estate')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors ${activeTab === 'real_estate' ? 'bg-gradient-to-r from-cyan-500/10 to-transparent text-cyan-400 border-l-2 border-cyan-500 shadow-[inset_0_0_20px_rgba(6,182,212,0.05)]' : 'text-zinc-400 hover:bg-white/5 hover:text-white font-medium'}`}><Globe className="w-4 h-4" /> Real Estate</button>
              <button onClick={() => setActiveTab('lifestyle')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors ${activeTab === 'lifestyle' ? 'bg-gradient-to-r from-orange-500/10 to-transparent text-orange-400 border-l-2 border-orange-500 shadow-[inset_0_0_20px_rgba(249,115,22,0.05)]' : 'text-zinc-400 hover:bg-white/5 hover:text-white font-medium'}`}><ShoppingBag className="w-4 h-4" /> Lifestyle & Cars</button>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-white/5">
          <button onClick={() => { window.location.href = window.location.hostname.includes('localhost') ? 'http://localhost:3000/dashboard' : 'https://pulsegg.in/dashboard'; }} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-colors text-sm font-bold border border-white/10">
            <LogOut className="w-4 h-4" /> Return to Pulse
          </button>
        </div>
      </aside>

      {/* --- Main Content Area --- */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto relative z-10">
        <header className="p-6 md:px-8 flex justify-between items-center sticky top-0 z-30 bg-[#050505]/80 backdrop-blur-md border-b border-white/5">
          <div className="flex items-center gap-4">
            <div className="flex flex-col cursor-pointer group" onClick={() => setActiveTab('real_estate')}>
               <span className="text-[9px] font-bold tracking-widest text-zinc-500 uppercase ml-1 mb-1 group-hover:text-cyan-400 transition-colors">Current Location</span>
               <div className="flex items-center gap-2 bg-[#121214] border border-white/10 rounded-full pl-1 pr-4 py-1 shadow-md group-hover:bg-white/5 transition-colors">
                 <div className="w-8 h-8 rounded-full bg-cyan-900/30 border border-cyan-500/30 flex items-center justify-center group-hover:scale-105 transition-transform"><MapPin className="w-4 h-4 text-cyan-400" /></div>
                 <span className="text-sm font-bold text-white tracking-wide">
                   {locStats.name} <span className={`font-mono text-[10px] uppercase ml-1 px-1.5 py-0.5 rounded ${locStats.tax === 0 ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'}`}>{(locStats.tax * 100).toFixed(0)}% Tax</span>
                 </span>
               </div>
            </div>
            <div className="flex flex-col hidden md:flex">
               <span className="text-[9px] font-bold tracking-widest text-zinc-500 uppercase ml-1 mb-1">Energy Bar</span>
               <div className="flex items-center gap-3 bg-[#121214] border border-white/10 rounded-full pl-1 pr-4 py-1 shadow-md">
                 <div className="w-8 h-8 rounded-full bg-yellow-900/30 border border-yellow-500/30 flex items-center justify-center"><Zap className="w-4 h-4 text-yellow-400 fill-yellow-400/20" /></div>
                 <div className="flex flex-col justify-center">
                   <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden mb-1"><div className="h-full bg-gradient-to-r from-orange-500 to-yellow-400 rounded-full transition-all duration-300" style={{ width: `${energy}%` }}></div></div>
                   <span className="text-[10px] font-mono text-zinc-400 leading-none">{energy}/100</span>
                 </div>
               </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             {displayName.toLowerCase() === 'sour' && (
               <div className="hidden md:flex items-center gap-2">
                 <button onClick={handleResetState} className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 text-orange-500 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-orange-500/20 transition shadow-[0_0_15px_rgba(249,115,22,0.2)]">
                    <RefreshCw className="w-3 h-3" /> Hard Reset
                 </button>
                 <button onClick={handleDevBypass} className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-500 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-red-500/20 transition shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                    <Zap className="w-3 h-3" /> God Mode
                 </button>
               </div>
             )}
             <div className="flex items-center gap-3 bg-[#121214] border border-white/10 rounded-full pl-4 pr-1 py-1 shadow-md cursor-pointer hover:bg-white/5 transition-colors">
               <div className="flex flex-col items-end">
                 <span className="text-[9px] font-bold tracking-widest text-zinc-500 uppercase">Quick-Link</span>
                 <span className="text-sm font-bold text-white tracking-wide">{displayName}</span>
               </div>
               <img src={avatarUrl} alt="Avatar" className="w-10 h-10 rounded-full border-2 border-zinc-800 bg-zinc-900 object-cover" />
               <ChevronDown className="w-4 h-4 text-zinc-500 mr-2" />
             </div>
          </div>
        </header>

        <div className="p-6 md:p-8 pt-2">
          {activeTab === 'overview' && (
             <OverviewTab 
                netWorth={totalNetWorth} balance={balance} savingsBalance={savingsBalance} loanAccountBalance={loanAccountBalance} assetValue={assetValue} loanBalance={loanBalance} fico={fico} playerPath={playerPath} netWorthHistory={netWorthHistory} currentLocName={locStats.name} energy={energy} ownedVehicles={ownedVehicles} setBalance={setBalance} setEnergy={setEnergy} setActiveJob={setActiveJob} saveGameState={saveGameState} handleSwitchPathClick={handleSwitchPathClick} corporateLevel={corporateLevel} currentRole={currentRole} displaySalary={displaySalaryRef.current} pendingSalary={pendingSalary} monthlySalaryTarget={monthlySalaryTarget} salaryProgressPercentage={Math.min(100, (Number(pendingSalary) / monthlySalaryTarget) * 100)} handleClaimSalary={handleClaimSalary} currentLocation={currentLocation} ownedProperties={ownedProperties} startupData={startupData} setStartupData={setStartupData} locMultiplier={locStats.multiplier}
             />
          )}
          {activeTab === 'banking' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
               <BankingTab 
                 balance={balance} savingsBalance={savingsBalance} loanBalance={loanBalance} loanAccountBalance={loanAccountBalance} fico={fico} selectedBank={selectedBank} accountNumber={accountNumber} transferAmount={transferAmount} setTransferAmount={setTransferAmount} handleBankSelect={handleBankSelect} handleTransfer={handleTransfer} handleTakeLoan={handleTakeLoan} handleRepayLoan={handleRepayLoan}
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
               <LifestyleTab balance={balance} energy={energy} ownedVehicles={ownedVehicles} setBalance={setBalance} setEnergy={setEnergy} setOwnedVehicles={setOwnedVehicles} saveGameState={saveGameState} />
            </div>
          )}
          {activeTab === 'markets' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
               <MarketsTab balance={balance} portfolio={portfolio} setBalance={setBalance} setPortfolio={setPortfolio} saveGameState={saveGameState} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}