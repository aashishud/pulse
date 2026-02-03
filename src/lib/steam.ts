const STEAM_API_KEY = process.env.STEAM_API_KEY;
const STEAM_BASE_URL = 'http://api.steampowered.com';

// --- Types ---
export interface SteamProfile {
  steamid: string;
  personaname: string;
  profileurl: string;
  avatarfull: string;
  gameextrainfo?: string;
  timecreated?: number; // Unix timestamp of when account was made
  loccountrycode?: string;
}

export interface SteamGame {
  appid: number;
  name: string;
  playtime_2weeks: number;
  playtime_forever: number;
  img_icon_url: string;
}

// --- Functions ---

export async function getSteamProfile(steamId: string): Promise<SteamProfile | null> {
  if (!STEAM_API_KEY) return null;
  try {
    const response = await fetch(
      `${STEAM_BASE_URL}/ISteamUser/GetPlayerSummaries/v0002/?key=${STEAM_API_KEY}&steamids=${steamId}`,
      { next: { revalidate: 3600 } }
    );
    const data = await response.json();
    return data.response.players[0] || null;
  } catch (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
}

export async function getRecentlyPlayed(steamId: string): Promise<SteamGame[]> {
  if (!STEAM_API_KEY) return [];
  try {
    const response = await fetch(
      `${STEAM_BASE_URL}/IPlayerService/GetRecentlyPlayedGames/v0001/?key=${STEAM_API_KEY}&steamid=${steamId}&count=3`,
      { next: { revalidate: 3600 } }
    );
    const data = await response.json();
    return data.response.games || [];
  } catch (error) {
    console.error('Error fetching recent games:', error);
    return [];
  }
}

export async function getSteamLevel(steamId: string): Promise<number> {
  if (!STEAM_API_KEY) return 0;
  try {
    const response = await fetch(
      `${STEAM_BASE_URL}/IPlayerService/GetSteamLevel/v1/?key=${STEAM_API_KEY}&steamid=${steamId}`,
      { next: { revalidate: 86400 } } // Cache for 24 hours
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
      { next: { revalidate: 3600 } }
    );
    const data = await response.json();
    return data.response.game_count || 0;
  } catch (error) {
    return 0;
  }
}