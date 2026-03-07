import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { path } = await request.json();
    
    if (path) {
      // Instantly destroys the Vercel cache for the specific URL passed in
      revalidatePath(path);
      return NextResponse.json({ revalidated: true, now: Date.now() });
    }
    
    return NextResponse.json({ revalidated: false, message: 'Missing path' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ revalidated: false, message: 'Error revalidating' }, { status: 500 });
  }
}