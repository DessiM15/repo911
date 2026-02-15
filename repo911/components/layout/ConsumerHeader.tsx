import Link from 'next/link';
import { Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MobileMenuToggle } from './MobileMenuToggle';
import { LanguageSwitcher } from './LanguageSwitcher';
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
    <header className="sticky top-0 z-40 bg-white border-b border-gray-100 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Shield className="h-8 w-8 text-[#3474BA]" />
            <span className="text-xl font-bold text-gray-900">
              Repo<span className="text-[#3474BA]">911</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav aria-label="Main navigation" className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-gray-600 hover:text-[#3474BA] transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <LanguageSwitcher />
            <Link href="/claim">
              <Button variant="consumer" size="sm">
                {t('checkCase')}
              </Button>
            </Link>
          </nav>

          {/* Mobile Menu (client component) */}
          <MobileMenuToggle navLinks={navLinks} />
        </div>
      </div>
    </header>
  );
}
