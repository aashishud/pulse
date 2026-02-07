import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  // 1. Dynamic Host Detection
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state"); // This is the userId we sent initially

  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  const host = req.headers.get("host");
  const origin = `${protocol}://${host}`;

  // 2. Redirect Logic
  // Instead of processing here (which causes Permission Errors), 
  // we pass the code to the Dashboard where the User is Authenticated.
  
  if (code) {
    const dashboardUrl = new URL('/dashboard', origin);
    dashboardUrl.searchParams.set('discord_code', code);
    if (state) dashboardUrl.searchParams.set('state', state);
    
    return NextResponse.redirect(dashboardUrl);
  }

  // 3. Initial Auth Request (If no code, start the flow)
  const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
  const REDIRECT_URI = `${origin}/api/auth/discord`;
  
  if (!state) {
     return NextResponse.json({ error: "Missing state (user ID)" }, { status: 400 });
  }

  const discordLoginUrl = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=identify&state=${state}`;

  return NextResponse.redirect(discordLoginUrl);
}