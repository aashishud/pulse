import { NextResponse } from 'next/server';

// Forces Next.js to cache this route at the Edge level for 15 seconds
export const revalidate = 15;

export async function GET() {
  const symbols = ["AAPL", "MSFT", "NVDA", "TSLA", "AMZN", "META", "GOOGL", "NFLX", "GME", "AMC"];
  
  const exchangeMap: Record<string, string> = { 
    AAPL: 'NASDAQ', MSFT: 'NASDAQ', NVDA: 'NASDAQ', TSLA: 'NASDAQ', 
    AMZN: 'NASDAQ', META: 'NASDAQ', GOOGL: 'NASDAQ', NFLX: 'NASDAQ', 
    GME: 'NYSE', AMC: 'NYSE' 
  };
  
  try {
    const yahooPromises = symbols.map(async (symbol) => {
        try {
            const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1m&range=1d`, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
                // VERCEL FIX: Cache aggressively at the Edge Network across cold-starts!
                next: { revalidate: 15 }
            });
            
            if (!res.ok) return null;
            const data = await res.json();
            const price = data.chart?.result?.[0]?.meta?.regularMarketPrice;
            
            if (price) return { symbol, price };
            return null;
        } catch (e) {
            return null;
        }
    });

    const yahooResults = await Promise.all(yahooPromises);
    const formattedYahoo = yahooResults.filter(Boolean);

    if (formattedYahoo.length > 0) {
        return NextResponse.json(formattedYahoo);
    }
    throw new Error("Yahoo API completely blocked your IP.");

  } catch (error: any) {
    console.warn('Yahoo Auth Failed. Falling back to Google Finance HTML Scraper...', error.message);
    
    try {
        const googlePromises = symbols.map(async (symbol) => {
            try {
                const exchange = exchangeMap[symbol];
                const res = await fetch(`https://www.google.com/finance/quote/${symbol}:${exchange}`, {
                    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
                    // VERCEL FIX: Cache Google results too!
                    next: { revalidate: 15 }
                });
                const html = await res.text();
                
                const match = html.match(/class="YMlKec fxKbKc">([^<]+)<\/div>/);
                if (match && match[1]) {
                    const priceStr = match[1].replace(/[^0-9.]/g, ''); 
                    return { symbol, price: parseFloat(priceStr) };
                }
                return null;
            } catch (e) {
                return null;
            }
        });
        
        const googleResults = await Promise.all(googlePromises);
        const formattedGoogle = googleResults.filter(Boolean);
        
        if (formattedGoogle.length > 0) {
            return NextResponse.json(formattedGoogle);
        }
        throw new Error("Google Scraper failed to parse HTML");

    } catch (fallbackError) {
        console.error("All Live Stock Providers Failed.");
        return NextResponse.json({ error: 'Failed to fetch live stock data' }, { status: 500 });
    }
  }
}