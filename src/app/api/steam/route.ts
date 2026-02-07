import { NextRequest, NextResponse } from 'next/server';
import { getSteamProfile, getRecentlyPlayed, getSteamLevel, getOwnedGamesCount, getGameProgress } from '@/lib/steam';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const steamId = searchParams.get('steamId');

    if (!steamId) {
        return NextResponse.json({ error: 'Missing steamId' }, { status: 400 });
    }

    try {
        // Fetch all Steam data in parallel
        const [profile, recentGames, level, gameCount] = await Promise.all([
            getSteamProfile(steamId),
            getRecentlyPlayed(steamId),
            getSteamLevel(steamId),
            getOwnedGamesCount(steamId)
        ]);

        // If there are recent games, get progress for the first one
        let heroGameProgress = null;
        if (recentGames && recentGames.length > 0) {
            heroGameProgress = await getGameProgress(steamId, recentGames[0].appid);
        }

        return NextResponse.json({
            profile,
            recentGames: recentGames || [],
            level: level || 0,
            gameCount: gameCount || 0,
            heroGameProgress,
            totalAchievements: "1,204" // Placeholder
        });
    } catch (error) {
        console.error('Steam API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch Steam data' }, { status: 500 });
    }
}
