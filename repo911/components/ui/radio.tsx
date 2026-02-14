'use client';

import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface RadioOption {
  value: string;
  label: string;
  description?: string;
}

export interface RadioGroupProps {
  name: string;
  label?: string;
  error?: string;
  options: RadioOption[];
  value?: string;
  onChange?: (value: string) => void;
  required?: boolean;
  className?: string;
  disabled?: boolean;
}

export function RadioGroup({
  name,
  label,
  error,
  options,
  value,
  onChange,
  required,
  className,
  disabled,
}: RadioGroupProps) {
  return (
    <div className={cn('w-full', className)}>
      {label && (
        <p className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </p>
      )}
      <div className="space-y-2">
        {options.map((option) => (
          <RadioItem
            key={option.value}
            name={name}
            value={option.value}
            label={option.label}
            description={option.description}
            checked={value === option.value}
            onChange={() => onChange?.(option.value)}
            disabled={disabled}
          />
        ))}
      </div>
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
}

interface RadioItemProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  description?: string;
}

const RadioItem = forwardRef<HTMLInputElement, RadioItemProps>(
  ({ label, description, className, id, ...props }, ref) => {
    const inputId = id || `radio-${props.name}-${props.value}`;
    return (
      <div className="flex items-start gap-3">
        <input
          ref={ref}
          id={inputId}
          type="radio"
          className={cn(
            'mt-0.5 h-5 w-5 border-gray-300 text-[#3474BA]',
            'focus:ring-2 focus:ring-[#3474BA] focus:ring-offset-1',
            'disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer',
            className
          )}
          {...props}
        />
        <div>
          <label htmlFor={inputId} className="text-sm font-medium text-gray-700 cursor-pointer">
            {label}
          </label>
          {description && <p className="text-sm text-gray-500 mt-0.5">{description}</p>}
        </div>
      </div>
    );
  }
);
RadioItem.displayName = 'RadioItem';
