import { NextRequest, NextResponse } from "next/server";

const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;

export async function GET(req: NextRequest) {
  // 1. Dynamic Host Detection
  // This automatically grabs "localhost:3000" or "pulsegg.vercel.app" from the request
  const host = req.headers.get("host");
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";

  // Construct the exact URL Discord expects
  const REDIRECT_URI = `${protocol}://${host}/api/auth/discord`;

  console.log("Discord Auth Debug:", { REDIRECT_URI, CLIENT_ID: CLIENT_ID ? "Set" : "Missing" });

  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const userId = searchParams.get("state");

  // 2. Redirect to Discord (Step 1)
  if (!code) {
    if (!userId) return NextResponse.json({ error: "Missing user ID" }, { status: 400 });

    const discordLoginUrl = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=identify&state=${userId}`;

    return NextResponse.redirect(discordLoginUrl);
  }

  // 3. Exchange Code for Token (Step 2)
  try {
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
      console.error("Token Exchange Error:", tokenData);
      throw new Error(tokenData.error_description || "Token Exchange Failed");
    }

    // 4. Get User Info
    const userResponse = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const discordUser = await userResponse.json();

    // 5. Update Firebase - ONLY import Firebase when actually needed (runtime, not build time)
    if (searchParams.get("state")) {
      // Dynamic import to prevent Firebase initialization during build
      const { db } = await import("@/lib/firebase");
      const { doc, updateDoc } = await import("firebase/firestore");

      const docId = searchParams.get("state")!;
      const userRef = doc(db, "users", docId);

      await updateDoc(userRef, {
        "socials.discord": discordUser.username,
        "socials.discord_verified": true
      });
    }

    return NextResponse.redirect(`${protocol}://${host}/dashboard`);

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Discord Login Failed", details: String(error) }, { status: 500 });
  }
}