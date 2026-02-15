import { type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'hot' | 'warm' | 'cold' | 'disqualified' | 'success' | 'warning' | 'danger' | 'info';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border',
        {
          'bg-gray-50 dark:bg-slate-900 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-slate-700': variant === 'default',
          'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800': variant === 'hot' || variant === 'danger',
          'bg-yellow-50 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800': variant === 'warm',
          'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800': variant === 'cold',
          'bg-gray-50 dark:bg-slate-900 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-slate-700': variant === 'disqualified',
          'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800': variant === 'success',
          'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800': variant === 'warning',
          'bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800': variant === 'info',
        },
        className
      )}
      {...props}
    />
  );
}
