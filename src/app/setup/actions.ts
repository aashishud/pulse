"use server";

// This file handles the secure OpenID handshake with Steam.

export async function getSteamLoginUrl(handle: string, origin: string) {
  // CRITICAL UPDATE: Send them back to the DASHBOARD, not the old setup page.
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