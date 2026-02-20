import type { MetadataRoute } from 'next';
import { getAllSlugs } from '@/lib/blog';
import { routing } from '@/i18n/routing';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://repo911.com';

function localizedUrl(locale: string, path: string): string {
  if (locale === routing.defaultLocale) return `${siteUrl}${path}`;
  return `${siteUrl}/${locale}${path}`;
}

function hreflangAlternates(path: string): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const locale of routing.locales) {
    languages[locale] = localizedUrl(locale, path);
  }
  return languages;
}

type Frequency = 'weekly' | 'monthly' | 'yearly';

function localizedEntries(
  path: string,
  changeFrequency: Frequency,
  priority: number,
): MetadataRoute.Sitemap {
  return routing.locales.map((locale) => ({
    url: localizedUrl(locale, path),
    lastModified: new Date(),
    changeFrequency,
    priority,
    alternates: { languages: hreflangAlternates(path) },
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const slugs = getAllSlugs();

  return [
    ...localizedEntries('', 'weekly', 1.0),
    ...localizedEntries('/claim', 'weekly', 0.9),
    ...localizedEntries('/blog', 'weekly', 0.8),
    ...localizedEntries('/track', 'monthly', 0.7),
    ...localizedEntries('/faq', 'monthly', 0.7),
    ...localizedEntries('/how-it-works', 'monthly', 0.7),
    ...localizedEntries('/verify', 'monthly', 0.6),
    ...localizedEntries('/privacy', 'yearly', 0.5),
    ...localizedEntries('/terms', 'yearly', 0.5),
    ...localizedEntries('/disclaimer', 'yearly', 0.5),
    ...slugs.flatMap((slug) => localizedEntries(`/blog/${slug}`, 'monthly', 0.6)),
  ];
}
