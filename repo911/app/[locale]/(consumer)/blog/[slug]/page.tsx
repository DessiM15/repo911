import { notFound } from 'next/navigation';
import { ArrowLeft, Calendar, Clock, User } from 'lucide-react';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { getAllSlugs, getPostBySlug } from '@/lib/blog';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};

  return {
    title: post.title,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      publishedTime: post.date,
      authors: [post.author],
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();
  const t = await getTranslations('blog');

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    author: { '@type': 'Organization', name: post.author },
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Link
        href="/blog"
        className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-[#3474BA] dark:hover:text-blue-300 mb-8"
      >
        <ArrowLeft className="h-4 w-4" />
        {t('backToBlog')}
      </Link>

      <article>
        <header className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 leading-tight">
            {post.title}
          </h1>
          <p className="mt-3 text-lg text-gray-600 dark:text-gray-400">{post.description}</p>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-gray-400 dark:text-gray-500">
            <span className="flex items-center gap-1">
              <User className="h-4 w-4" />
              {post.author}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {new Date(post.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {t('minRead', { minutes: post.readingTime })}
            </span>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-950 text-[#3474BA] dark:text-blue-300"
              >
                {tag}
              </span>
            ))}
          </div>
        </header>

        <div className="prose prose-gray dark:prose-invert max-w-none prose-headings:text-gray-900 dark:prose-headings:text-gray-100 prose-a:text-[#3474BA] dark:prose-a:text-blue-300 prose-strong:text-gray-900 dark:prose-strong:text-gray-100">
          <MDXRemote source={post.content} />
        </div>
      </article>

      {/* CTA */}
      <div className="mt-12 bg-[#3474BA] rounded-xl p-8 text-center text-white">
        <h2 className="text-2xl font-bold mb-2">
          {t('ctaTitle')}
        </h2>
        <p className="text-white/80 mb-6">
          {t('ctaDescription')}
        </p>
        <Link
          href="/claim"
          className="inline-block px-8 py-3 bg-white text-[#3474BA] font-semibold rounded-lg hover:bg-gray-100 dark:hover:bg-gray-200 transition-colors"
        >
          {t('ctaButton')}
        </Link>
      </div>
    </div>
  );
}
