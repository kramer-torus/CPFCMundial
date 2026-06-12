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
          background: 'linear-gradient(145deg, #D0142F 0%, #9A0E22 55%, #6B0015 100%)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle diagonal sheen top-left */}
        <div style={{
          position: 'absolute', top: -60, left: -60,
          width: 320, height: 320,
          background: 'rgba(255,255,255,0.06)',
          transform: 'rotate(45deg)',
          display: 'flex',
        }} />

        {/* Eagle — large, fills upper portion */}
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: '28px',
        }}>
          <span style={{ fontSize: '230px', lineHeight: 1 }}>🦅</span>
        </div>

        {/* Gold separator */}
        <div style={{
          width: '100%', height: '5px',
          background: 'linear-gradient(90deg, transparent, #E8C84A, transparent)',
          display: 'flex',
        }} />

        {/* Navy text band */}
        <div style={{
          width: '100%',
          background: '#1A3060',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: '14px',
          paddingBottom: '22px',
          gap: '2px',
        }}>
          <span style={{
            fontSize: '86px', fontWeight: 900,
            color: 'white', letterSpacing: '5px',
            fontFamily: 'sans-serif', lineHeight: 1,
          }}>CPFC</span>
          <span style={{
            fontSize: '22px', fontWeight: 700,
            color: '#C9A84C', letterSpacing: '10px',
            fontFamily: 'sans-serif',
          }}>MUNDIAL 26</span>
        </div>
      </div>
    ),
    { width: 512, height: 512 }
  );
}
