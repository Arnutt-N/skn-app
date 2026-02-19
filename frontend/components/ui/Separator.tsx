'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical';
  decorative?: boolean;
  label?: string;
}

const Separator = React.forwardRef<HTMLDivElement, SeparatorProps>(
  ({ className, orientation = 'horizontal', decorative = true, label, ...props }, ref) => {
    if (label) {
      return (
        <div
          ref={ref}
          className={cn(
            'flex items-center gap-4',
            orientation === 'vertical' && 'flex-col',
            className
          )}
          {...props}
        >
          <div
            className={cn(
              'bg-gray-200',
              orientation === 'horizontal' ? 'h-px flex-1' : 'w-px flex-1'
            )}
          />
          <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">
            {label}
          </span>
          <div
            className={cn(
              'bg-gray-200',
              orientation === 'horizontal' ? 'h-px flex-1' : 'w-px flex-1'
            )}
          />
        </div>
      );
    }

    return (
      <div
        ref={ref}
        role={decorative ? 'none' : 'separator'}
        aria-orientation={decorative ? undefined : orientation}
        className={cn(
          'bg-gray-200 shrink-0',
          orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
          className
        )}
        {...props}
      />
    );
  }
);
Separator.displayName = 'Separator';

export { Separator };
