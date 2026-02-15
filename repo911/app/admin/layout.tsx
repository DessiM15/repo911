import { Geist_Mono } from 'next/font/google';
import { AdminLayoutWrapper } from '@/components/layout/AdminLayoutWrapper';

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata = {
  title: {
    default: 'Admin Portal',
    template: '%s | Repo911 Admin',
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={geistMono.variable}>
      <AdminLayoutWrapper>{children}</AdminLayoutWrapper>
    </div>
  );
}
