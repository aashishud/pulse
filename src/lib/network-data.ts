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

export const CRYPTO_ASSETS: Record<string, { name: string, symbol: string, color: string }> = {
  "BTC": { name: "Bitcoin", symbol: "BTCUSDT", color: "text-orange-400" },
  "ETH": { name: "Ethereum", symbol: "ETHUSDT", color: "text-blue-400" },
  "SOL": { name: "Solana", symbol: "SOLUSDT", color: "text-purple-400" },
  "BNB": { name: "BNB", symbol: "BNBUSDT", color: "text-yellow-500" },
  "XRP": { name: "Ripple", symbol: "XRPUSDT", color: "text-zinc-300" },
  "ADA": { name: "Cardano", symbol: "ADAUSDT", color: "text-cyan-400" },
  "AVAX": { name: "Avalanche", symbol: "AVAXUSDT", color: "text-red-500" },
  "LINK": { name: "Chainlink", symbol: "LINKUSDT", color: "text-blue-500" },
  "DOT": { name: "Polkadot", symbol: "DOTUSDT", color: "text-pink-500" },
  "DOGE": { name: "Dogecoin", symbol: "DOGEUSDT", color: "text-yellow-400" },
  "SHIB": { name: "Shiba Inu", symbol: "SHIBUSDT", color: "text-orange-500" },
  "PEPE": { name: "Pepe", symbol: "PEPEUSDT", color: "text-emerald-500" },
  "MATIC": { name: "Polygon", symbol: "MATICUSDT", color: "text-purple-500" },
  "UNI": { name: "Uniswap", symbol: "UNIUSDT", color: "text-pink-400" },
  "NEAR": { name: "NEAR Protocol", symbol: "NEARUSDT", color: "text-blue-300" },
  "APT": { name: "Aptos", symbol: "APTUSDT", color: "text-teal-400" },
  "TRX": { name: "Tron", symbol: "TRXUSDT", color: "text-red-400" },
  "BCH": { name: "Bitcoin Cash", symbol: "BCHUSDT", color: "text-orange-300" },
  "LTC": { name: "Litecoin", symbol: "LTCUSDT", color: "text-zinc-400" },
  "ICP": { name: "Internet Comp.", symbol: "ICPUSDT", color: "text-indigo-400" },
  "ATOM": { name: "Cosmos", symbol: "ATOMUSDT", color: "text-purple-300" },
  "XLM": { name: "Stellar", symbol: "XLMUSDT", color: "text-zinc-200" },
  "ALGO": { name: "Algorand", symbol: "ALGOUSDT", color: "text-zinc-400" },
  "FIL": { name: "Filecoin", symbol: "FILUSDT", color: "text-cyan-300" },
  "VET": { name: "VeChain", symbol: "VETUSDT", color: "text-blue-400" },
  "AAVE": { name: "Aave", symbol: "AAVEUSDT", color: "text-purple-400" },
  "INJ": { name: "Injective", symbol: "INJUSDT", color: "text-blue-300" },
  "OP": { name: "Optimism", symbol: "OPUSDT", color: "text-red-500" },
  "ARB": { name: "Arbitrum", symbol: "ARBUSDT", color: "text-blue-500" },
  "SUI": { name: "Sui", symbol: "SUIUSDT", color: "text-blue-400" },
  "RNDR": { name: "Render", symbol: "RNDRUSDT", color: "text-red-400" },
  "WIF": { name: "Dogwifhat", symbol: "WIFUSDT", color: "text-orange-300" },
  "FLOKI": { name: "Floki", symbol: "FLOKIUSDT", color: "text-yellow-500" },
  "BONK": { name: "Bonk", symbol: "BONKUSDT", color: "text-orange-500" }
};

export const STOCK_ASSETS: Record<string, { name: string, symbol: string, color: string }> = {
  "AAPL": { name: "Apple", symbol: "AAPL", color: "text-zinc-300" },
  "MSFT": { name: "Microsoft", symbol: "MSFT", color: "text-blue-400" },
  "NVDA": { name: "NVIDIA", symbol: "NVDA", color: "text-green-400" },
  "TSLA": { name: "Tesla", symbol: "TSLA", color: "text-red-500" },
  "AMZN": { name: "Amazon", symbol: "AMZN", color: "text-orange-400" },
  "META": { name: "Meta", symbol: "META", color: "text-blue-500" },
  "GOOGL": { name: "Alphabet", symbol: "GOOGL", color: "text-yellow-400" },
  "NFLX": { name: "Netflix", symbol: "NFLX", color: "text-red-600" },
  "GME": { name: "GameStop", symbol: "GME", color: "text-red-500" },
  "AMC": { name: "AMC Ent.", symbol: "AMC", color: "text-yellow-500" }
};