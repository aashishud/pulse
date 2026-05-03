import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";

const DISCORD_API = "https://discord.com/api/v10";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state"); // "login" or "signup:<handle>"

  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  const host = req.headers.get("host");
  const origin = `${protocol}://${host}`;
  const REDIRECT_URI = `${origin}/api/auth/discord-login`;

  // --- STEP 1: If no code, redirect user to Discord OAuth ---
  if (!code) {
    if (!state) {
      return NextResponse.json({ error: "Missing state parameter" }, { status: 400 });
    }

    const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
    const discordUrl = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=identify+email&state=${encodeURIComponent(state)}`;
    return NextResponse.redirect(discordUrl);
  }

  // --- STEP 2: Exchange code for Discord access token ---
  try {
    const tokenRes = await fetch(`${DISCORD_API}/oauth2/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID!,
        client_secret: process.env.DISCORD_CLIENT_SECRET!,
        grant_type: "authorization_code",
        code,
        redirect_uri: REDIRECT_URI,
      }),
    });

    if (!tokenRes.ok) {
      console.error("Discord token exchange failed:", await tokenRes.text());
      return NextResponse.redirect(`${origin}/login?error=discord_token_failed`);
    }

    const tokenData = await tokenRes.json();

    // --- STEP 3: Get Discord user info ---
    const userRes = await fetch(`${DISCORD_API}/users/@me`, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!userRes.ok) {
      console.error("Discord user fetch failed:", await userRes.text());
      return NextResponse.redirect(`${origin}/login?error=discord_user_failed`);
    }

    const discordUser = await userRes.json();
    const discordUid = `discord:${discordUser.id}`;
    const discordEmail = discordUser.email;

    // --- STEP 4: Find or create Firebase user ---
    let firebaseUid: string;

    try {
      // Try to find existing user by this Discord-linked UID
      const existingUser = await adminAuth.getUser(discordUid);
      firebaseUid = existingUser.uid;
    } catch {
      // No user with this Discord UID exists yet
      if (discordEmail) {
        try {
          // Check if a user with this email already exists (e.g. signed up with Google)
          const emailUser = await adminAuth.getUserByEmail(discordEmail);
          firebaseUid = emailUser.uid;
        } catch {
          // No user with this email either — create a brand new Firebase user
          const newUser = await adminAuth.createUser({
            uid: discordUid,
            email: discordEmail,
            displayName: discordUser.global_name || discordUser.username,
            photoURL: discordUser.avatar
              ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.${discordUser.avatar.startsWith("a_") ? "gif" : "png"}?size=256`
              : undefined,
          });
          firebaseUid = newUser.uid;
        }
      } else {
        // No email from Discord — create user with just the Discord UID
        const newUser = await adminAuth.createUser({
          uid: discordUid,
          displayName: discordUser.global_name || discordUser.username,
          photoURL: discordUser.avatar
            ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.${discordUser.avatar.startsWith("a_") ? "gif" : "png"}?size=256`
            : undefined,
        });
        firebaseUid = newUser.uid;
      }
    }

    // --- STEP 5: Mint a Firebase custom token ---
    const customToken = await adminAuth.createCustomToken(firebaseUid);

    // --- STEP 6: Redirect back to the appropriate page with the token ---
    const decodedState = decodeURIComponent(state || "login");

    if (decodedState.startsWith("signup:")) {
      const handle = decodedState.replace("signup:", "");
      const signupUrl = new URL("/signup", origin);
      signupUrl.searchParams.set("discord_token", customToken);
      signupUrl.searchParams.set("discord_uid", firebaseUid);
      signupUrl.searchParams.set("discord_name", discordUser.global_name || discordUser.username);
      signupUrl.searchParams.set("handle", handle);
      return NextResponse.redirect(signupUrl);
    } else {
      const loginUrl = new URL("/login", origin);
      loginUrl.searchParams.set("discord_token", customToken);
      return NextResponse.redirect(loginUrl);
    }
  } catch (err) {
    console.error("Discord login error:", err);
    return NextResponse.redirect(`${origin}/login?error=discord_login_failed`);
  }
}
