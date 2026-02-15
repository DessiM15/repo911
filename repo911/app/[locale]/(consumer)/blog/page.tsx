import Link from 'next/link';
import { BookOpen, Calendar, Clock, ArrowRight } from 'lucide-react';
import { getAllPosts } from '@/lib/blog';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blog — Repossession Rights & Legal Guides',
  description:
    'Learn about your rights during vehicle repossession, breach of peace laws, FDCPA protections, and more from Repo911.',
};

export default function BlogListingPage() {
  const posts = getAllPosts();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <div className="text-center mb-12">
        <BookOpen className="h-12 w-12 mx-auto mb-4 text-[#3474BA]" />
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100">
          Repossession Rights Blog
        </h1>
        <p className="mt-3 text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
          Know your rights. Expert articles on vehicle repossession law,
          consumer protections, and what to do if your rights were violated.
        </p>
      </div>

      <div className="grid gap-6">
        {posts.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="group block bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow p-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 group-hover:text-[#3474BA] transition-colors">
                  {post.title}
                </h2>
                <p className="mt-2 text-gray-600 dark:text-gray-400 text-sm leading-relaxed line-clamp-2">
                  {post.description}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-gray-400 dark:text-gray-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {new Date(post.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {post.readingTime} min read
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-950 text-[#3474BA]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="hidden sm:flex items-center text-[#3474BA] opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowRight className="h-5 w-5" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
