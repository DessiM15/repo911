import type { MetadataRoute } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://repo911.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/*', '/attorney/*', '/api/*', '/auth/*'],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
