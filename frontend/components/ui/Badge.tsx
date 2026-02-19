'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const badgeVariants = cva(
  [
    'inline-flex items-center justify-center',
    'rounded-full',
    'font-medium tracking-wide',
    'transition-colors duration-200',
  ],
  {
    variants: {
      variant: {
        primary:   'bg-brand-100 text-brand-700 dark:bg-brand-900/50 dark:text-brand-300',
        secondary: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
        success:   'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
        warning:   'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
        danger:    'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
        info:      'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
        gray:      'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
      },
      appearance: {
        filled: '',
        outline: 'bg-transparent border',
        soft: '',
      },
      size: {
        xs: 'px-1.5 py-0.5 text-[10px] gap-1',
        sm: 'px-2 py-0.5 text-[11px] gap-1',
        md: 'px-2.5 py-1 text-xs gap-1.5',
        lg: 'px-3 py-1 text-sm gap-1.5',
      },
    },
    compoundVariants: [
      {
        variant: 'primary',
        appearance: 'outline',
        class: 'border-brand-300 text-brand-600 bg-brand-50',
      },
      {
        variant: 'success',
        appearance: 'outline',
        class: 'border-green-300 text-green-600 bg-green-50',
      },
      {
        variant: 'warning',
        appearance: 'outline',
        class: 'border-amber-300 text-amber-600 bg-amber-50',
      },
      {
        variant: 'danger',
        appearance: 'outline',
        class: 'border-red-300 text-red-600 bg-red-50',
      },
      {
        variant: 'info',
        appearance: 'outline',
        class: 'border-blue-300 text-blue-600 bg-blue-50',
      },
      {
        variant: 'gray',
        appearance: 'outline',
        class: 'border-gray-300 text-gray-600 bg-gray-50',
      },
    ],
    defaultVariants: {
      variant: 'primary',
      appearance: 'filled',
      size: 'md',
    },
  }
);

interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    Omit<VariantProps<typeof badgeVariants>, 'variant'> {
  variant?: VariantProps<typeof badgeVariants>['variant'] | 'outline';
  outline?: boolean;
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, appearance, size, outline, ...props }, ref) => {
    const resolvedVariant = variant === 'outline' ? 'gray' : variant;
    const resolvedAppearance =
      (variant === 'outline' || outline) && !appearance ? 'outline' : appearance;
    return (
      <span
        ref={ref}
        className={cn(
          badgeVariants({ variant: resolvedVariant, appearance: resolvedAppearance, size }),
          className
        )}
        {...props}
      />
    );
  }
);

Badge.displayName = 'Badge';

export { Badge, badgeVariants };
export default Badge;
