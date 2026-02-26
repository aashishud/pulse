import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const uid = searchParams.get("uid");

  if (!uid) return NextResponse.json({ error: "Missing UID" }, { status: 400 });

  try {
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const userData = userSnap.data();
    if (!userData.spotify || !userData.spotify.access_token) {
      return NextResponse.json({ nowPlaying: { isPlaying: false }, topTracks: [], message: "Not connected" });
    }

    let { access_token, refresh_token, expires_at } = userData.spotify;

    // 1. Refresh Token if expired
    if (Date.now() > expires_at - 5 * 60 * 1000) {
      const clientId = process.env.SPOTIFY_CLIENT_ID?.trim();
      const clientSecret = process.env.SPOTIFY_CLIENT_SECRET?.trim();

      const refreshRes = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
        },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: refresh_token,
        }),
      });

      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        access_token = refreshData.access_token;
        expires_at = Date.now() + refreshData.expires_in * 1000;
        if (refreshData.refresh_token) refresh_token = refreshData.refresh_token;

        await updateDoc(userRef, {
          "spotify.access_token": access_token,
          "spotify.refresh_token": refresh_token,
          "spotify.expires_at": expires_at,
        });
      }
    }

    // 2. Fetch the Currently Playing song
    const nowPlayingRes = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
      headers: { Authorization: `Bearer ${access_token}` },
      cache: "no-store",
    });

    let nowPlaying = { isPlaying: false, title: "", artist: "", albumArt: "", url: "" };
    
    // We only parse the data if a song is actually playing (Status 200)
    // Notice how there is NO "early return" here if it fails!
    if (nowPlayingRes.status === 200) {
      const song = await nowPlayingRes.json();
      if (song && song.item) {
         nowPlaying = {
            isPlaying: song.is_playing,
            title: song.item.name,
            artist: song.item.artists.map((a: any) => a.name).join(", "),
            albumArt: song.item.album.images[0]?.url,
            url: song.item.external_urls.spotify,
         };
      }
    }

    // 3. Always Fetch Top 3 Tracks (Short Term = last 4 weeks)
    const topTracksRes = await fetch("https://api.spotify.com/v1/me/top/tracks?limit=3&time_range=short_term", {
      headers: { Authorization: `Bearer ${access_token}` },
      cache: "no-store",
    });

    let topTracks: any[] = [];

    if (topTracksRes.status === 200) {
       const tracksData = await topTracksRes.json();
       if (tracksData && tracksData.items) {
          topTracks = tracksData.items.map((track: any) => ({
             id: track.id,
             title: track.name,
             artist: track.artists.map((a: any) => a.name).join(", "),
             albumArt: track.album.images[0]?.url,
             url: track.external_urls.spotify,
          }));
       }
    }

    // Return BOTH pieces of data safely
    return NextResponse.json({
      nowPlaying,
      topTracks
    });

  } catch (error: any) {
    console.error("Spotify API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}