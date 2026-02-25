import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state"); 

  if (!code) {
    return NextResponse.redirect(`${origin}/dashboard?error=spotify_no_code`);
  }

  // Redirect back to the dashboard with the code. 
  // The dashboard's client-side useEffect will catch this and hit the Server Action.
  const dashboardUrl = new URL("/dashboard", origin);
  dashboardUrl.searchParams.append("spotify_code", code);
  if (state) {
    dashboardUrl.searchParams.append("state", state);
  }

  return NextResponse.redirect(dashboardUrl.toString());
}