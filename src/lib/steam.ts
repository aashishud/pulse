const STEAM_API_KEY = process.env.STEAM_API_KEY;

// FIX 1: Upgraded to HTTPS. Vercel environments often drop insecure HTTP requests or fail during redirects.
const STEAM_BASE_URL = 'https://api.steampowered.com';

export interface SteamProfile {
  steamid: string;
  personaname: string;
  profileurl: string;
  avatarfull: string;
  gameextrainfo?: string;
  timecreated?: number;
  loccountrycode?: string;
}

export interface SteamGame {
  appid: number;
  name: string;
  playtime_2weeks: number;
  playtime_forever: number;
  img_icon_url: string;
}

export async function getSteamProfile(rawSteamId: string): Promise<SteamProfile | null> {
  if (!STEAM_API_KEY || !rawSteamId) return null;
  // FIX 2: Trim the ID to prevent trailing spaces from the database crashing Vercel's URL parser
  const steamId = rawSteamId.trim(); 
  
  try {
    // FIX 3: Added &_t=${Date.now()} to the URL to aggressively bust any stubborn CDN/Vercel edge caches
    const response = await fetch(
      `${STEAM_BASE_URL}/ISteamUser/GetPlayerSummaries/v0002/?key=${STEAM_API_KEY}&steamids=${steamId}&_t=${Date.now()}`,
      { 
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache, no-store' }
      } 
    );
    const data = await response.json();
    return data.response.players[0] || null;
  } catch (error) {
    console.error("Steam Profile Fetch Error:", error);
    return null;
  }
}

export async function getRecentlyPlayed(rawSteamId: string): Promise<SteamGame[]> {
  if (!STEAM_API_KEY || !rawSteamId) return [];
  const steamId = rawSteamId.trim();
  
  try {
    const response = await fetch(
      `${STEAM_BASE_URL}/IPlayerService/GetRecentlyPlayedGames/v0001/?key=${STEAM_API_KEY}&steamid=${steamId}&count=3&_t=${Date.now()}`,
      { 
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache, no-store' }
      } 
    );
    const data = await response.json();
    return data.response.games || [];
  } catch (error) {
    console.error("Steam Recent Games Fetch Error:", error);
    return [];
  }
}

export async function getSteamLevel(rawSteamId: string): Promise<number> {
  if (!STEAM_API_KEY || !rawSteamId) return 0;
  const steamId = rawSteamId.trim();
  
  try {
    const response = await fetch(
      `${STEAM_BASE_URL}/IPlayerService/GetSteamLevel/v1/?key=${STEAM_API_KEY}&steamid=${steamId}&_t=${Date.now()}`,
      { 
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache, no-store' }
      } 
    );
    const data = await response.json();
    return data.response.player_level || 0;
  } catch (error) {
    return 0;
  }
}

export async function getOwnedGamesCount(rawSteamId: string): Promise<number> {
  if (!STEAM_API_KEY || !rawSteamId) return 0;
  const steamId = rawSteamId.trim();
  
  try {
    const response = await fetch(
      `${STEAM_BASE_URL}/IPlayerService/GetOwnedGames/v0001/?key=${STEAM_API_KEY}&steamid=${steamId}&include_appinfo=false&include_played_free_games=true&_t=${Date.now()}`,
      { 
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache, no-store' }
      } 
    );
    const data = await response.json();
    return data.response.game_count || 0;
  } catch (error) {
    return 0;
  }
}

export async function getGameProgress(rawSteamId: string, appId: number): Promise<number | null> {
  if (!STEAM_API_KEY || !rawSteamId) return null;
  const steamId = rawSteamId.trim();
  
  try {
    const response = await fetch(
      `${STEAM_BASE_URL}/ISteamUserStats/GetPlayerAchievements/v0001/?appid=${appId}&key=${STEAM_API_KEY}&steamid=${steamId}&_t=${Date.now()}`,
      { 
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache, no-store' }
      } 
    );

    if (!response.ok) return null; 

    const data = await response.json();
    const achievements = data.playerstats?.achievements;

    if (!achievements || achievements.length === 0) return null;

    const unlocked = achievements.filter((a: any) => a.achieved === 1).length;
    const total = achievements.length;

    return Math.round((unlocked / total) * 100);
  } catch (error) {
    return null;
  }
}