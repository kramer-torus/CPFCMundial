import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'CPFCMundial — CPFC 2026 World Cup Draft Game';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #C4122E 0%, #8B0D20 45%, #1F3864 100%)',
          fontFamily: 'system-ui, sans-serif',
          padding: '60px',
        }}
      >
        <div style={{ fontSize: 100, lineHeight: 1 }}>🦅</div>
        <div style={{ display: 'flex', marginTop: 24 }}>
          <span style={{ fontSize: 72, fontWeight: 800, color: 'white' }}>CPFC</span>
          <span style={{ fontSize: 72, fontWeight: 800, color: '#C9A84C' }}>Mundial</span>
        </div>
        <div style={{ fontSize: 32, color: '#C9A84C', fontStyle: 'italic', marginTop: 12 }}>
          Glad All Over the World
        </div>
        <div style={{ fontSize: 22, color: 'rgba(255,255,255,0.55)', marginTop: 16 }}>
          CPFC 2026 World Cup Draft Game · cpfc-mundial.vercel.app
        </div>
      </div>
    ),
    { ...size }
  );
}
