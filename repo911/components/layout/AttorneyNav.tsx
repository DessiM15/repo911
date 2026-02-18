'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingCart,
  FileText,
  CreditCard,
  User,
  Bell,
  LogOut,
  Menu,
  X,
  Scale,
  CheckCheck,
  Gift,
  ClipboardList,
} from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { ThemeToggle } from './ThemeToggle';

const navItems = [
  { href: '/attorney/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/attorney/marketplace', label: 'Marketplace', icon: ShoppingCart },
  { href: '/attorney/my-leads', label: 'My Leads', icon: FileText },
  { href: '/attorney/cases', label: 'Case Tracker', icon: ClipboardList },
  { href: '/attorney/referrals', label: 'Referrals', icon: Gift },
  { href: '/attorney/billing', label: 'Billing', icon: CreditCard },
  { href: '/attorney/profile', label: 'Profile', icon: User },
];

interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  link: string | null;
  created_at: string;
}

export function AttorneyNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const bellRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/attorney/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications);
        setUnreadCount(data.unread_count);
      }
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    // Poll every 60 seconds
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleMarkAllRead() {
    try {
      await fetch('/api/attorney/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mark_all_read: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      // silently fail
    }
  }

  function handleNotificationClick(n: Notification) {
    // Mark as read
    if (!n.read) {
      fetch('/api/attorney/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notification_id: n.id }),
      }).catch(() => {});
      setNotifications((prev) =>
        prev.map((item) => (item.id === n.id ? { ...item, read: true } : item))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    }
    setBellOpen(false);
    if (n.link) router.push(n.link);
  }

  async function handleSignOut() {
    sessionStorage.removeItem('attorney_session_active');
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/attorney/login';
  }

  function NotificationDropdown() {
    return (
      <div role="menu" aria-label="Notifications" className="absolute right-0 top-full mt-2 w-[calc(100vw-2rem)] sm:w-80 max-w-sm bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-lg overflow-hidden z-50">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-slate-700">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Notifications</h3>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-xs text-[#3474BA] dark:text-blue-300 hover:underline flex items-center gap-1"
            >
              <CheckCheck className="h-3 w-3" />
              Mark all read
            </button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-400 dark:text-gray-500">
              No notifications yet.
            </div>
          ) : (
            notifications.slice(0, 15).map((n) => (
              <button
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                className={cn(
                  'w-full text-left px-4 py-3 border-b border-gray-50 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors',
                  !n.read && 'bg-blue-50/50'
                )}
              >
                <div className="flex items-start gap-2">
                  {!n.read && (
                    <span className="mt-1.5 h-2 w-2 rounded-full bg-[#3474BA] shrink-0" />
                  )}
                  <div className={cn(!n.read ? '' : 'ml-4')}>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{n.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{n.message}</p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">{formatDate(n.created_at)}</p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
        <Link
          href="/attorney/notifications"
          onClick={() => setBellOpen(false)}
          className="block text-center text-xs text-[#3474BA] dark:text-blue-300 hover:underline px-4 py-2.5 border-t border-gray-100 dark:border-slate-700"
        >
          View all notifications
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-[#1B2A4A] text-white">
        {/* Logo */}
        <div className="flex items-center gap-2 px-6 h-16 border-b border-white/10">
          <Scale className="h-7 w-7 text-[#2ECC71]" />
          <span className="text-lg font-bold">
            Repo<span className="text-[#2ECC71]">911</span>
          </span>
          <span className="text-xs text-white/50 ml-1">Attorney</span>
        </div>

        {/* Navigation */}
        <nav aria-label="Attorney navigation" className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
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
            );
          })}
        </nav>

        {/* Bottom */}
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

      {/* Top Bar (Desktop) */}
      <div className="hidden lg:flex lg:ml-64 h-16 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 items-center justify-end px-6 sticky top-0 z-30">
        <ThemeToggle />
        <div ref={bellRef} className="relative">
          <button
            onClick={() => setBellOpen(!bellOpen)}
            aria-label="Notifications"
            aria-haspopup="true"
            aria-expanded={bellOpen}
            className="relative p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-0.5 right-0.5 h-4 w-4 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          {bellOpen && <NotificationDropdown />}
        </div>
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between h-16 px-4 bg-[#1B2A4A] text-white sticky top-0 z-40">
        <Link href="/attorney/dashboard" className="flex items-center gap-2">
          <Scale className="h-6 w-6 text-[#2ECC71]" />
          <span className="text-lg font-bold">
            Repo<span className="text-[#2ECC71]">911</span>
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <div ref={bellRef} className="relative">
            <button
              onClick={() => setBellOpen(!bellOpen)}
              aria-label="Notifications"
              aria-haspopup="true"
              aria-expanded={bellOpen}
              className="relative p-2 text-white/70 hover:text-white"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-0.5 right-0.5 h-4 w-4 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            {bellOpen && <NotificationDropdown />}
          </div>
          <button
            className="p-2.5 text-white/70 hover:text-white"
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
                <Scale className="h-6 w-6 text-[#2ECC71]" />
                <span className="text-lg font-bold">
                  Repo<span className="text-[#2ECC71]">911</span>
                </span>
              </div>
              <button onClick={() => setMobileOpen(false)} aria-label="Close menu" className="p-1 text-white/60 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav aria-label="Attorney navigation" className="flex-1 px-3 py-4 space-y-1">
              {navItems.map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
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
                );
              })}
            </nav>
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
