'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';

interface FaqSection {
  category: string;
  questions: { q: string; a: string }[];
}

export default function FaqSearch({ faqs }: { faqs: FaqSection[] }) {
  const [query, setQuery] = useState('');

  const filtered = query.trim()
    ? faqs
        .map((section) => ({
          ...section,
          questions: section.questions.filter(
            (faq) =>
              faq.q.toLowerCase().includes(query.toLowerCase()) ||
              faq.a.toLowerCase().includes(query.toLowerCase())
          ),
        }))
        .filter((section) => section.questions.length > 0)
    : faqs;

  return (
    <>
      <div className="relative mb-10">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search questions..."
          className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3474BA] bg-white dark:bg-slate-800 dark:text-gray-100"
        />
      </div>

      {filtered.length > 0 ? (
        <div className="space-y-10">
          {filtered.map((section) => (
            <div key={section.category}>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 pb-2 border-b border-gray-200 dark:border-slate-700">
                {section.category}
              </h2>
              <div className="space-y-6">
                {section.questions.map((faq) => (
                  <div key={faq.q}>
                    <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">{faq.q}</h3>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{faq.a}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400 mb-4">No questions match your search.</p>
          <button
            onClick={() => setQuery('')}
            className="text-sm text-[#3474BA] dark:text-blue-300 underline hover:no-underline"
          >
            Clear search
          </button>
        </div>
      )}
    </>
  );
}
