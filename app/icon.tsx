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
        {/* Globe ring glow */}
        <div style={{
          position: 'absolute', top: 30, left: 30,
          width: 452, height: 452,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 50% 50%, rgba(200,168,76,0.18) 0%, transparent 65%)',
          display: 'flex',
        }} />

        {/* Red top band */}
        <div style={{
          width: '100%',
          background: 'linear-gradient(180deg, #D0142F 0%, #9A0E22 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: '18px',
          paddingBottom: '18px',
        }}>
          <span style={{
            fontSize: '88px', fontWeight: 900,
            color: 'white', letterSpacing: '8px',
            fontFamily: 'sans-serif', lineHeight: 1,
          }}>CPFC</span>
        </div>

        {/* Gold trim */}
        <div style={{ width: '100%', height: '6px', background: '#C9A84C', display: 'flex' }} />

        {/* Stars row */}
        <div style={{
          display: 'flex', justifyContent: 'center',
          paddingTop: '16px',
        }}>
          <span style={{ fontSize: '32px', color: '#E8C84A', letterSpacing: '6px' }}>★★★★★</span>
        </div>

        {/* Trophy + globe */}
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          paddingBottom: '8px',
        }}>
          <span style={{ fontSize: '188px', lineHeight: 1 }}>🏆</span>
        </div>

        {/* Gold separator */}
        <div style={{
          width: '100%', height: '5px',
          background: 'linear-gradient(90deg, transparent, #E8C84A 30%, #E8C84A 70%, transparent)',
          display: 'flex',
        }} />

        {/* Navy text band */}
        <div style={{
          width: '100%',
          background: '#080E1E',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: '12px',
          paddingBottom: '18px',
          gap: '2px',
        }}>
          <span style={{
            fontSize: '52px', fontWeight: 900,
            color: 'white', letterSpacing: '4px',
            fontFamily: 'sans-serif', lineHeight: 1,
          }}>MUNDIAL</span>
          <span style={{
            fontSize: '28px', fontWeight: 700,
            color: '#C9A84C', letterSpacing: '10px',
            fontFamily: 'sans-serif',
          }}>2026</span>
        </div>
      </div>
    ),
    { width: 512, height: 512 }
  );
}
