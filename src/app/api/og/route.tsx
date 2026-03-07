import { ImageResponse } from 'next/og';

export const runtime = 'edge';

// Helper to prevent third-party APIs from hanging the image generation
// Added support for headers (needed for HenrikDev API key)
const fetchWithTimeout = async (url: string, ms = 2500, headers = {}) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, { 
      signal: controller.signal,
      headers: { ...headers },
      next: { revalidate: 3600 } // Cache API responses for 1 hour
    });
    clearTimeout(id);
    return res;
  } catch (e) {
    clearTimeout(id);
    return null;
  }
};

export async function GET(request: Request) {
  try {
    const { searchParams, origin } = new URL(request.url);
    const username = searchParams.get('user');

    if (!username) {
      return new Response('User not found', { status: 404 });
    }

    // 1. Fetch User Data from Firestore
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const firebaseUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${username}`;
    
    const res = await fetch(firebaseUrl, { next: { revalidate: 3600 } });
    if (!res.ok) throw new Error("Failed to fetch");
    
    const data = await res.json();
    const fields = data.fields;

    const displayName = fields.displayName?.stringValue || username;
    const banner = fields.theme?.mapValue?.fields?.banner?.stringValue || "https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=2600&auto=format&fit=crop";
    const avatar = fields.theme?.mapValue?.fields?.avatar?.stringValue || "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png";
    const primaryColor = fields.theme?.mapValue?.fields?.primary?.stringValue || "#1e1f22";
    
    // Extract Connectors
    const steamId = fields.steamId?.stringValue;
    const valName = fields.gaming?.mapValue?.fields?.valorant?.mapValue?.fields?.name?.stringValue;
    const valTag = fields.gaming?.mapValue?.fields?.valorant?.mapValue?.fields?.tag?.stringValue;
    const valRegion = fields.gaming?.mapValue?.fields?.valorant?.mapValue?.fields?.region?.stringValue || 'na';
    const lastFmUser = fields.lastfm?.stringValue;

    // 2. Fetch Gaming & Music Stats Concurrently (2.5s timeouts)
    let steamLevel: number | string | null = null;
    let topGame: string | null = null;
    let valRank: string | null = null;
    let music: { title: string; artist: string; albumArt?: string; url?: string } | null = null;

    const [fetchedSteamLevel, fetchedTopGame, fetchedValRank, fetchedMusic] = await Promise.all([
      // 1. Steam Level
      (steamId && process.env.STEAM_API_KEY) 
        ? fetchWithTimeout(`https://api.steampowered.com/IPlayerService/GetSteamLevel/v1/?key=${process.env.STEAM_API_KEY}&steamid=${steamId}`)
            .then(res => res ? res.json() : null)
            .then(data => data?.response?.player_level ?? null)
        : Promise.resolve(null),
        
      // 2. Steam Top Game
      (steamId && process.env.STEAM_API_KEY)
        ? fetchWithTimeout(`https://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v0001/?key=${process.env.STEAM_API_KEY}&steamid=${steamId}&count=1`)
            .then(res => res ? res.json() : null)
            .then(data => data?.response?.games?.[0]?.name ?? null)
        : Promise.resolve(null),

      // 3. Valorant Rank
      (valName && valTag)
        ? fetchWithTimeout(
            `https://api.henrikdev.xyz/valorant/v1/mmr/${valRegion}/${encodeURIComponent(valName)}/${encodeURIComponent(valTag)}`,
            2500,
            process.env.VALORANT_API_KEY ? { 'Authorization': process.env.VALORANT_API_KEY } : {}
          )
            .then(res => res ? res.json() : null)
            .then(data => data?.data?.currenttierpatched ?? null)
        : Promise.resolve(null),

      // 4. Top Track (Replaced Now Playing with Top 1 Track)
      (lastFmUser)
        ? fetchWithTimeout(`${origin}/api/lastfm/now-playing?user=${lastFmUser}`)
            .then(res => res ? res.json() : null)
            .then((data): any => data?.topTracks?.[0] || null) // Fetches the #1 Top Track from your existing endpoint
        : Promise.resolve(null)
    ]);

    steamLevel = fetchedSteamLevel;
    topGame = fetchedTopGame;
    valRank = fetchedValRank;
    music = fetchedMusic;

    const hasStats = valRank || topGame || steamLevel || music;

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0a0a0c',
            position: 'relative',
          }}
        >
          {/* Background Banner with Heavy Blur */}
          <img
            src={banner}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: 0.3,
              filter: 'blur(40px)',
            }}
          />

          {/* Main Frosted Glass Panel */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              width: '1100px',
              height: '530px',
              backgroundColor: 'rgba(20, 21, 25, 0.75)',
              borderRadius: '40px',
              border: '2px solid rgba(255,255,255,0.05)',
              boxShadow: '0 30px 60px rgba(0,0,0,0.6)',
              padding: '50px',
            }}
          >
            {/* LEFT COLUMN: Identity */}
            <div 
              style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                width: hasStats ? '400px' : '100%', 
                alignItems: hasStats ? 'flex-start' : 'center', 
                justifyContent: 'center' 
              }}
            >
              <img
                src={avatar}
                style={{
                  width: 200,
                  height: 200,
                  borderRadius: '100px',
                  border: `6px solid ${primaryColor}`,
                  marginBottom: '30px',
                  objectFit: 'cover',
                }}
              />
              <span
                style={{
                  fontSize: 60,
                  fontWeight: 900,
                  color: 'white',
                  lineHeight: 1.1,
                  fontFamily: 'sans-serif',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '380px'
                }}
              >
                {displayName}
              </span>
              <span style={{ fontSize: 32, color: '#a1a1aa', marginTop: '10px', fontFamily: 'sans-serif' }}>
                @{username}
              </span>
            </div>

            {/* DIVIDER */}
            {hasStats && (
              <div style={{ width: '2px', backgroundColor: 'rgba(255,255,255,0.08)', height: '100%', margin: '0 40px' }} />
            )}

            {/* RIGHT COLUMN: Gaming & Music Widgets */}
            {hasStats && (
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyItems: 'center', justifyContent: 'center', gap: '20px', overflow: 'hidden' }}>

                {/* Valorant Widget */}
                {valRank && (
                  <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: '24px', padding: '24px', borderLeft: '6px solid #ff4655' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', backgroundColor: 'rgba(255, 70, 85, 0.1)', borderRadius: '16px', marginRight: '24px' }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#ff4655" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5"/><line x1="13" y1="19" x2="19" y2="13"/><line x1="16" y1="16" x2="20" y2="20"/><line x1="19" y1="21" x2="21" y2="19"/></svg>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                      <span style={{ color: '#a1a1aa', fontSize: 18, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '4px', fontFamily: 'sans-serif' }}>Valorant</span>
                      <span style={{ color: 'white', fontSize: 32, fontWeight: 800, fontFamily: 'sans-serif' }}>{valRank}</span>
                    </div>
                  </div>
                )}

                {/* Steam Widget */}
                {(topGame || steamLevel) && (
                  <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: '24px', padding: '24px', borderLeft: '6px solid #66c0f4' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', backgroundColor: 'rgba(102, 192, 244, 0.1)', borderRadius: '16px', marginRight: '24px' }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#66c0f4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="6" y1="12" x2="10" y2="12"/><line x1="8" y1="10" x2="8" y2="14"/><line x1="15" y1="13" x2="15.01" y2="13"/><line x1="18" y1="11" x2="18.01" y2="11"/><rect x="2" y="6" width="20" height="12" rx="2"/></svg>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                      <span style={{ color: '#a1a1aa', fontSize: 18, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '4px', fontFamily: 'sans-serif' }}>{topGame ? 'Recently Played' : 'Steam Level'}</span>
                      <span style={{ color: 'white', fontSize: 32, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '400px', fontFamily: 'sans-serif' }}>
                        {topGame || `Level ${steamLevel}`}
                      </span>
                    </div>
                  </div>
                )}

                {/* Spotify / Music Widget (Now displays Top Track) */}
                {music && (
                  <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: '24px', padding: '24px', borderLeft: '6px solid #1DB954' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', backgroundColor: 'rgba(29, 185, 84, 0.1)', borderRadius: '16px', marginRight: '24px' }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#1DB954" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                      <span style={{ color: '#a1a1aa', fontSize: 18, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '4px', fontFamily: 'sans-serif' }}>Top Track</span>
                      <span style={{ color: 'white', fontSize: 32, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '400px', fontFamily: 'sans-serif' }}>
                        {music.title}
                      </span>
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        headers: {
          'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
        },
      }
    );
  } catch (e) {
    console.error(e);
    return new Response('Failed to generate image', { status: 500 });
  }
}