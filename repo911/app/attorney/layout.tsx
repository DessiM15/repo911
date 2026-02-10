import { AttorneyLayoutWrapper } from '@/components/layout/AttorneyLayoutWrapper';

export const metadata = {
  title: {
    default: 'Attorney Portal',
    template: '%s | Repo911 Attorney Portal',
  },
};

export default function AttorneyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AttorneyLayoutWrapper>{children}</AttorneyLayoutWrapper>;
}
