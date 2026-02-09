import { AttorneyNav } from '@/components/layout/AttorneyNav';

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
  return (
    <div className="min-h-screen bg-gray-50">
      <AttorneyNav />
      <div className="lg:ml-64">
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
