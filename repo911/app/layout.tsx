import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import Script from 'next/script';
import { Toaster } from 'sonner';
import { LazyErrorTracking } from '@/components/LazyErrorTracking';
import { ThemeProvider } from '@/components/layout/ThemeProvider';
import './globals.css';

const plausibleDomain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://repo911.com'),
  title: {
    default: 'Repo911 — Fight Back Against Wrongful Repossession',
    template: '%s | Repo911',
  },
  description:
    'Was your car wrongfully repossessed? You may be owed $10,000–$100,000+. Free case review — find out in 5 minutes.',
  keywords: [
    'wrongful repossession',
    'car repo',
    'vehicle repossession lawyer',
    'breach of peace',
    'FDCPA',
    'SCRA',
    'repossession rights',
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html suppressHydrationWarning>
      <head>
        {process.env.NEXT_PUBLIC_SUPABASE_URL && (
          <>
            <link rel="dns-prefetch" href={process.env.NEXT_PUBLIC_SUPABASE_URL} />
            <link rel="preconnect" href={process.env.NEXT_PUBLIC_SUPABASE_URL} crossOrigin="anonymous" />
          </>
        )}
        {plausibleDomain && (
          <link rel="dns-prefetch" href="https://plausible.io" />
        )}
      </head>
      <body
        className={`${geistSans.variable} antialiased`}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-white focus:px-4 focus:py-2 focus:rounded focus:shadow-lg focus:text-gray-900"
        >
          Skip to main content
        </a>
        <ThemeProvider>
          <LazyErrorTracking>{children}</LazyErrorTracking>
          <Toaster richColors position="top-right" />
        </ThemeProvider>
        {plausibleDomain && (
          <Script
            defer
            data-domain={plausibleDomain}
            src="https://plausible.io/js/script.outbound-links.js"
            strategy="afterInteractive"
          />
        )}
      </body>
    </html>
  );
}
