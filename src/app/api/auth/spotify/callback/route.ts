import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state"); 

  // Force use of your custom domain so you don't get bounced to a .vercel.app domain
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || origin;

  if (!code) {
    return NextResponse.redirect(`${baseUrl}/dashboard?error=spotify_no_code`);
  }

  const dashboardUrl = new URL("/dashboard", baseUrl);
  dashboardUrl.searchParams.append("spotify_code", code);
  if (state) {
    dashboardUrl.searchParams.append("state", state);
  }

  return NextResponse.redirect(dashboardUrl.toString());
}