import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const state = searchParams.get("state"); 

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  
  // Force use of your custom domain to prevent Vercel URL mismatches
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || origin;
  const redirectUri = `${baseUrl}/api/auth/spotify/callback`;

  if (!clientId) {
    return NextResponse.json({ error: "Missing Spotify Client ID" }, { status: 500 });
  }

  const scope = "user-read-private user-read-email user-read-currently-playing user-modify-playback-state user-read-playback-state";

  const authUrl = new URL("https://accounts.spotify.com/authorize");
  authUrl.searchParams.append("response_type", "code");
  authUrl.searchParams.append("client_id", clientId.trim()); 
  authUrl.searchParams.append("scope", scope);
  authUrl.searchParams.append("redirect_uri", redirectUri);
  // Force the Spotify connection dialog to show up every time
  authUrl.searchParams.append("show_dialog", "true");
  
  if (state) {
    authUrl.searchParams.append("state", state);
  }

  return NextResponse.redirect(authUrl.toString());
}