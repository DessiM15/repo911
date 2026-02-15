import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import { LazyErrorTracking } from '@/components/LazyErrorTracking';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
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
      </head>
      <body
        className={`${geistSans.variable} antialiased`}
      >
        <LazyErrorTracking>{children}</LazyErrorTracking>
      </body>
    </html>
  );
}
