'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  Users,
  Contact,
  Kanban,
  Receipt,
  DollarSign,
  Settings,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  Bell,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

const navItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/leads', label: 'Leads', icon: FileText },
  { href: '/admin/attorneys', label: 'Attorneys', icon: Users },
  { href: '/admin/crm', label: 'CRM', icon: Contact, children: [
    { href: '/admin/crm', label: 'Contacts' },
    { href: '/admin/crm/pipeline', label: 'Pipeline' },
  ]},
  { href: '/admin/transactions', label: 'Transactions', icon: Receipt },
  { href: '/admin/fee-tracking', label: 'Fee Tracking', icon: DollarSign },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/admin/login';
  }

  const renderNavItems = (closeMobile?: () => void) => (
    <nav className="flex-1 px-3 py-4 space-y-1">
      {navItems.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
        return (
          <div key={item.href}>
            <Link
              href={item.href}
              onClick={closeMobile}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-white/10 text-white'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
            {item.children && isActive && (
              <div className="ml-8 mt-1 space-y-1">
                {item.children.map((child) => (
                  <Link
                    key={child.href}
                    href={child.href}
                    onClick={closeMobile}
                    className={cn(
                      'block px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                      pathname === child.href
                        ? 'text-white bg-white/5'
                        : 'text-white/40 hover:text-white/70'
                    )}
                  >
                    {child.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-[#1B2A4A] text-white">
        <div className="flex items-center gap-2 px-6 h-16 border-b border-white/10">
          <ShieldCheck className="h-7 w-7 text-[#2ECC71]" />
          <span className="text-lg font-bold">
            Repo<span className="text-[#2ECC71]">911</span>
          </span>
          <span className="text-xs text-white/50 ml-1">Admin</span>
        </div>
        {renderNavItems()}
        <div className="px-3 py-4 border-t border-white/10">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 transition-colors w-full"
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Desktop Top Bar */}
      <div className="hidden lg:flex lg:ml-64 h-16 bg-white border-b border-gray-200 items-center justify-end px-6 sticky top-0 z-30">
        <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full" />
        </button>
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between h-16 px-4 bg-[#1B2A4A] text-white sticky top-0 z-40">
        <Link href="/admin/dashboard" className="flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-[#2ECC71]" />
          <span className="text-lg font-bold">
            Repo<span className="text-[#2ECC71]">911</span>
          </span>
          <span className="text-xs text-white/50 ml-1">Admin</span>
        </Link>
        <div className="flex items-center gap-2">
          <button className="relative p-2 text-white/70 hover:text-white">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full" />
          </button>
          <button
            className="p-2 text-white/70 hover:text-white"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="fixed inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-72 bg-[#1B2A4A] text-white flex flex-col">
            <div className="flex items-center justify-between px-6 h-16 border-b border-white/10">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-6 w-6 text-[#2ECC71]" />
                <span className="text-lg font-bold">
                  Repo<span className="text-[#2ECC71]">911</span>
                </span>
              </div>
              <button onClick={() => setMobileOpen(false)} className="p-1 text-white/60 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            {renderNavItems(() => setMobileOpen(false))}
            <div className="px-3 py-4 border-t border-white/10">
              <button
                onClick={handleSignOut}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 transition-colors w-full"
              >
                <LogOut className="h-5 w-5" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
