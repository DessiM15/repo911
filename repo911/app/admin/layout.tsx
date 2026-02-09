import { AdminSidebar } from '@/components/layout/AdminSidebar';

export const metadata = {
  title: {
    default: 'Admin Portal',
    template: '%s | Repo911 Admin',
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar />
      <div className="lg:ml-64">
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
