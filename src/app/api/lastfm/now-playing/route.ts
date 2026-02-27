import { NextResponse } from "next/server";

// Force Next.js to NEVER cache this API route
export const dynamic = "force-dynamic";
export const revalidate = 0;

const LASTFM_API_KEY = "f67e37a93f1ef058ee954ae0517e6e8c";
const DEFAULT_STAR_IMAGE = "2a96cbd8b46e442fc41c2b86b821562f";

// --- SPOTIFY SERVER-TO-SERVER AUTH ---
// We cache the token in memory so we don't hit Spotify's token endpoint on every single page load
let cachedSpotifyToken = "";
let spotifyTokenExpiration = 0;

async function getSpotifyAppToken() {
  if (cachedSpotifyToken && Date.now() < spotifyTokenExpiration) {
    return cachedSpotifyToken;
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID?.trim();
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET?.trim();

  if (!clientId || !clientSecret) return null;

  try {
    const res = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: "Basic " + Buffer.from(`${clientId}:${clientSecret}`).toString("base64"),
      },
      body: "grant_type=client_credentials",
      cache: "no-store",
    });

    if (res.ok) {
      const data = await res.json();
      cachedSpotifyToken = data.access_token;
      // Expires in 3600s, subtract 60s for a safety buffer
      spotifyTokenExpiration = Date.now() + (data.expires_in - 60) * 1000;
      return cachedSpotifyToken;
    }
  } catch (e) {
    console.error("Failed to fetch Spotify App Token", e);
  }
  return null;
}

// --- SPOTIFY SEARCH GETTER ---
async function fetchSpotifyArt(artist: string, track: string) {
  if (!artist || !track) return "";
  
  const token = await getSpotifyAppToken();
  if (!token) return "";

  try {
    // Search the public Spotify catalog for the track + artist combination
    const query = encodeURIComponent(`${artist} ${track}`);
    const res = await fetch(`https://api.spotify.com/v1/search?q=${query}&type=track&limit=1`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    if (res.ok) {
      const data = await res.json();
      if (data.tracks?.items?.length > 0) {
        // Return the highest quality album cover from the search result
        return data.tracks.items[0].album?.images?.[0]?.url || "";
      }
    }
  } catch (e) {
    console.error("Spotify Search Error:", e);
  }
  return "";
}

// --- FALLBACK LAST.FM GETTER ---
function getValidLastFmImage(images: any[] = []) {
  if (!images || !Array.isArray(images)) return "";
  const imgUrl = images.find((img: any) => img.size === "extralarge")?.["#text"] || 
                 images.find((img: any) => img.size === "large")?.["#text"] || 
                 images[images.length - 1]?.["#text"] || "";
  
  if (imgUrl.includes(DEFAULT_STAR_IMAGE)) return "";
  return imgUrl;
}


export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const user = searchParams.get("user");

  if (!user) return NextResponse.json({ error: "Missing Last.fm username" }, { status: 400 });

  try {
    // 1. Fetch the Currently Playing (or most recent) track
    const recentRes = await fetch(
      `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${encodeURIComponent(user)}&api_key=${LASTFM_API_KEY}&format=json&limit=2&_t=${Date.now()}`,
      { cache: "no-store", headers: { "Cache-Control": "no-cache" } }
    );
    
    let nowPlaying = { isPlaying: false, title: "", artist: "", albumArt: "", url: "" };
    
    if (recentRes.ok) {
      const recentData = await recentRes.json();
      
      let tracks = recentData.recenttracks?.track;
      if (tracks && !Array.isArray(tracks)) tracks = [tracks];
      
      if (tracks && tracks.length > 0) {
        const track = tracks[0];
        const isCurrentlyPlaying = Boolean(track["@attr"]?.nowplaying);
        const artistName = track.artist?.["#text"] || track.artist?.name || "Unknown Artist";
        const trackName = track.name || "";
        
        // 🌟 MAGIC: Attempt to fetch pristine Spotify art first!
        let bestImage = await fetchSpotifyArt(artistName, trackName);
        
        // Fallback to Last.fm if Spotify fails to find it
        if (!bestImage) {
            bestImage = getValidLastFmImage(track.image);
        }

        nowPlaying = {
          isPlaying: isCurrentlyPlaying,
          title: trackName,
          artist: artistName,
          albumArt: bestImage,
          url: track.url,
        };
      }
    }

    // 2. Fetch Top 3 Tracks (Short Term = 1 month)
    const topRes = await fetch(
      `https://ws.audioscrobbler.com/2.0/?method=user.gettoptracks&user=${encodeURIComponent(user)}&api_key=${LASTFM_API_KEY}&format=json&limit=3&period=1month&_t=${Date.now()}`,
      { cache: "no-store", headers: { "Cache-Control": "no-cache" } }
    );

    let topTracks: any[] = [];

    if (topRes.ok) {
      const topData = await topRes.json();
      
      let tracks = topData.toptracks?.track;
      if (tracks && !Array.isArray(tracks)) tracks = [tracks];

      if (tracks) {
        // Map through tracks and hit Spotify to get real, high-res covers
        topTracks = await Promise.all(tracks.map(async (t: any, index: number) => {
          const artistName = t.artist?.name || t.artist?.["#text"] || "Unknown Artist";
          const trackName = t.name || "";
          
          // 🌟 MAGIC: Attempt to fetch pristine Spotify art first!
          let realAlbumArt = await fetchSpotifyArt(artistName, trackName);
          
          // Fallback to Last.fm if Spotify fails
          if (!realAlbumArt) {
             realAlbumArt = getValidLastFmImage(t.image);
          }

          return {
            id: `lastfm-${index}`,
            title: trackName,
            artist: artistName,
            albumArt: realAlbumArt,
            url: t.url,
          };
        }));
      }
    }

    return NextResponse.json({
      nowPlaying,
      topTracks
    });

  } catch (error: any) {
    console.error("Last.fm + Spotify API Error:", error);
    return NextResponse.json({ 
        nowPlaying: { isPlaying: false }, 
        topTracks: [] 
    });
  }
}