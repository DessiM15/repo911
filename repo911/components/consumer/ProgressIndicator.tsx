'use client';

import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface ProgressIndicatorProps {
  currentSection: number;
  completedSections: number[];
  onSectionClick?: (index: number) => void;
}

export function ProgressIndicator({ currentSection, completedSections, onSectionClick }: ProgressIndicatorProps) {
  const t = useTranslations('claim');

  const sections = [
    t('stepsShort.contactInfo'),
    t('stepsShort.vehicleInfo'),
    t('stepsShort.lenderInfo'),
    t('stepsShort.repoDetails'),
    t('stepsShort.breachOfPeace'),
    t('stepsShort.belongings'),
    t('stepsShort.postRepo'),
    t('stepsShort.military'),
    t('stepsShort.debtCollection'),
    t('stepsShort.evidence'),
    t('stepsShort.consent'),
  ];

  const progress = Math.round(((currentSection) / sections.length) * 100);

  return (
    <div className="mb-8">
      {/* Progress bar */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('progress.stepOf', { current: currentSection + 1, total: sections.length, name: sections[currentSection] })}
        </span>
        <span className="text-sm font-medium text-[#3474BA] dark:text-blue-300">{t('progress.complete', { percent: progress })}</span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2.5">
        <div
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Form progress"
          className="bg-[#3474BA] h-2.5 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Section dots (desktop) */}
      <div className="hidden sm:flex items-center justify-between mt-4">
        {sections.map((name, index) => {
          const isCompleted = completedSections.includes(index);
          const isCurrent = index === currentSection;
          const isClickable = isCompleted && onSectionClick;
          return (
            <button
              key={index}
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
                    ? 'bg-[#3474BA] text-white'
                    : isCurrent
                    ? 'bg-[#3474BA]/20 text-[#3474BA] dark:text-blue-300 ring-2 ring-[#3474BA]'
                    : 'bg-gray-100 dark:bg-slate-700 text-gray-400 dark:text-gray-500'
                )}
              >
                {isCompleted ? <Check className="h-4 w-4" /> : index + 1}
              </div>
              <span
                className={cn(
                  'text-[10px] max-w-[60px] text-center leading-tight',
                  isCurrent ? 'text-[#3474BA] dark:text-blue-300 font-medium' : isCompleted ? 'text-gray-600 dark:text-gray-400' : 'text-gray-400 dark:text-gray-500'
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
