const STEAM_API_KEY = process.env.STEAM_API_KEY;
const STEAM_BASE_URL = 'http://api.steampowered.com';

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

export async function getSteamProfile(steamId: string): Promise<SteamProfile | null> {
  if (!STEAM_API_KEY) return null;
  try {
    const response = await fetch(
      `${STEAM_BASE_URL}/ISteamUser/GetPlayerSummaries/v0002/?key=${STEAM_API_KEY}&steamids=${steamId}`,
      { next: { revalidate: 0 } }
    );
    const data = await response.json();
    return data.response.players[0] || null;
  } catch (error) {
    return null;
  }
}

export async function getRecentlyPlayed(steamId: string): Promise<SteamGame[]> {
  if (!STEAM_API_KEY) return [];
  try {
    const response = await fetch(
      `${STEAM_BASE_URL}/IPlayerService/GetRecentlyPlayedGames/v0001/?key=${STEAM_API_KEY}&steamid=${steamId}&count=3`,
      { next: { revalidate: 0 } }
    );
    const data = await response.json();
    return data.response.games || [];
  } catch (error) {
    return [];
  }
}

export async function getSteamLevel(steamId: string): Promise<number> {
  if (!STEAM_API_KEY) return 0;
  try {
    const response = await fetch(
      `${STEAM_BASE_URL}/IPlayerService/GetSteamLevel/v1/?key=${STEAM_API_KEY}&steamid=${steamId}`,
      { next: { revalidate: 0 } }
    );
    const data = await response.json();
    return data.response.player_level || 0;
  } catch (error) {
    return 0;
  }
}

export async function getOwnedGamesCount(steamId: string): Promise<number> {
  if (!STEAM_API_KEY) return 0;
  try {
    const response = await fetch(
      `${STEAM_BASE_URL}/IPlayerService/GetOwnedGames/v0001/?key=${STEAM_API_KEY}&steamid=${steamId}&include_appinfo=false&include_played_free_games=true`,
      { next: { revalidate: 0 } }
    );
    const data = await response.json();
    return data.response.game_count || 0;
  } catch (error) {
    return 0;
  }
}

// NEW: Get Achievement Progress
export async function getGameProgress(steamId: string, appId: number): Promise<number | null> {
  if (!STEAM_API_KEY) return null;
  try {
    const response = await fetch(
      `${STEAM_BASE_URL}/ISteamUserStats/GetPlayerAchievements/v0001/?appid=${appId}&key=${STEAM_API_KEY}&steamid=${steamId}`,
      { next: { revalidate: 0 } }
    );
    
    if (!response.ok) return null; // Game might not have stats or is private

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