'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NavLink {
  href: string;
  label: string;
}

export function MobileMenuToggle({ navLinks }: { navLinks: NavLink[] }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        className="md:hidden p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
      >
        {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 border-t border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-900 z-40">
          <div className="px-4 py-4 space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block px-3 py-2 text-base font-medium text-gray-600 dark:text-gray-300 hover:text-[#3474BA] hover:bg-gray-50 dark:hover:bg-slate-800 rounded-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link href="/claim" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="consumer" className="w-full mt-2">
                Check My Case Now
              </Button>
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
