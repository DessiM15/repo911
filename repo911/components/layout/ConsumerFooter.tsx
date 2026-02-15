import Link from 'next/link';
import { Shield } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

export async function ConsumerFooter() {
  const t = await getTranslations('footer');

  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Shield className="h-7 w-7 text-[#3474BA]" />
              <span className="text-lg font-bold text-gray-900">
                Repo<span className="text-[#3474BA]">911</span>
              </span>
            </Link>
            <p className="text-sm text-gray-500 leading-relaxed">
              {t('brandDescription')}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h2 className="text-sm font-semibold text-gray-900 mb-4">{t('quickLinks')}</h2>
            <ul className="space-y-2">
              <li>
                <Link href="/claim" className="text-sm text-gray-500 hover:text-[#3474BA] transition-colors">
                  {t('freeReview')}
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="text-sm text-gray-500 hover:text-[#3474BA] transition-colors">
                  {t('howItWorks')}
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-sm text-gray-500 hover:text-[#3474BA] transition-colors">
                  {t('faq')}
                </Link>
              </li>
              <li>
                <Link href="/track" className="text-sm text-gray-500 hover:text-[#3474BA] transition-colors">
                  {t('trackCase')}
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-sm text-gray-500 hover:text-[#3474BA] transition-colors">
                  {t('blog')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h2 className="text-sm font-semibold text-gray-900 mb-4">{t('legal')}</h2>
            <ul className="space-y-2">
              <li>
                <Link href="/privacy" className="text-sm text-gray-500 hover:text-[#3474BA] transition-colors">
                  {t('privacy')}
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm text-gray-500 hover:text-[#3474BA] transition-colors">
                  {t('terms')}
                </Link>
              </li>
              <li>
                <Link href="/disclaimer" className="text-sm text-gray-500 hover:text-[#3474BA] transition-colors">
                  {t('disclaimer')}
                </Link>
              </li>
            </ul>
          </div>

          {/* For Attorneys */}
          <div>
            <h2 className="text-sm font-semibold text-gray-900 mb-4">{t('forAttorneys')}</h2>
            <ul className="space-y-2">
              <li>
                <Link href="/attorney/login" className="text-sm text-gray-500 hover:text-[#3474BA] transition-colors">
                  {t('attorneyLogin')}
                </Link>
              </li>
              <li>
                <Link href="/attorney/register" className="text-sm text-gray-500 hover:text-[#3474BA] transition-colors">
                  {t('joinNetwork')}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 pt-8 border-t border-gray-200">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-gray-500">
              {t('copyright', { year: new Date().getFullYear() })}
            </p>
            <p className="text-xs text-gray-500 text-center max-w-2xl">
              {t('legalNotice')}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
