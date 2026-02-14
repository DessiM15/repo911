import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  description?: string;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, error, description, id, ...props }, ref) => {
    return (
      <div className="flex items-start gap-3">
        <div className="relative flex items-center">
          <input
            ref={ref}
            id={id}
            type="checkbox"
            className={cn(
              'peer h-5 w-5 rounded border-gray-300 text-[#3474BA]',
              'focus:ring-2 focus:ring-[#3474BA] focus:ring-offset-1',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'cursor-pointer appearance-none border-2 bg-white checked:bg-[#3474BA] checked:border-[#3474BA]',
              'transition-colors',
              error && 'border-red-500',
              className
            )}
            {...props}
          />
          <Check className="absolute left-0.5 top-0.5 h-4 w-4 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" />
        </div>
        {(label || description) && (
          <div>
            {label && (
              <label htmlFor={id} className="text-sm font-medium text-gray-700 cursor-pointer">
                {label}
                {props.required && <span className="text-red-500 ml-1">*</span>}
              </label>
            )}
            {description && <p className="text-sm text-gray-500 mt-0.5">{description}</p>}
            {error && <p className="text-sm text-red-500 mt-0.5">{error}</p>}
          </div>
        )}
      </div>
    );
  }
);
Checkbox.displayName = 'Checkbox';

export { Checkbox };
