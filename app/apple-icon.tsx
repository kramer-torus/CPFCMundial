import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(145deg, #D0142F 0%, #9A0E22 55%, #6B0015 100%)',
          overflow: 'hidden',
        }}
      >
        {/* Sheen */}
        <div style={{
          position: 'absolute', top: -20, left: -20,
          width: 110, height: 110,
          background: 'rgba(255,255,255,0.06)',
          transform: 'rotate(45deg)',
          display: 'flex',
        }} />

        {/* Eagle */}
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: '8px',
        }}>
          <span style={{ fontSize: '82px', lineHeight: 1 }}>🦅</span>
        </div>

        {/* Gold separator */}
        <div style={{ width: '100%', height: '2px', background: '#C9A84C', display: 'flex' }} />

        {/* Navy band */}
        <div style={{
          width: '100%', background: '#1A3060',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          paddingTop: '5px', paddingBottom: '8px', gap: '1px',
        }}>
          <span style={{
            fontSize: '30px', fontWeight: 900,
            color: 'white', letterSpacing: '2px',
            fontFamily: 'sans-serif', lineHeight: 1,
          }}>CPFC</span>
          <span style={{
            fontSize: '8px', fontWeight: 700,
            color: '#C9A84C', letterSpacing: '4px',
            fontFamily: 'sans-serif',
          }}>MUNDIAL 26</span>
        </div>
      </div>
    ),
    { width: 180, height: 180 }
  );
}
