import { Geist_Mono } from 'next/font/google';
import { AttorneyLayoutWrapper } from '@/components/layout/AttorneyLayoutWrapper';

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata = {
  title: {
    default: 'Attorney Portal',
    template: '%s | Repo911 Attorney Portal',
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function AttorneyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={geistMono.variable}>
      <AttorneyLayoutWrapper>{children}</AttorneyLayoutWrapper>
    </div>
  );
}
