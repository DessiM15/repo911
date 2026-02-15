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
          'bg-red-50 text-red-700 border-red-200': variant === 'hot' || variant === 'danger',
          'bg-yellow-50 text-yellow-700 border-yellow-200': variant === 'warm',
          'bg-blue-50 text-blue-700 border-blue-200': variant === 'cold',
          'bg-gray-50 dark:bg-slate-900 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-slate-700': variant === 'disqualified',
          'bg-green-50 text-green-700 border-green-200': variant === 'success',
          'bg-amber-50 text-amber-700 border-amber-200': variant === 'warning',
          'bg-sky-50 text-sky-700 border-sky-200': variant === 'info',
        },
        className
      )}
      {...props}
    />
  );
}
