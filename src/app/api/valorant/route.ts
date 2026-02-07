import { NextRequest, NextResponse } from 'next/server';
import { getValorantProfile } from '@/lib/valorant';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const name = searchParams.get('name');
    const tag = searchParams.get('tag');
    const region = searchParams.get('region') || 'na';

    if (!name || !tag) {
        return NextResponse.json({ error: 'Missing name or tag' }, { status: 400 });
    }

    try {
        const profile = await getValorantProfile(name, tag, region);
        return NextResponse.json({ profile });
    } catch (error) {
        console.error('Valorant API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch Valorant data' }, { status: 500 });
    }
}
