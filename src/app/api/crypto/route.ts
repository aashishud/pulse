import { NextResponse } from 'next/server';

export const revalidate = 5;

export async function GET() {
  try {
    // KuCoin API is completely open, doesn't geo-block US, and updates instantly
    const res = await fetch('https://api.kucoin.com/api/v1/market/allTickers');
    const json = await res.json();
    
    if (json.code !== "200000") throw new Error("KuCoin API Error");

    // KuCoin uses symbols like "BTC-USDT", we format it to match our "BTCUSDT" format
    const formatted = json.data.ticker.map((t: any) => ({
        symbol: t.symbol.replace('-', ''), 
        price: t.last
    }));
    
    return NextResponse.json(formatted);
  } catch (error) {
     console.error('KuCoin failed, falling back to MEXC...');
     // Indestructible Fallback
     try {
        const res = await fetch('https://api.mexc.com/api/v3/ticker/price');
        const data = await res.json();
        return NextResponse.json(data);
     } catch(e) {
        return NextResponse.json({ error: 'Failed to fetch crypto' }, { status: 500 });
     }
  }
}