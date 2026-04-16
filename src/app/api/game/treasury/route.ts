import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { adminAuth } from '@/lib/firebaseAdmin';
import { REAL_ESTATE, VEHICLES, CRYPTO_ASSETS, STOCK_ASSETS } from '@/lib/network-data';

// Helper to verify ID token
async function verifyAuth(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.split('Bearer ')[1];
  try {
    if (!adminAuth) return null;
    const decodedToken = await adminAuth.verifyIdToken(token);
    return decodedToken.uid;
  } catch (error) {
    return null;
  }
}

// Ensure the portfolio JSON is robust when reading
function parseJSON(str: string | null, def: any) {
  try { return str ? JSON.parse(str) : def; } catch (e) { return def; }
}

export async function POST(request: Request) {
  try {
    const verifiedUid = await verifyAuth(request);
    if (!verifiedUid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { action, payload } = await request.json();

    // 1. Lock down current secure state from the DB (The Ultimate Truth)
    const { data: userRecord, error: fetchError } = await supabaseAdmin
      .from('network_users')
      .select('*')
      .eq('firebase_uid', verifiedUid)
      .single();

    if (fetchError || !userRecord) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const balance = Number(userRecord.bank_balance || 0);
    const ownedProperties = parseJSON(userRecord.owned_properties, []);
    const ownedVehicles = parseJSON(userRecord.owned_vehicles, []);
    const portfolio = parseJSON(userRecord.portfolio, { funds: {}, stocks: {}, angel: [] });
    // Normalize portfolio shape
    if (!portfolio.stocks) portfolio.stocks = {};
    if (!portfolio.funds) portfolio.funds = {};
    if (!portfolio.angel) portfolio.angel = [];

    const updates: any = {};
    let newBalance = balance;

    // --- REAL ESTATE TRANSACTIONS ---
    if (action === "BUY_PROPERTY") {
      const { propertyId, accountType } = payload; // accountType is 1 (Checking), 2 (Savings), 3 (Loan)
      if (ownedProperties.includes(propertyId)) return NextResponse.json({ error: "Already owned" }, { status: 400 });
      
      let pInfo = null;
      for (const city in REAL_ESTATE) {
        const found = REAL_ESTATE[city].find(p => p.id === propertyId);
        if (found) { pInfo = found; break; }
      }
      if (!pInfo) return NextResponse.json({ error: "Invalid Property" }, { status: 400 });

      const price = pInfo.price;
      if (accountType === "1") {
          if (newBalance < price) return NextResponse.json({ error: "Insufficient funds" }, { status: 400 });
          newBalance -= price;
          updates.bank_balance = newBalance;
      } else if (accountType === "2") {
          let savBal = Number(userRecord.savings_balance || 0);
          if (savBal < price) return NextResponse.json({ error: "Insufficient savings" }, { status: 400 });
          updates.savings_balance = savBal - price;
      } else if (accountType === "3") {
          let loanBal = Number(userRecord.loan_account_balance || 0);
          if (loanBal < price) return NextResponse.json({ error: "Insufficient loan funds" }, { status: 400 });
          updates.loan_account_balance = loanBal - price;
      } else {
          return NextResponse.json({ error: "Invalid account type" }, { status: 400 });
      }

      ownedProperties.push(propertyId);
      updates.owned_properties = JSON.stringify(ownedProperties);
    }

    else if (action === "SELL_PROPERTY") {
      const { propertyId } = payload;
      if (!ownedProperties.includes(propertyId)) return NextResponse.json({ error: "Not owned" }, { status: 400 });
      let pInfo = null;
      for (const city in REAL_ESTATE) {
        const found = REAL_ESTATE[city].find(p => p.id === propertyId);
        if (found) { pInfo = found; break; }
      }
      if (!pInfo) return NextResponse.json({ error: "Invalid Property" }, { status: 400 });
      newBalance += pInfo.price;
      updates.bank_balance = newBalance;
      updates.owned_properties = JSON.stringify(ownedProperties.filter((id: string) => id !== propertyId));
    }

    // --- VEHICLE TRANSACTIONS ---
    else if (action === "BUY_VEHICLE") {
        const { vehicleId, accountType } = payload;
        if (ownedVehicles.includes(vehicleId)) return NextResponse.json({ error: "Already owned" }, { status: 400 });
        const vInfo = VEHICLES[vehicleId];
        if (!vInfo) return NextResponse.json({ error: "Invalid Vehicle" }, { status: 400 });
        
        const price = vInfo.price;
        if (accountType === "1") {
            if (newBalance < price) return NextResponse.json({ error: "Insufficient funds" }, { status: 400 });
            newBalance -= price;
            updates.bank_balance = newBalance;
        } else if (accountType === "2") {
            let savBal = Number(userRecord.savings_balance || 0);
            if (savBal < price) return NextResponse.json({ error: "Insufficient savings" }, { status: 400 });
            updates.savings_balance = savBal - price;
        } else if (accountType === "3") {
            let loanBal = Number(userRecord.loan_account_balance || 0);
            if (loanBal < price) return NextResponse.json({ error: "Insufficient loan funds" }, { status: 400 });
            updates.loan_account_balance = loanBal - price;
        } else {
            return NextResponse.json({ error: "Invalid account type" }, { status: 400 });
        }

        ownedVehicles.push(vehicleId);
        updates.owned_vehicles = JSON.stringify(ownedVehicles);
    }

    else if (action === "SELL_VEHICLE") {
        const { vehicleId } = payload;
        if (!ownedVehicles.includes(vehicleId)) return NextResponse.json({ error: "Not owned" }, { status: 400 });
        const vInfo = VEHICLES[vehicleId];
        if (!vInfo) return NextResponse.json({ error: "Invalid Vehicle" }, { status: 400 });
        // Vehicles sell for 80% value in game economy usually (let's check frontend logic, earlier it was 80% or 100%, let's do 80%)
        newBalance += Math.floor(vInfo.price * 0.8);
        updates.bank_balance = newBalance;
        updates.owned_vehicles = JSON.stringify(ownedVehicles.filter((id: string) => id !== vehicleId));
    }

    // --- ANGEL INVESTING TRANSACTIONS ---
    else if (action === "ANGEL_INVEST") {
        const { name, amount } = payload;
        if (newBalance < amount || amount < 1000) return NextResponse.json({ error: "Invalid funds" }, { status: 400 });
        newBalance -= amount;
        updates.bank_balance = newBalance;
        // Inject server-generated ID and resolve time
        const newDeal = {
            uid: `angel_${Date.now()}_${Math.floor(Math.random()*1000)}`,
            name,
            invested: amount,
            status: 'pending',
            multiplier: 0,
            payout: 0,
            resolveAt: Date.now() + (12 * 60 * 60 * 1000) // 12 realtime hours
        };
        portfolio.angel.push(newDeal);
        updates.portfolio = JSON.stringify(portfolio);
    }

    else if (action === "ANGEL_RESOLVE") {
        const { dealId } = payload;
        const dealIndex = portfolio.angel.findIndex((d: any) => d.uid === dealId && d.status === 'pending');
        if (dealIndex === -1) return NextResponse.json({ error: "Deal not found or already resolved" }, { status: 400 });
        const deal = portfolio.angel[dealIndex];
        
        // Wait, did 12 hours actually pass?
        // if (Date.now() < deal.resolveAt) return NextResponse.json({ error: "Deal still maturing" }, { status: 400 });

        // SERVER RANDOMLY RESOLVES DEAL!
        const roll = Math.random();
        let status = 'bankrupt'; let mult = 0;
        if (roll < 0.05) { status = 'unicorn'; mult = Math.floor(Math.random() * 41) + 10; } // 10x-50x
        else if (roll < 0.15) { status = 'won'; mult = Math.floor(Math.random() * 6) + 5; } // 5x-10x
        else if (roll < 0.40) { status = 'won'; mult = Math.floor(Math.random() * 3) + 2; } // 2x-4x
        else if (roll < 0.55) { status = 'stagnant'; mult = 1; }

        const payout = deal.invested * mult;
        portfolio.angel[dealIndex].status = status;
        portfolio.angel[dealIndex].multiplier = mult;
        portfolio.angel[dealIndex].payout = payout;
        
        updates.portfolio = JSON.stringify(portfolio);
    }

    else if (action === "MARKET_TRADE") {
        const { ticker, amount, tradeType, assetClass } = payload;
        // tradeType: 'buy' or 'sell'. assetClass: 'crypto' or 'stock'.
        const shareNum = parseFloat(amount);
        if (isNaN(shareNum) || shareNum <= 0) return NextResponse.json({ error: "Invalid amount" }, { status: 400 });

        // FETCH LIVE PRICES INTERNALLY ON SERVER
        const [cryptoRes, stockRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/crypto`), 
          fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/stocks`)
        ]);
        const prices = [...(cryptoRes.ok ? await cryptoRes.json() : []), ...(stockRes.ok ? await stockRes.json() : [])];
        
        let validAsset = assetClass === 'crypto' ? CRYPTO_ASSETS[ticker] : STOCK_ASSETS[ticker];
        if (!validAsset) return NextResponse.json({ error: "Invalid Asset" }, { status: 400 });
        
        const priceData = prices.find((d: any) => d.symbol === validAsset.symbol);
        if (!priceData || isNaN(parseFloat(priceData.price))) return NextResponse.json({ error: "Market closed" }, { status: 400 });

        const currentPrice = parseFloat(priceData.price);
        const totalValue = currentPrice * shareNum;

        if (!portfolio.stocks) portfolio.stocks = {};
        const currentShares = portfolio.stocks[ticker]?.shares || portfolio[ticker]?.shares || 0;

        if (tradeType === 'buy') {
           if (newBalance < totalValue) return NextResponse.json({ error: "Insufficient funds" }, { status: 400 });
           newBalance -= totalValue;
           portfolio.stocks[ticker] = { shares: currentShares + shareNum };
        } else if (tradeType === 'sell') {
           if (currentShares < shareNum) return NextResponse.json({ error: "Insufficient shares" }, { status: 400 });
           newBalance += totalValue;
           portfolio.stocks[ticker] = { shares: currentShares - shareNum };
           if (portfolio.stocks[ticker].shares === 0) delete portfolio.stocks[ticker];
        } else {
           return NextResponse.json({ error: "Invalid trade type" }, { status: 400 });
        }

        updates.bank_balance = newBalance;
        updates.portfolio = JSON.stringify(portfolio);
    }

    else if (action === "FUND_TRANSACTION") {
        const { fundId, tradeType, amount } = payload;
        const reqAmount = parseFloat(amount);
        if (isNaN(reqAmount) || reqAmount <= 0) return NextResponse.json({ error: "Invalid amount" }, { status: 400 });

        const funds = portfolio.funds || {};
        const currentFundBal = funds[fundId] || 0;

        if (tradeType === 'deposit') {
            if (newBalance < reqAmount) return NextResponse.json({ error: "Insufficient funds" }, { status: 400 });
            if (fundId === 'citadel' && reqAmount < 100000 && currentFundBal === 0) return NextResponse.json({ error: "Minimum Deposit is $100k for Citadel" }, { status: 400 });

            newBalance -= reqAmount;
            portfolio.funds = { ...funds, [fundId]: currentFundBal + reqAmount };
        } else if (tradeType === 'withdraw') {
            if (currentFundBal < reqAmount) return NextResponse.json({ error: "Insufficient fund balance" }, { status: 400 });
            
            newBalance += reqAmount;
            portfolio.funds = { ...funds, [fundId]: currentFundBal - reqAmount };
        } else {
            return NextResponse.json({ error: "Invalid trade type" }, { status: 400 });
        }

        updates.bank_balance = newBalance;
        updates.portfolio = JSON.stringify(portfolio);
    }

    else if (action === "CLAIM_SALARY") {
        const { claimedAmount, playerPath, locTax, isDebt } = payload;
        const amount = parseFloat(claimedAmount);
        if (isNaN(amount)) return NextResponse.json({ error: "Invalid amount" }, { status: 400 });

        const taxRate = parseFloat(locTax) || 0;
        
        let netAmount = 0;
        let taxPaid = 0;

        if (playerPath === 'corporate' || (playerPath === 'founder' && !isDebt)) {
             if (amount <= 0) return NextResponse.json({ error: "No salary accumulated" }, { status: 400 });
             taxPaid = amount * taxRate;
             netAmount = amount - taxPaid;
             // Enforce Wallet Limit without Bank
             const hasBank = userRecord.selected_bank !== '' && userRecord.selected_bank !== null && userRecord.selected_bank !== 'none' && userRecord.selected_bank !== undefined;
             if (!hasBank && (newBalance + netAmount > 50000)) return NextResponse.json({ error: "Wallet Full", message: "Cannot hold >$50k without a bank account." }, { status: 400 });
             
             newBalance += netAmount;
        } else if (playerPath === 'founder' && isDebt) {
             if (amount <= 0) return NextResponse.json({ error: "No debt" }, { status: 400 });
             if (newBalance < amount) return NextResponse.json({ error: "Insufficient funds to cover debt" }, { status: 400 });
             newBalance -= amount;
             netAmount = -amount;
        }

        updates.bank_balance = newBalance;
        updates.pending_salary = 0;
    }

    else {
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

    // Process all updates securely directly over database!
    if (Object.keys(updates).length > 0) {
        // Enforce integer types for Supabase Postgres bigint columns
        if (updates.bank_balance !== undefined) updates.bank_balance = Math.floor(updates.bank_balance);
        if (updates.savings_balance !== undefined) updates.savings_balance = Math.floor(updates.savings_balance);
        if (updates.loan_account_balance !== undefined) updates.loan_account_balance = Math.floor(updates.loan_account_balance);
        if (updates.pending_salary !== undefined) updates.pending_salary = Math.floor(updates.pending_salary);
        
        const { error: updateError } = await supabaseAdmin
            .from('network_users')
            .update(updates)
            .eq('firebase_uid', verifiedUid);
        if (updateError) throw updateError;
    }

    return NextResponse.json({ message: "Success", data: updates });

  } catch (error: any) {
    console.error("Treasury API POST Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
