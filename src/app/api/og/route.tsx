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
    const primaryColor = fields.theme?.mapValue?.fields?.primary?.stringValue || "#6366f1"; // Fallback to indigo
    
    // Extract Connectors
    const steamId = fields.steamId?.stringValue;
    const valName = fields.gaming?.mapValue?.fields?.valorant?.mapValue?.fields?.name?.stringValue;
    const valTag = fields.gaming?.mapValue?.fields?.valorant?.mapValue?.fields?.tag?.stringValue;
    const valRegion = fields.gaming?.mapValue?.fields?.valorant?.mapValue?.fields?.region?.stringValue || 'na';
    const lastFmUser = fields.lastfm?.stringValue;

    // 2. Fetch Gaming & Music Stats Concurrently (2.5s timeouts)
    let steamLevel: number | string | null = null;
    let topGame: string | null = null;
    let valRank: { rank: string; icon: string } | null = null;
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
            .then(data => data?.data ? { rank: data.data.currenttierpatched, icon: data.data.images?.small } : null)
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
            fontFamily: 'sans-serif',
          }}
        >
          {/* Background Banner with Heavy Blur & Dark Overlay */}
          <img
            src={banner}
            style={{
              position: 'absolute',
              top: '-10%',
              left: '-10%',
              width: '120%',
              height: '120%',
              objectFit: 'cover',
              opacity: 0.35,
              filter: 'blur(60px)',
            }}
          />

          {/* Premium Glassmorphism Main Card */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              width: '1100px',
              height: '520px',
              backgroundColor: 'rgba(10, 10, 12, 0.85)',
              borderRadius: '40px',
              border: '1px solid rgba(255,255,255,0.08)',
              borderTop: '1px solid rgba(255,255,255,0.15)', // Subtle top lighting
              boxShadow: '0 40px 80px rgba(0,0,0,0.8), inset 0 0 80px rgba(0,0,0,0.5)',
              padding: '48px',
            }}
          >
            {/* LEFT COLUMN: Identity */}
            <div 
              style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                width: hasStats ? '380px' : '100%', 
                alignItems: hasStats ? 'flex-start' : 'center', 
                justifyContent: 'center',
              }}
            >
              {/* Avatar with Glow */}
              <div style={{ position: 'relative', display: 'flex', marginBottom: '32px' }}>
                <img
                  src={avatar}
                  style={{
                    width: 220,
                    height: 220,
                    borderRadius: '110px',
                    border: '4px solid rgba(255,255,255,0.15)',
                    objectFit: 'cover',
                    boxShadow: `0 0 60px ${primaryColor}80`, // Magic Primary Color Glow
                  }}
                />
              </div>

              <span
                style={{
                  fontSize: 64,
                  fontWeight: 900,
                  color: 'white',
                  lineHeight: 1,
                  letterSpacing: '-2px', // Tighter, punchier look
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '380px'
                }}
              >
                {displayName}
              </span>
              <span style={{ 
                fontSize: 28, 
                color: 'rgba(255,255,255,0.5)', 
                marginTop: '12px', 
                fontWeight: 600,
                letterSpacing: '-0.5px' 
              }}>
                @{username}
              </span>
            </div>

            {/* DIVIDER: Subtle Gradient Line */}
            {hasStats && (
              <div style={{ 
                width: '1px', 
                height: '90%', 
                margin: 'auto 48px',
                background: 'linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0.15) 20%, rgba(255,255,255,0.15) 80%, rgba(255,255,255,0))'
              }} />
            )}

            {/* RIGHT COLUMN: Gaming & Music Bento Widgets */}
            {hasStats && (
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center', gap: '20px', overflow: 'hidden' }}>

                {/* Valorant Bento Box */}
                {valRank && (
                  <div style={{ 
                    display: 'flex', alignItems: 'center', 
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)', 
                    borderRadius: '24px', padding: '20px 24px', 
                    border: '1px solid rgba(255,255,255,0.05)'
                  }}>
                    <div style={{ 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', 
                      width: '72px', height: '72px', 
                      backgroundColor: 'rgba(255, 70, 85, 0.15)', 
                      borderRadius: '20px', marginRight: '24px',
                      border: '1px solid rgba(255, 70, 85, 0.3)',
                      boxShadow: '0 10px 20px rgba(255, 70, 85, 0.15)'
                    }}>
                      {valRank.icon ? (
                        <img src={valRank.icon} style={{ width: 44, height: 44, objectFit: 'contain' }} />
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#ff4655" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5"/><line x1="13" y1="19" x2="19" y2="13"/><line x1="16" y1="16" x2="20" y2="20"/><line x1="19" y1="21" x2="21" y2="19"/></svg>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1 }}>
                      <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '3px', marginBottom: '6px' }}>Valorant</span>
                      <span style={{ color: 'white', fontSize: 36, fontWeight: 900, letterSpacing: '-1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{valRank.rank}</span>
                    </div>
                  </div>
                )}

                {/* Steam Bento Box */}
                {(topGame || steamLevel) && (
                  <div style={{ 
                    display: 'flex', alignItems: 'center', 
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)', 
                    borderRadius: '24px', padding: '20px 24px', 
                    border: '1px solid rgba(255,255,255,0.05)'
                  }}>
                    <div style={{ 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', 
                      width: '72px', height: '72px', 
                      backgroundColor: 'rgba(102, 192, 244, 0.15)', 
                      borderRadius: '20px', marginRight: '24px',
                      border: '1px solid rgba(102, 192, 244, 0.3)',
                      boxShadow: '0 10px 20px rgba(102, 192, 244, 0.15)'
                    }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="#66c0f4">
                        <path d="M11.979 0C5.352 0 .002 5.35.002 11.95c0 5.63 3.863 10.33 9.056 11.59-.115-.815-.04-1.637.28-2.392l.84-2.81c-.244-.765-.333-1.683-.153-2.61.547-2.66 3.102-4.32 5.714-3.715 2.613.604 4.234 3.25 3.687 5.91-.4 1.94-2.022 3.355-3.86 3.593l-.865 2.92c4.467-1.35 7.9-5.26 8.3-9.98.028-.27.042-.54.042-.814C23.956 5.35 18.605 0 11.98 0zm6.54 12.35c.78.18 1.265.98 1.085 1.776-.18.797-.97.94-1.75.76-.78-.18-1.264-.98-1.085-1.776.18-.798.97-.94 1.75-.76zm-5.46 3.7c-.035 1.54 1.06 2.87 2.53 3.11l.245-.82c-.815-.224-1.423-1.04-1.396-1.99.027-.95.7-1.706 1.543-1.83l.255-.86c-1.472.03-2.65 1.13-3.176 2.39zm-3.045 2.5c-.755.12-1.395-.385-1.43-1.127-.035-.742.53-1.413 1.285-1.532.755-.12 1.394.385 1.43 1.127.034.74-.53 1.41-1.285 1.53z"/>
                      </svg>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1 }}>
                      <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '3px', marginBottom: '6px' }}>{topGame ? 'Recently Played' : 'Steam Level'}</span>
                      <span style={{ color: 'white', fontSize: 36, fontWeight: 900, letterSpacing: '-1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {topGame || `Level ${steamLevel}`}
                      </span>
                    </div>
                  </div>
                )}

                {/* Spotify / Music Bento Box */}
                {music && (
                  <div style={{ 
                    display: 'flex', alignItems: 'center', 
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)', 
                    borderRadius: '24px', padding: '20px 24px', 
                    border: '1px solid rgba(255,255,255,0.05)'
                  }}>
                    <div style={{ 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', 
                      width: '72px', height: '72px', 
                      backgroundColor: 'rgba(29, 185, 84, 0.15)', 
                      borderRadius: '20px', marginRight: '24px',
                      border: '1px solid rgba(29, 185, 84, 0.3)',
                      boxShadow: '0 10px 20px rgba(29, 185, 84, 0.15)'
                    }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="#1DB954">
                        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.241 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.6.18-1.2.72-1.38 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                      </svg>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1 }}>
                      <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '3px', marginBottom: '6px' }}>Top Track</span>
                      <span style={{ color: 'white', fontSize: 36, fontWeight: 900, letterSpacing: '-1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {music.title}
                      </span>
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>

          {/* Premium Pulse Pill Watermark */}
          <div
            style={{
              position: 'absolute',
              bottom: 24,
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'rgba(0,0,0,0.6)',
              padding: '10px 24px',
              borderRadius: '100px',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '10px' }}>
              <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>
            </svg>
            <span style={{ color: '#a1a1aa', fontSize: 16, fontWeight: 800, letterSpacing: '1px' }}>
              pulsegg.in
            </span>
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