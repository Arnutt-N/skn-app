'use client';

import { cn } from '@/lib/utils';

interface LandingBrandMarkProps {
  tone?: 'light' | 'dark';
  compact?: boolean;
  className?: string;
}

export function LandingBrandMark({
  tone = 'light',
  compact = false,
  className,
}: LandingBrandMarkProps) {
  const dark = tone === 'dark';

  return (
    <div className={cn('flex min-w-0 items-center gap-3', className)}>
      <div
        className={cn(
          'relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-2xl border text-[0.62rem] font-semibold tracking-[0.24em]',
          dark
            ? 'border-white/12 bg-[linear-gradient(145deg,hsl(217_42%_26%),hsl(222_47%_11%))] text-white shadow-[0_18px_40px_hsl(224_71%_4%_/_0.42)]'
            : 'border-slate-200/80 bg-[linear-gradient(145deg,hsl(219_42%_20%),hsl(211_57%_31%))] text-white shadow-[0_18px_42px_hsl(218_40%_12%_/_0.16)]'
        )}
      >
        <span>JSK</span>
        <span className="absolute inset-x-2 bottom-1 h-px rounded-full bg-[linear-gradient(90deg,transparent,hsl(141_73%_58%_/_0.95),transparent)]" />
      </div>

      <div className="min-w-0">
        <p
          className={cn(
            'truncate text-[0.62rem] font-semibold uppercase tracking-[0.28em]',
            dark ? 'text-white/50' : 'text-slate-500'
          )}
        >
          Community Justice
        </p>
        <p
          className={cn(
            'thai-no-break truncate text-sm font-semibold tracking-tight',
            dark ? 'text-white' : 'text-slate-950'
          )}
        >
          JSK Platform
        </p>
        {!compact && (
          <p
            className={cn(
              'thai-no-break truncate text-xs',
              dark ? 'text-white/60' : 'text-slate-500'
            )}
          >
            Public Service Operations
          </p>
        )}
      </div>
    </div>
  );
}
