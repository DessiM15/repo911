import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { ErrorTrackingProvider } from '@/components/ErrorTrackingProvider';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
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
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ErrorTrackingProvider>{children}</ErrorTrackingProvider>
      </body>
    </html>
  );
}
