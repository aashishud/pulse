export interface ValorantProfile {
  currenttier: number;
  currenttierpatched: string; // e.g. "Silver 3"
  images: {
    small: string;
    large: string;
    triangle_down: string;
    triangle_up: string;
  };
  ranking_in_tier: number; // RR (0-100)
  mmr_change_to_last_game: number;
  elo: number;
  name: string;
  tag: string;
}

export async function getValorantProfile(name: string, tag: string, region: string): Promise<ValorantProfile | null> {
  // Using HenrikDev's Unofficial Valorant API
  // We MUST encode the name and tag to handle spaces and special characters properly
  const encodedName = encodeURIComponent(name);
  const encodedTag = encodeURIComponent(tag);
  
  const url = `https://api.henrikdev.xyz/valorant/v1/mmr/${region}/${encodedName}/${encodedTag}`;
  const apiKey = process.env.VALORANT_API_KEY;

  try {
    const options: RequestInit = { 
      next: { revalidate: 300 } 
    };

    // Add API Key if available
    if (apiKey) {
      options.headers = {
        'Authorization': apiKey
      };
    }

    const res = await fetch(url, options); 
    
    if (res.status === 401) {
      console.error("Valorant API Error: 401 Unauthorized. Please add VALORANT_API_KEY to your .env.local file.");
      return null;
    }

    if (!res.ok) {
      console.warn(`Valorant API Fetch Failed: ${res.status} ${res.statusText}`);
      return null;
    }

    const json = await res.json();
    
    // The API returns status 200 even for some logical errors, but usually checks status field
    if (json.status !== 200) {
      console.warn(`Valorant API Error: ${json.status}`, json.errors);
      return null;
    }

    return {
      ...json.data,
      name, // Return original display name
      tag
    };
  } catch (error) {
    console.error("Valorant API Exception:", error);
    return null;
  }
}