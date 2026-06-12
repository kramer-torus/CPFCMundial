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
        {/* Globe glow */}
        <div style={{
          position: 'absolute', top: 8, left: 8,
          width: 164, height: 164,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(200,168,76,0.16) 0%, transparent 65%)',
          display: 'flex',
        }} />

        {/* Red top band */}
        <div style={{
          width: '100%',
          background: 'linear-gradient(180deg, #D0142F 0%, #9A0E22 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: '6px',
          paddingBottom: '6px',
        }}>
          <span style={{
            fontSize: '32px', fontWeight: 900,
            color: 'white', letterSpacing: '3px',
            fontFamily: 'sans-serif', lineHeight: 1,
          }}>CPFC</span>
        </div>

        {/* Gold trim */}
        <div style={{ width: '100%', height: '2px', background: '#C9A84C', display: 'flex' }} />

        {/* Stars */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '4px' }}>
          <span style={{ fontSize: '11px', color: '#E8C84A', letterSpacing: '2px' }}>★★★★★</span>
        </div>

        {/* Trophy */}
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <span style={{ fontSize: '68px', lineHeight: 1 }}>🏆</span>
        </div>

        {/* Gold separator */}
        <div style={{ width: '100%', height: '2px', background: '#C9A84C', display: 'flex' }} />

        {/* Navy band */}
        <div style={{
          width: '100%', background: '#080E1E',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          paddingTop: '4px', paddingBottom: '6px', gap: '1px',
        }}>
          <span style={{
            fontSize: '18px', fontWeight: 900,
            color: 'white', letterSpacing: '2px',
            fontFamily: 'sans-serif', lineHeight: 1,
          }}>MUNDIAL</span>
          <span style={{
            fontSize: '9px', fontWeight: 700,
            color: '#C9A84C', letterSpacing: '4px',
            fontFamily: 'sans-serif',
          }}>2026</span>
        </div>
      </div>
    ),
    { width: 180, height: 180 }
  );
}
