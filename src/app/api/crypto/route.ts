import { NextResponse } from 'next/server';

// We cache this for 2 seconds to prevent rate-limiting our own server
export const revalidate = 2;

export async function GET() {
  try {
    // We use MEXC's API here. It returns the EXACT same JSON format as Binance
    // (e.g., [{ symbol: "BTCUSDT", price: "65000" }]), but it does NOT geo-block US servers!
    const res = await fetch('https://api.mexc.com/api/v3/ticker/price');
    
    if (!res.ok) {
      throw new Error(`API returned status: ${res.status}`);
    }
    
    const data = await res.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Crypto Proxy Error:', error);
    return NextResponse.json({ error: 'Failed to fetch crypto prices' }, { status: 500 });
  }
}