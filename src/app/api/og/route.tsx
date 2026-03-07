import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('user');

    if (!username) {
      return new Response('User not found', { status: 404 });
    }

    // Use the exact same fast REST fetch you use in page.tsx
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${username}`;
    
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error("Failed to fetch");
    
    const data = await res.json();
    const fields = data.fields;

    const displayName = fields.displayName?.stringValue || username;
    const banner = fields.theme?.mapValue?.fields?.banner?.stringValue || "https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=2600&auto=format&fit=crop";
    const avatar = fields.theme?.mapValue?.fields?.avatar?.stringValue || "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png";
    const primaryColor = fields.theme?.mapValue?.fields?.primary?.stringValue || "#1e1f22";

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0a0a0c',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Background Banner with Blur */}
          <img
            src={banner}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: 0.4,
              filter: 'blur(40px)',
            }}
          />

          {/* Clean Glassmorphism Card inside the image */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: `${primaryColor}CC`, // Adds transparency
              padding: '60px 100px',
              borderRadius: '40px',
              border: '2px solid rgba(255,255,255,0.1)',
              boxShadow: '0 30px 60px rgba(0,0,0,0.5)',
            }}
          >
            <img
              src={avatar}
              style={{
                width: 200,
                height: 200,
                borderRadius: '100px',
                border: '6px solid #1e1f22',
                marginBottom: '30px',
                objectFit: 'cover',
              }}
            />
            
            <h1
              style={{
                fontSize: 80,
                fontWeight: 900,
                color: 'white',
                margin: 0,
                lineHeight: 1.1,
                fontFamily: 'sans-serif',
              }}
            >
              {displayName}
            </h1>
            <p
              style={{
                fontSize: 40,
                color: '#a1a1aa', // text-zinc-400
                margin: '10px 0 0 0',
                fontFamily: 'sans-serif',
              }}
            >
              @{username}
            </p>
          </div>

          {/* Pulse Watermark */}
          <div
            style={{
              position: 'absolute',
              bottom: 40,
              display: 'flex',
              alignItems: 'center',
              color: 'rgba(255,255,255,0.5)',
              fontSize: 30,
              fontWeight: 'bold',
              fontFamily: 'sans-serif',
            }}
          >
            pulsegg.in
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e) {
    console.error(e);
    return new Response('Failed to generate image', { status: 500 });
  }
}