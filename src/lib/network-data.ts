export const LOCATIONS: Record<string, any> = {
  bali: { name: "Bali", tax: 0.10, rent: 30, living: 15, multiplier: 0.5, perk: "Low Cost of Living" },
  london: { name: "London", tax: 0.25, rent: 120, living: 50, multiplier: 1.2, perk: "Balanced Lifestyle" },
  new_york: { name: "New York", tax: 0.38, rent: 300, living: 100, multiplier: 2.5, perk: "High Salary Multiplier" },
  zurich: { name: "Zurich", tax: 0.15, rent: 600, living: 200, multiplier: 1.0, perk: "The Banking Capital" },
  dubai: { name: "Dubai", tax: 0.00, rent: 800, living: 300, multiplier: 1.8, perk: "Tax Haven (0%)" }
};

export const REAL_ESTATE: Record<string, { id: string, name: string, price: number }[]> = {
  bali: [{ id: "bali_1", name: "Bamboo Hut", price: 5000 }, { id: "bali_4", name: "Beachfront Villa", price: 150000 }, { id: "bali_5", name: "Private Island", price: 5000000 }],
  london: [{ id: "lon_1", name: "Studio Flat", price: 50000 }, { id: "lon_2", name: "City Apartment", price: 450000 }, { id: "lon_4", name: "Mayfair Penthouse", price: 3500000 }],
  new_york: [{ id: "ny_1", name: "Brooklyn Loft", price: 200000 }, { id: "ny_2", name: "Manhattan Penthouse", price: 1200000 }, { id: "ny_4", name: "Central Park Tower", price: 15000000 }],
  zurich: [{ id: "zur_1", name: "Alpine Cabin", price: 100000 }, { id: "zur_3", name: "Alpine Chateau", price: 2800000 }, { id: "zur_5", name: "Swiss Castle", price: 25000000 }],
  dubai: [{ id: "dub_1", name: "Marina Apartment", price: 300000 }, { id: "dub_3", name: "Burj Khalifa Penthouse", price: 12000000 }, { id: "dub_5", name: "Artificial Island", price: 150000000 }]
};

export const VEHICLES: Record<string, { name: string, price: number, desc: string }> = {
  "v_civic": { name: "Used Sedan", price: 5000, desc: "Gets you from A to B. Unlocks Ride-Sharing jobs." },
  "v_tesla": { name: "Electric Model 3", price: 45000, desc: "Eco-friendly status symbol." },
  "v_porsche": { name: "Stallion GT", price: 120000, desc: "A true sports car." },
  "v_lambo": { name: "Pegassi Hypercar", price: 350000, desc: "The ultimate street flex." },
  "v_yacht": { name: "Luxury Yacht", price: 5000000, desc: "For those who own the ocean." },
};

// MASSIVE 20-COIN ROSTER WITH DETERMINISTIC MATH FALLBACKS
export const CRYPTO_ASSETS: Record<string, { name: string, symbol: string, color: string, basePrice: number, vol: number, waveA: number, waveB: number }> = {
  "BTC": { name: "Bitcoin", symbol: "BTCUSDT", color: "text-orange-400", basePrice: 65000, vol: 1500, waveA: 20000, waveB: 55000 },
  "ETH": { name: "Ethereum", symbol: "ETHUSDT", color: "text-blue-400", basePrice: 3500, vol: 100, waveA: 18000, waveB: 45000 },
  "SOL": { name: "Solana", symbol: "SOLUSDT", color: "text-purple-400", basePrice: 150, vol: 5, waveA: 15000, waveB: 35000 },
  "BNB": { name: "BNB", symbol: "BNBUSDT", color: "text-yellow-500", basePrice: 600, vol: 10, waveA: 25000, waveB: 60000 },
  "XRP": { name: "Ripple", symbol: "XRPUSDT", color: "text-zinc-300", basePrice: 0.60, vol: 0.05, waveA: 12000, waveB: 30000 },
  "ADA": { name: "Cardano", symbol: "ADAUSDT", color: "text-cyan-400", basePrice: 0.45, vol: 0.02, waveA: 14000, waveB: 32000 },
  "AVAX": { name: "Avalanche", symbol: "AVAXUSDT", color: "text-red-500", basePrice: 45, vol: 2, waveA: 16000, waveB: 38000 },
  "LINK": { name: "Chainlink", symbol: "LINKUSDT", color: "text-blue-500", basePrice: 18, vol: 0.8, waveA: 13000, waveB: 29000 },
  "DOT": { name: "Polkadot", symbol: "DOTUSDT", color: "text-pink-500", basePrice: 7, vol: 0.3, waveA: 17000, waveB: 41000 },
  "DOGE": { name: "Dogecoin", symbol: "DOGEUSDT", color: "text-yellow-400", basePrice: 0.15, vol: 0.01, waveA: 11000, waveB: 26000 },
  "SHIB": { name: "Shiba Inu", symbol: "SHIBUSDT", color: "text-orange-500", basePrice: 0.00002, vol: 0.000002, waveA: 10000, waveB: 24000 },
  "PEPE": { name: "Pepe", symbol: "PEPEUSDT", color: "text-emerald-500", basePrice: 0.000008, vol: 0.000001, waveA: 9000, waveB: 22000 },
  "MATIC": { name: "Polygon", symbol: "MATICUSDT", color: "text-purple-500", basePrice: 0.70, vol: 0.03, waveA: 13500, waveB: 31000 },
  "UNI": { name: "Uniswap", symbol: "UNIUSDT", color: "text-pink-400", basePrice: 10, vol: 0.5, waveA: 15500, waveB: 34000 },
  "NEAR": { name: "NEAR Protocol", symbol: "NEARUSDT", color: "text-blue-300", basePrice: 6, vol: 0.3, waveA: 14500, waveB: 33000 },
  "APT": { name: "Aptos", symbol: "APTUSDT", color: "text-teal-400", basePrice: 9, vol: 0.4, waveA: 16500, waveB: 37000 },
  "TRX": { name: "Tron", symbol: "TRXUSDT", color: "text-red-400", basePrice: 0.12, vol: 0.005, waveA: 11500, waveB: 27000 },
  "BCH": { name: "Bitcoin Cash", symbol: "BCHUSDT", color: "text-orange-300", basePrice: 450, vol: 15, waveA: 19000, waveB: 48000 },
  "LTC": { name: "Litecoin", symbol: "LTCUSDT", color: "text-zinc-400", basePrice: 85, vol: 3, waveA: 17500, waveB: 42000 },
  "ICP": { name: "Internet Comp.", symbol: "ICPUSDT", color: "text-indigo-400", basePrice: 12, vol: 0.6, waveA: 18500, waveB: 46000 }
};

// Deterministic Math Algorithm - Takes over if Binance blocks a coin!
export const getLiveStockPrice = (ticker: string, timestamp: number = Date.now()) => {
  const crypto = CRYPTO_ASSETS[ticker];
  if (!crypto) return 0;
  const wave1 = Math.sin(timestamp / crypto.waveA) * crypto.vol;
  const wave2 = Math.cos(timestamp / crypto.waveB) * (crypto.vol * 0.5);
  const wave3 = Math.sin(timestamp / 5000) * (crypto.vol * 0.1); 
  // Prevents prices from crashing below 10% of their base value
  return Math.max(crypto.basePrice * 0.1, crypto.basePrice + wave1 + wave2 + wave3);
};