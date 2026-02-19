'use client';

import React from 'react';
import { Check, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'checked' | 'onChange'> {
  checked?: boolean | 'indeterminate';
  onCheckedChange?: (checked: boolean | 'indeterminate') => void;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, onCheckedChange, ...props }, ref) => {
    return (
      <label
        className={cn(
          'relative flex items-center justify-center w-5 h-5 rounded-md border-2 transition-all duration-200 cursor-pointer',
          checked
            ? 'bg-brand-500 border-brand-500'
            : 'bg-white border-gray-300 hover:border-gray-400',
          'focus-within:ring-2 focus-within:ring-brand-500/50 focus-within:ring-offset-2',
          className
        )}
      >
        <input
          ref={ref}
          type="checkbox"
          className="peer sr-only"
          checked={checked === true}
          onChange={(e) => onCheckedChange?.(e.target.checked)}
          {...props}
        />
        {checked === true && (
          <Check className="w-3.5 h-3.5 text-white animate-scale-in" strokeWidth={3} />
        )}
        {checked === 'indeterminate' && (
          <Minus className="w-3.5 h-3.5 text-white animate-scale-in" strokeWidth={3} />
        )}
      </label>
    );
  }
);
Checkbox.displayName = 'Checkbox';

export { Checkbox };
