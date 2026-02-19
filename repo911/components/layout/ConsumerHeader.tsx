import Link from 'next/link';
import { Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MobileMenuToggle } from './MobileMenuToggle';
import { LanguageSwitcher } from './LanguageSwitcher';
import { ThemeToggle } from './ThemeToggle';
import { ConsumerAuthNav } from '@/components/consumer/ConsumerAuthNav';
import { getTranslations } from 'next-intl/server';

export async function ConsumerHeader() {
  const t = await getTranslations('header');

  const navLinks = [
    { href: '/how-it-works', label: t('howItWorks') },
    { href: '/blog', label: t('blog') },
    { href: '/faq', label: t('faq') },
    { href: '/track', label: t('trackCase') },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-700 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Shield className="h-8 w-8 text-[#3474BA] dark:text-blue-400" />
            <span className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Repo<span className="text-[#3474BA] dark:text-blue-400">911</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav aria-label="Main navigation" className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-[#3474BA] dark:hover:text-blue-300 transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <LanguageSwitcher />
            <ThemeToggle />
            <ConsumerAuthNav />
            <Link href="/claim">
              <Button variant="consumer" size="sm">
                {t('checkCase')}
              </Button>
            </Link>
          </nav>

          {/* Mobile Menu (client component) */}
          <MobileMenuToggle navLinks={navLinks}>
            <ConsumerAuthNav />
          </MobileMenuToggle>
        </div>
      </div>
    </header>
  );
}
