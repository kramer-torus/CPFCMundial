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
          background: 'linear-gradient(160deg, #0D1B3E 0%, #1A0A20 100%)',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Subtle globe glow */}
        <div style={{
          position: 'absolute', top: 20, left: 20, width: 140, height: 140,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(200,168,76,0.14) 0%, transparent 70%)',
          display: 'flex',
        }} />

        {/* Red top band — 44px */}
        <div style={{
          width: '100%', height: 44,
          background: 'linear-gradient(180deg, #D0142F 0%, #9A0E22 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <span style={{
            fontSize: 28, fontWeight: 900,
            color: 'white', letterSpacing: '3px',
            fontFamily: 'sans-serif', lineHeight: 1,
          }}>CPFC</span>
        </div>

        {/* Gold trim */}
        <div style={{ width: '100%', height: 3, background: '#C9A84C', display: 'flex', flexShrink: 0 }} />

        {/* Stars */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 8, flexShrink: 0 }}>
          <span style={{ fontSize: 10, color: '#C9A84C', letterSpacing: '3px' }}>★ ★ ★ ★ ★</span>
        </div>

        {/* Trophy — dominant centre */}
        <div style={{
          flex: 1, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          paddingBottom: 4,
        }}>
          <span style={{ fontSize: 72, lineHeight: 1 }}>🏆</span>
        </div>

        {/* Gold trim */}
        <div style={{ width: '100%', height: 3, background: '#C9A84C', display: 'flex', flexShrink: 0 }} />

        {/* Navy band — 36px */}
        <div style={{
          width: '100%', height: 36,
          background: '#080E1E',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: 1, flexShrink: 0,
        }}>
          <span style={{
            fontSize: 15, fontWeight: 900, color: 'white',
            letterSpacing: '2px', fontFamily: 'sans-serif', lineHeight: 1,
          }}>MUNDIAL</span>
          <span style={{
            fontSize: 9, fontWeight: 700, color: '#C9A84C',
            letterSpacing: '3px', fontFamily: 'sans-serif',
          }}>2026</span>
        </div>
      </div>
    ),
    { width: 180, height: 180 }
  );
}
