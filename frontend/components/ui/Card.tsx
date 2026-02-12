'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const cardVariants = cva(
  [
    'relative overflow-hidden',
    'transition-all duration-300 ease-out',
  ],
  {
    variants: {
      variant: {
        default: [
          'bg-white border border-gray-100',
          'shadow-md shadow-gray-200/50',
        ],
        elevated: [
          'bg-white border border-gray-100',
          'shadow-lg shadow-gray-200/60',
        ],
        glass: [
          'bg-white/70 backdrop-blur-xl backdrop-saturate-150',
          'border border-white/50',
          'shadow-lg shadow-gray-200/50',
        ],
        outlined: [
          'bg-transparent border-2 border-gray-200',
        ],
        filled: [
          'bg-gray-50 border border-gray-100',
        ],
        gradient: [
          'bg-gradient-to-br from-white to-gray-50',
          'border border-gray-100 shadow-md',
        ],
      },
      radius: {
        none: 'rounded-none',
        sm: 'rounded-lg',
        md: 'rounded-xl',
        lg: 'rounded-2xl',
        xl: 'rounded-3xl',
      },
      hover: {
        none: '',
        lift: [
          'hover:-translate-y-1 hover:shadow-lg',
          'cursor-pointer',
        ],
        glow: [
          'hover:shadow-glow hover:border-brand-200',
          'cursor-pointer',
        ],
        border: [
          'hover:border-brand-300',
          'cursor-pointer',
        ],
        scale: [
          'hover:scale-[1.02] hover:shadow-lg',
          'cursor-pointer',
        ],
      },
      padding: {
        none: '',
        xs: 'p-3',
        sm: 'p-4',
        md: 'p-5',
        lg: 'p-6',
        xl: 'p-8',
        '2xl': 'p-10',
      },
    },
    compoundVariants: [
      {
        variant: 'elevated',
        hover: 'lift',
        class: 'hover:shadow-xl',
      },
      {
        variant: 'glass',
        hover: 'lift',
        class: 'hover:bg-white/80',
      },
    ],
    defaultVariants: {
      variant: 'default',
      radius: 'lg',
      hover: 'lift',
      padding: 'md',
    },
  }
);

interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  glass?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, radius, hover, padding, glass, ...props }, ref) => {
    const resolvedVariant = glass ? 'glass' : variant;
    return (
      <div
        ref={ref}
        className={cn(cardVariants({ variant: resolvedVariant, radius, hover, padding }), className)}
        {...props}
      />
    );
  }
);
Card.displayName = 'Card';

// Card Header
const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { divider?: boolean }
>(({ className, divider = false, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex flex-col space-y-1.5',
      divider && 'pb-5 border-b border-gray-100',
      className
    )}
    {...props}
  />
));
CardHeader.displayName = 'CardHeader';

// Card Title
const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement> & { gradient?: boolean }
>(({ className, gradient = false, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      'text-lg font-semibold tracking-tight',
      gradient ? 'text-gradient' : 'text-gray-900',
      className
    )}
    {...props}
  />
));
CardTitle.displayName = 'CardTitle';

// Card Description
const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-gray-500', className)}
    {...props}
  />
));
CardDescription.displayName = 'CardDescription';

// Card Content
const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('', className)} {...props} />
));
CardContent.displayName = 'CardContent';

// Card Footer
const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { 
    divider?: boolean;
    align?: 'start' | 'center' | 'end' | 'between';
  }
>(({ className, divider = false, align = 'between', ...props }, ref) => {
  const alignClasses = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
  };
  
  return (
    <div
      ref={ref}
      className={cn(
        'flex items-center gap-3',
        alignClasses[align],
        divider && 'pt-5 border-t border-gray-100 mt-5',
        className
      )}
      {...props}
    />
  );
});
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
export default Card;
