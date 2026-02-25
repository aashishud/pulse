import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const state = searchParams.get("state"); // We pass the User ID here

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const redirectUri = `${origin}/api/auth/spotify/callback`;

  if (!clientId) {
    return NextResponse.json({ error: "Missing Spotify Client ID" }, { status: 500 });
  }

  // Scopes needed for displaying what you're listening to and controlling playback
  const scope = "user-read-private user-read-email user-read-currently-playing user-modify-playback-state user-read-playback-state";

  const authUrl = new URL("https://accounts.spotify.com/authorize");
  authUrl.searchParams.append("response_type", "code");
  authUrl.searchParams.append("client_id", clientId);
  authUrl.searchParams.append("scope", scope);
  authUrl.searchParams.append("redirect_uri", redirectUri);
  
  if (state) {
    authUrl.searchParams.append("state", state);
  }

  return NextResponse.redirect(authUrl.toString());
}