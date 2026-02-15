import type { Metadata } from 'next';
import { ConsumerHeader } from '@/components/layout/ConsumerHeader';
import { ConsumerFooter } from '@/components/layout/ConsumerFooter';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://repo911.com';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Repo911 — Fight Back Against Wrongful Repossession',
    template: '%s | Repo911',
  },
  description:
    'Was your car wrongfully repossessed? You may be owed $10,000–$100,000+. Free case review in 5 minutes. No obligation.',
  openGraph: {
    type: 'website',
    siteName: 'Repo911',
    title: 'Was Your Car Wrongfully Repossessed? You May Be Owed $10,000–$100,000+',
    description:
      'Even if you missed payments, the repo company may have broken the law. Find out in 5 minutes — 100% free case review.',
    url: siteUrl,
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'Repo911 — Was Your Car Wrongfully Repossessed? Free Case Review',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Repo911 — Fight Wrongful Repossession',
    description:
      'Free case review. Find out if your rights were violated during vehicle repossession.',
    images: ['/twitter-image'],
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: siteUrl,
  },
};

export default function ConsumerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-900">
      <ConsumerHeader />
      <main className="flex-1">{children}</main>
      <ConsumerFooter />
    </div>
  );
}
