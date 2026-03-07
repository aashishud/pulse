const STEAM_API_KEY = process.env.STEAM_API_KEY;

// Upgraded to HTTPS for Vercel
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
  const steamId = rawSteamId.trim(); 
  
  try {
    // FIX: Lowered from 3600 to 60. This was the hidden culprit caching your "Playing Now" for an hour!
    const response = await fetch(
      `${STEAM_BASE_URL}/ISteamUser/GetPlayerSummaries/v0002/?key=${STEAM_API_KEY}&steamids=${steamId}`,
      { next: { revalidate: 60 } } 
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
      `${STEAM_BASE_URL}/IPlayerService/GetRecentlyPlayedGames/v0001/?key=${STEAM_API_KEY}&steamid=${steamId}&count=3`,
      { next: { revalidate: 60 } } 
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
      `${STEAM_BASE_URL}/IPlayerService/GetSteamLevel/v1/?key=${STEAM_API_KEY}&steamid=${steamId}`,
      { next: { revalidate: 60 } } 
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
      `${STEAM_BASE_URL}/IPlayerService/GetOwnedGames/v0001/?key=${STEAM_API_KEY}&steamid=${steamId}&include_appinfo=false&include_played_free_games=true`,
      { next: { revalidate: 60 } } 
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
      `${STEAM_BASE_URL}/ISteamUserStats/GetPlayerAchievements/v0001/?appid=${appId}&key=${STEAM_API_KEY}&steamid=${steamId}`,
      { next: { revalidate: 60 } } 
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