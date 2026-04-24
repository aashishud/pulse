import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { REAL_ESTATE, VEHICLES, CRYPTO_ASSETS, STOCK_ASSETS } from '@/lib/network-data';

export const revalidate = 60; // Cache this route for 60 seconds

function parseJSON(str: string | null, def: any) {
  try { return str ? JSON.parse(str) : def; } catch (e) { return def; }
}

export async function GET() {
  try {
    // 1. Fetch all visible players from Supabase
    const { data: users, error } = await supabaseAdmin
      .from('network_users')
      .select('*');

    if (error) throw error;
    if (!users || users.length === 0) return NextResponse.json({ leaderboard: [] });

    // 2. Fetch Live Market Data (Single network call to prevent spamming)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const [cryptoRes, stockRes] = await Promise.all([
      fetch(`${baseUrl}/api/crypto`).catch(() => null),
      fetch(`${baseUrl}/api/stocks`).catch(() => null)
    ]);
    
    let livePrices = [];
    if (cryptoRes?.ok) {
        const cData = await cryptoRes.json();
        if (Array.isArray(cData)) livePrices.push(...cData);
    }
    if (stockRes?.ok) {
        const sData = await stockRes.json();
        if (Array.isArray(sData)) livePrices.push(...sData);
    }

    // 3. Compute True Net Worth for every player
    const processedUsers = users.map((u: any) => {
        const cash = Number(u.bank_balance || 0) + Number(u.savings_balance || 0) + Number(u.loan_account_balance || 0);
        const debt = Number(u.loan_balance || 0);
        
        const properties = parseJSON(u.owned_properties, []);
        const realEstateValue = properties.reduce((sum: number, propId: string) => {
            for (const city in REAL_ESTATE) {
                const prop = REAL_ESTATE[city].find(p => p.id === propId);
                if (prop) return sum + prop.price;
            }
            return sum;
        }, 0);

        const vehicles = parseJSON(u.owned_vehicles, []);
        const vehicleValue = vehicles.reduce((sum: number, vId: string) => sum + ((VEHICLES[vId]?.price || 0) * 0.8), 0);

        const portfolio = parseJSON(u.portfolio, { funds: {}, stocks: {}, angel: [] });
        
        let fundValue = (portfolio.funds?.vanguard || 0) + (portfolio.funds?.citadel || 0);
        let angelValue = 0;
        (portfolio.angel || []).forEach((deal: any) => {
            if (deal.status === 'pending') angelValue += deal.invested;
            else if (deal.status === 'won' || deal.status === 'unicorn') angelValue += deal.payout;
        });

        let stockValue = 0;
        [...Object.entries(CRYPTO_ASSETS), ...Object.entries(STOCK_ASSETS)].forEach(([ticker, asset]) => {
            const shares = portfolio.stocks?.[ticker]?.shares || portfolio[ticker]?.shares || 0;
            if (shares > 0) {
                 const item = livePrices.find((d: any) => d.symbol === asset.symbol);
                 if (item && !isNaN(parseFloat(item.price))) {
                     stockValue += shares * parseFloat(item.price);
                 }
            }
        });

        const assets = realEstateValue + vehicleValue + fundValue + angelValue + stockValue;
        const totalNetWorth = cash + assets - debt;

        return {
            displayName: u.username || "Unknown",
            playerPath: u.player_path || "Unemployed",
            cash,
            assets,
            debt,
            totalNetWorth
        };
    });

    // 4. Sort and return top 50 
    const leaderboard = processedUsers
        .sort((a: any, b: any) => b.totalNetWorth - a.totalNetWorth)
        .slice(0, 50);

    return NextResponse.json({ leaderboard });

  } catch (error: any) {
    console.error("Leaderboard API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
