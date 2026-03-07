import { ImageResponse } from 'next/og';

export async function GET() {
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
          fontFamily: 'sans-serif',
        }}
      >
        {/* Subtle Indigo Glows in the background */}
        <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: '60%', height: '60%', background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, rgba(0,0,0,0) 70%)', filter: 'blur(40px)' }} />
        <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: '60%', height: '60%', background: 'radial-gradient(circle, rgba(99,102,241,0.1) 0%, rgba(0,0,0,0) 70%)', filter: 'blur(40px)' }} />

        {/* Pulse Logo & Name */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '30px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100px',
              height: '100px',
              backgroundColor: '#4f46e5', // Indigo-600
              borderRadius: '28px',
              marginRight: '32px',
              boxShadow: '0 20px 40px rgba(79, 70, 229, 0.4)',
              border: '2px solid rgba(255,255,255,0.2)'
            }}
          >
            {/* Sparkle SVG Logo */}
            <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>
            </svg>
          </div>
          <span style={{ fontSize: 100, fontWeight: 900, color: 'white', letterSpacing: '-3px' }}>
            Pulse
          </span>
        </div>

        {/* Subtitle */}
        <span style={{ fontSize: 42, fontWeight: 700, color: '#a1a1aa', letterSpacing: '-1px' }}>
          The Linktree for Gamers
        </span>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}