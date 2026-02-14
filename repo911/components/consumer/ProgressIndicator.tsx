'use client';

import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

const SECTIONS = [
  'Contact Info',
  'Vehicle',
  'Lender',
  'Repo Details',
  'Breach of Peace',
  'Belongings',
  'Post-Repo',
  'Military',
  'Debt Collection',
  'Evidence',
  'Consent',
];

interface ProgressIndicatorProps {
  currentSection: number;
  completedSections: number[];
  onSectionClick?: (index: number) => void;
}

export function ProgressIndicator({ currentSection, completedSections, onSectionClick }: ProgressIndicatorProps) {
  const progress = Math.round(((currentSection) / SECTIONS.length) * 100);

  return (
    <div className="mb-8">
      {/* Progress bar */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">
          Step {currentSection + 1} of {SECTIONS.length}: {SECTIONS[currentSection]}
        </span>
        <span className="text-sm font-medium text-[#4A90D9]">{progress}% complete</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Form progress"
          className="bg-[#4A90D9] h-2.5 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Section dots (desktop) */}
      <div className="hidden sm:flex items-center justify-between mt-4">
        {SECTIONS.map((name, index) => {
          const isCompleted = completedSections.includes(index);
          const isCurrent = index === currentSection;
          const isClickable = isCompleted && onSectionClick;
          return (
            <button
              key={name}
              type="button"
              disabled={!isClickable}
              onClick={() => isClickable && onSectionClick(index)}
              className={cn(
                'flex flex-col items-center gap-1',
                isClickable ? 'cursor-pointer' : 'cursor-default'
              )}
            >
              <div
                className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-colors',
                  isCompleted
                    ? 'bg-[#4A90D9] text-white'
                    : isCurrent
                    ? 'bg-[#4A90D9]/20 text-[#4A90D9] ring-2 ring-[#4A90D9]'
                    : 'bg-gray-100 text-gray-400'
                )}
              >
                {isCompleted ? <Check className="h-4 w-4" /> : index + 1}
              </div>
              <span
                className={cn(
                  'text-[10px] max-w-[60px] text-center leading-tight',
                  isCurrent ? 'text-[#4A90D9] font-medium' : isCompleted ? 'text-gray-600' : 'text-gray-400'
                )}
              >
                {name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
