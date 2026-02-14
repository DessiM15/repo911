'use client';

import { Shield, RefreshCw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f9fafb',
          padding: '1rem',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}>
          <div style={{ textAlign: 'center', maxWidth: '28rem' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <Shield style={{ height: '4rem', width: '4rem', color: '#f87171', margin: '0 auto' }} />
            </div>
            <h1 style={{ fontSize: '2.25rem', fontWeight: 700, color: '#111827', marginBottom: '0.5rem' }}>
              Something Went Wrong
            </h1>
            <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
              We encountered a critical error. Please try refreshing the page.
            </p>
            <button
              onClick={reset}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                backgroundColor: '#3474BA',
                color: '#fff',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              <RefreshCw style={{ height: '1rem', width: '1rem' }} />
              Try Again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
