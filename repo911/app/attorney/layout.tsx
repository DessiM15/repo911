import { AttorneyLayoutWrapper } from '@/components/layout/AttorneyLayoutWrapper';

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
  return <AttorneyLayoutWrapper>{children}</AttorneyLayoutWrapper>;
}
