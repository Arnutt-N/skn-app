'use client';

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const textareaVariants = cva(
  [
    'w-full rounded-xl border bg-white',
    'text-sm text-gray-900',
    'placeholder:text-gray-400',
    'transition-all duration-200 ease-out',
    'focus:outline-none focus:ring-2',
    'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50',
    'resize-y',
  ],
  {
    variants: {
      variant: {
        outline: 'border-gray-200 focus:border-brand-500 focus:ring-brand-500/20',
        filled: 'border-transparent bg-gray-100 focus:bg-white focus:border-brand-500 focus:ring-brand-500/20',
      },
      size: {
        sm: 'min-h-[72px] px-3 py-2 text-xs',
        md: 'min-h-[96px] px-4 py-2.5 text-sm',
        lg: 'min-h-[120px] px-5 py-3 text-base',
      },
      state: {
        default: '',
        error: 'border-red-500 focus:border-red-500 focus:ring-red-500/20 animate-shake',
        success: 'border-green-500 focus:border-green-500 focus:ring-green-500/20',
      },
    },
    defaultVariants: {
      variant: 'outline',
      size: 'md',
      state: 'default',
    },
  }
);

export interface TextareaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'>,
    VariantProps<typeof textareaVariants> {
  errorMessage?: string;
  helperText?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, variant, size, state, errorMessage, helperText, ...props }, ref) => (
    <div className="w-full">
      <textarea
        ref={ref}
        className={cn(textareaVariants({ variant, size, state }), className)}
        {...props}
      />
      {(errorMessage || helperText) && (
        <p className={cn('mt-1.5 text-xs', errorMessage ? 'text-red-500' : 'text-gray-500')}>
          {errorMessage || helperText}
        </p>
      )}
    </div>
  )
);

Textarea.displayName = 'Textarea';

export { Textarea };
export default Textarea;

