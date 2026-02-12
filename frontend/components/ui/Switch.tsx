'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, checked, onCheckedChange, ...props }, ref) => {
    return (
      <label
        className={cn(
          'relative inline-flex h-6 w-11 cursor-pointer items-center rounded-full transition-colors duration-200',
          checked ? 'bg-brand-500' : 'bg-gray-200',
          'focus-within:ring-2 focus-within:ring-brand-500/50 focus-within:ring-offset-2',
          className
        )}
      >
        <input
          ref={ref}
          type="checkbox"
          className="peer sr-only"
          checked={checked}
          onChange={(e) => onCheckedChange?.(e.target.checked)}
          {...props}
        />
        <span
          className={cn(
            'inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-all duration-200 ease-out',
            checked ? 'translate-x-6' : 'translate-x-1'
          )}
        />
      </label>
    );
  }
);
Switch.displayName = 'Switch';

export { Switch };
