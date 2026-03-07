import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const name = searchParams.get('name');
    const tag = searchParams.get('tag');
    const region = searchParams.get('region') || 'na';

    if (!name || !tag) {
        return NextResponse.json({ error: 'Missing name or tag' }, { status: 400 });
    }

    const apiKey = process.env.VALORANT_API_KEY;
    const headers: HeadersInit = apiKey ? { 'Authorization': apiKey } : {};

    try {
        // Fetch MMR, Account, and Matches (increased size to 10 for accurate Agent stats)
        const [mmrRes, accountRes, matchesRes] = await Promise.all([
          fetch(`https://api.henrikdev.xyz/valorant/v1/mmr/${region}/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`, { headers }),
          fetch(`https://api.henrikdev.xyz/valorant/v1/account/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`, { headers }),
          fetch(`https://api.henrikdev.xyz/valorant/v3/matches/${region}/${encodeURIComponent(name)}/${encodeURIComponent(tag)}?size=10`, { headers })
        ]);

        const mmrData = await mmrRes.json();
        const accountData = await accountRes.json();
        const matchesData = await matchesRes.json();

        // Crunch the numbers to find their Top 3 Agents from the recent matches
        let topAgents: any[] = [];
        if (matchesData.data) {
            const agentMap: Record<string, any> = {};
            
            matchesData.data.forEach((match: any) => {
                const player = match.players?.all_players?.find((p: any) => 
                    p.name.toLowerCase() === name.toLowerCase() && p.tag.toLowerCase() === tag.toLowerCase()
                );
                
                if (player) {
                    const agentName = player.character;
                    if (!agentMap[agentName]) {
                        agentMap[agentName] = { 
                            name: agentName, 
                            image: player.assets?.agent?.small, 
                            count: 0, wins: 0, kills: 0, deaths: 0 
                        };
                    }
                    agentMap[agentName].count += 1;
                    agentMap[agentName].kills += player.stats.kills;
                    agentMap[agentName].deaths += player.stats.deaths;
                    
                    const isWin = player.team === 'Red' ? match.teams?.red?.has_won : match.teams?.blue?.has_won;
                    if (isWin) agentMap[agentName].wins += 1;
                }
            });
            
            // Sort by most played, then grab the top 3
            topAgents = Object.values(agentMap)
                .sort((a: any, b: any) => b.count - a.count)
                .slice(0, 3);
        }

        return NextResponse.json({ 
          profile: mmrData.data, // Backward compatibility for ProfileGrid
          mmr: mmrData.data,
          account: accountData.data,
          matches: matchesData.data,
          topAgents: topAgents // New injected data!
        });
    } catch (error) {
        console.error('Valorant API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch Valorant data' }, { status: 500 });
    }
}