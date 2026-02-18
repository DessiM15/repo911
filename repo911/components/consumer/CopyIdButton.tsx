'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

export function CopyIdButton({
  text,
  variant = 'orange',
}: {
  text: string;
  variant?: 'orange' | 'gray';
}) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(text);
    toast.success('Copied!');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const Icon = copied ? Check : Copy;
  const hoverClass =
    variant === 'orange'
      ? 'hover:bg-[#F5A623]/20'
      : 'hover:bg-gray-100 dark:hover:bg-slate-700';

  return (
    <button
      onClick={handleCopy}
      title="Copy Case ID"
      className={`p-1.5 rounded-md ${hoverClass} transition-colors`}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
