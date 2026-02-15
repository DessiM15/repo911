import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'attorney' | 'consumer';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-800 disabled:opacity-50 disabled:cursor-not-allowed',
          {
            // Variants
            'bg-[#3474BA] text-white hover:bg-[#2D6AA8] focus:ring-[#3474BA]': variant === 'primary',
            'bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-slate-700 focus:ring-gray-400 dark:focus:ring-slate-500': variant === 'secondary',
            'border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 focus:ring-gray-400 dark:focus:ring-slate-500': variant === 'outline',
            'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 focus:ring-gray-400 dark:focus:ring-slate-500': variant === 'ghost',
            'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500': variant === 'danger',
            'bg-[#2ECC71] text-white hover:bg-[#27AE60] focus:ring-[#2ECC71]': variant === 'attorney',
            'bg-[#F5A623] text-gray-900 hover:bg-[#E09612] focus:ring-[#F5A623]': variant === 'consumer',
            // Sizes
            'text-sm px-3 py-1.5': size === 'sm',
            'text-sm px-4 py-2': size === 'md',
            'text-base px-6 py-3': size === 'lg',
          },
          className
        )}
        {...props}
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

export { Button };
