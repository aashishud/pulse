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

// --- DISCORD (NEW) ---
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