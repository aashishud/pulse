"use server";

// --- STEAM ---
export async function getSteamLoginUrl(handle: string, origin: string) {
  const returnTo = `${origin}/dashboard`;
  const params = new URLSearchParams({
    'openid.ns': 'http://specs.openid.net/auth/2.0',
    'openid.mode': 'checkid_setup',
    'openid.return_to': returnTo,
    'openid.realm': origin,
    'openid.identity': 'http://specs.openid.net/auth/2.0/identifier_select',
    'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select',
  });
  return `https://steamcommunity.com/openid/login?${params.toString()}`;
}

export async function verifySteamLogin(queryString: string) {
  const params = new URLSearchParams(queryString);
  params.set('openid.mode', 'check_authentication');

  try {
    const response = await fetch('https://steamcommunity.com/openid/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });
    const text = await response.text();
    if (text.includes('is_valid:true')) {
      const claimedId = params.get('openid.claimed_id');
      if (!claimedId) return { success: false, message: "No Steam ID found." };
      const steamId = claimedId.split('/').pop(); 
      return { success: true, steamId: steamId };
    } else {
      return { success: false, message: "Steam authentication failed." };
    }
  } catch (error) {
    console.error("OpenID Error:", error);
    return { success: false, message: "Failed to contact Steam." };
  }
}

// --- DISCORD ---
export async function verifyDiscordLogin(code: string, origin: string) {
  const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
  const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
  const REDIRECT_URI = `${origin}/api/auth/discord`; // Must match what was sent in the initial request

  try {
    // 1. Exchange Code for Token
    const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: CLIENT_ID!,
        client_secret: CLIENT_SECRET!,
        grant_type: "authorization_code",
        code: code,
        redirect_uri: REDIRECT_URI,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      console.error("Discord Token Error:", tokenData);
      return { success: false, error: tokenData.error_description || "Failed to exchange token" };
    }

    // 2. Get User Info
    const userResponse = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const discordUser = await userResponse.json();
    return { success: true, username: discordUser.username, id: discordUser.id };

  } catch (error) {
    console.error("Discord API Error:", error);
    return { success: false, error: "Failed to connect to Discord" };
  }
}

// --- SPOTIFY (NEW) ---
export async function getSpotifyTokens(code: string, redirectUri: string) {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return { success: false, error: "Spotify credentials missing in environment variables." };
  }

  try {
    // 1. Exchange the authorization code for an access token
    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error("Spotify Token Error:", data);
      return { success: false, error: data.error_description || "Failed to get tokens" };
    }

    // 2. Fetch the user's Spotify profile to get their name/avatar
    const profileRes = await fetch("https://api.spotify.com/v1/me", {
      headers: { Authorization: `Bearer ${data.access_token}` }
    });
    
    const profile = await profileRes.json();

    return {
      success: true,
      tokens: {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: Date.now() + (data.expires_in * 1000), // Calculate expiration timestamp
      },
      profile: {
        id: profile.id,
        display_name: profile.display_name,
        url: profile.external_urls?.spotify
      }
    };
  } catch (error: any) {
    console.error("Spotify Auth Error:", error);
    return { success: false, error: error.message };
  }
}