'use client';

import { cn } from '@/lib/utils';
import type { Locale } from '@/lib/i18n/landing';

interface LandingLanguageToggleProps {
  locale: Locale;
  onToggle: () => void;
}

export function LandingLanguageToggle({ locale, onToggle }: LandingLanguageToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="relative flex items-center h-8 rounded-full border border-border-default bg-surface p-0.5 text-xs font-medium transition-colors hover:border-brand-500/40"
      aria-label={locale === 'th' ? 'Switch to English' : 'เปลี่ยนเป็นภาษาไทย'}
    >
      <span
        className={cn(
          'relative z-10 flex items-center justify-center w-9 h-7 rounded-full transition-colors duration-200',
          locale === 'th'
            ? 'bg-brand-500 text-white shadow-sm'
            : 'text-text-secondary hover:text-text-primary'
        )}
      >
        TH
      </span>
      <span
        className={cn(
          'relative z-10 flex items-center justify-center w-9 h-7 rounded-full transition-colors duration-200',
          locale === 'en'
            ? 'bg-brand-500 text-white shadow-sm'
            : 'text-text-secondary hover:text-text-primary'
        )}
      >
        EN
      </span>
    </button>
  );
}
