import { ImageResponse } from 'next/og';

export const size = { width: 512, height: 512 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(160deg, #0D1B3E 0%, #1A0A20 100%)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Globe glow */}
        <div style={{
          position: 'absolute', top: 60, left: 60,
          width: 392, height: 392,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(200,168,76,0.16) 0%, transparent 65%)',
          display: 'flex',
        }} />

        {/* Red top band — 124px */}
        <div style={{
          width: '100%', height: 124,
          background: 'linear-gradient(180deg, #D0142F 0%, #9A0E22 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <span style={{
            fontSize: 82, fontWeight: 900,
            color: 'white', letterSpacing: '8px',
            fontFamily: 'sans-serif', lineHeight: 1,
          }}>CPFC</span>
        </div>

        {/* Gold trim */}
        <div style={{
          width: '100%', height: 7,
          background: 'linear-gradient(90deg, transparent, #C9A84C 20%, #C9A84C 80%, transparent)',
          display: 'flex', flexShrink: 0,
        }} />

        {/* Stars */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 22, flexShrink: 0 }}>
          <span style={{ fontSize: 28, color: '#C9A84C', letterSpacing: '8px' }}>★ ★ ★ ★ ★</span>
        </div>

        {/* Trophy — dominant centre */}
        <div style={{
          flex: 1, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          paddingBottom: 8,
        }}>
          <span style={{ fontSize: 200, lineHeight: 1 }}>🏆</span>
        </div>

        {/* Gold separator */}
        <div style={{
          width: '100%', height: 7,
          background: 'linear-gradient(90deg, transparent, #C9A84C 20%, #C9A84C 80%, transparent)',
          display: 'flex', flexShrink: 0,
        }} />

        {/* Navy band — 104px */}
        <div style={{
          width: '100%', height: 104,
          background: '#080E1E',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: 4, flexShrink: 0,
        }}>
          <span style={{
            fontSize: 52, fontWeight: 900, color: 'white',
            letterSpacing: '5px', fontFamily: 'sans-serif', lineHeight: 1,
          }}>MUNDIAL</span>
          <span style={{
            fontSize: 26, fontWeight: 700, color: '#C9A84C',
            letterSpacing: '10px', fontFamily: 'sans-serif',
          }}>2026</span>
        </div>
      </div>
    ),
    { width: 512, height: 512 }
  );
}
