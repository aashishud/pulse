import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";

// You need to add these to your .env.local file!
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const REDIRECT_URI = "http://localhost:3000/api/auth/discord";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const userId = searchParams.get("state"); // We pass the Firebase User ID as "state"

  // 1. If no code, REDIRECT to Discord to start login
  if (!code) {
    if (!userId) return NextResponse.json({ error: "Missing user ID" }, { status: 400 });

    const discordLoginUrl = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=identify&state=${userId}`;
    
    return NextResponse.redirect(discordLoginUrl);
  }

  // 2. If code exists, EXCHANGE it for an access token
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
    if (tokenData.error) throw new Error(tokenData.error_description || "Token Exchange Failed");

    // 3. Get User Info from Discord
    const userResponse = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    
    const discordUser = await userResponse.json();

    // 4. Update Firebase with the verified name
    if (searchParams.get("state")) {
      const docId = searchParams.get("state")!;
      const userRef = doc(db, "users", docId);
      
      await updateDoc(userRef, {
        "socials.discord": discordUser.username, 
        "socials.discord_verified": true
      });
    }

    // 5. Success! Go back to dashboard
    return NextResponse.redirect("http://localhost:3000/dashboard");

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Discord Login Failed" }, { status: 500 });
  }
}