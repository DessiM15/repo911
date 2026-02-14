import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'Repo911 — Was Your Car Wrongfully Repossessed? Free Case Review';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OGImage() {
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
          background: 'linear-gradient(135deg, #1B2A4A 0%, #0F1B33 100%)',
          position: 'relative',
        }}
      >
        {/* Accent bar at top */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '6px',
            background: '#F5A623',
          }}
        />

        {/* Logo text */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 800,
            color: '#FFFFFF',
            letterSpacing: '-1px',
            marginBottom: '16px',
          }}
        >
          Repo
          <span style={{ color: '#F5A623' }}>911</span>
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 36,
            fontWeight: 600,
            color: '#FFFFFF',
            marginBottom: '12px',
            textAlign: 'center',
          }}
        >
          Was Your Car Wrongfully Repossessed?
        </div>

        {/* Sub-line */}
        <div
          style={{
            fontSize: 24,
            fontWeight: 400,
            color: '#B0BEC5',
            textAlign: 'center',
          }}
        >
          Free Case Review — Find Out in 5 Minutes
        </div>

        {/* Accent bar at bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '100%',
            height: '6px',
            background: '#F5A623',
          }}
        />
      </div>
    ),
    { ...size }
  );
}
