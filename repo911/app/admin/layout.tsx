import { AdminLayoutWrapper } from '@/components/layout/AdminLayoutWrapper';

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
  return <AdminLayoutWrapper>{children}</AdminLayoutWrapper>;
}
