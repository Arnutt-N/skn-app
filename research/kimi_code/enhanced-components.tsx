/**
 * Enhanced Component Examples for SknApp
 * Premium, Luxurious UI Components with Animations
 * 
 * These components demonstrate the recommended design patterns.
 * Copy and adapt for your project.
 */

// ============================================
// LIBRARY UTILITIES
// ============================================

// lib/utils.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ============================================
// ENHANCED BUTTON COMPONENT
// ============================================

// components/ui/Button.tsx
'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  // Base styles - consistent across all variants
  [
    'inline-flex items-center justify-center whitespace-nowrap font-medium',
    'transition-all duration-200 ease-out',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
    'active:scale-[0.97]',
  ],
  {
    variants: {
      variant: {
        // Primary: Gradient with shine effect on hover
        primary: [
          'bg-gradient-to-br from-[hsl(252,82%,67%)] to-[hsl(252,60%,56%)]',
          'text-white shadow-[0_4px_6px_-1px_rgba(0,0,0,0.04)]',
          'hover:shadow-[0_10px_15px_-3px_rgba(115,103,240,0.25)]',
          'hover:-translate-y-0.5',
          'focus-visible:ring-[hsl(252,82%,67%)]/50',
          'relative overflow-hidden',
        ],
        // Secondary: Subtle gray
        secondary: [
          'bg-[hsl(240,15%,97%)] text-[hsl(240,15%,20%)]',
          'border border-[hsl(240,10%,88%)]',
          'hover:bg-[hsl(240,12%,94%)] hover:border-[hsl(240,10%,72%)]',
          'focus-visible:ring-[hsl(240,10%,72%)]',
        ],
        // Ghost: Transparent with hover background
        ghost: [
          'bg-transparent text-[hsl(252,82%,67%)]',
          'hover:bg-[hsl(252,82%,67%)]/8',
          'focus-visible:ring-[hsl(252,82%,67%)]/30',
        ],
        // Outline: Bordered with hover fill
        outline: [
          'bg-transparent border-2 border-[hsl(240,10%,88%)]',
          'text-[hsl(240,10%,40%)]',
          'hover:border-[hsl(252,82%,67%)] hover:text-[hsl(252,82%,67%)]',
          'hover:bg-[hsl(252,82%,67%)]/5',
          'focus-visible:ring-[hsl(252,82%,67%)]/30',
        ],
        // Soft: Light background with text color
        soft: [
          'bg-[hsl(252,82%,67%)]/10 text-[hsl(252,82%,67%)]',
          'hover:bg-[hsl(252,82%,67%)]/15',
          'focus-visible:ring-[hsl(252,82%,67%)]/30',
        ],
        // Danger: Red gradient for destructive actions
        danger: [
          'bg-gradient-to-br from-[hsl(0,84%,60%)] to-[hsl(0,70%,52%)]',
          'text-white shadow-[0_4px_6px_-1px_rgba(0,0,0,0.04)]',
          'hover:shadow-[0_10px_15px_-3px_rgba(234,84,85,0.25)]',
          'hover:-translate-y-0.5',
          'focus-visible:ring-[hsl(0,84%,60%)]/50',
        ],
      },
      size: {
        xs: 'text-xs px-3 py-1.5 h-7 gap-1.5 rounded-lg',
        sm: 'text-sm px-4 py-2 h-9 gap-2 rounded-lg',
        md: 'text-sm px-5 py-2.5 h-10 gap-2 rounded-xl',
        lg: 'text-base px-6 py-3 h-12 gap-2.5 rounded-xl',
        xl: 'text-base px-8 py-4 h-14 gap-3 rounded-xl',
        icon: 'h-10 w-10 p-2 rounded-xl',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  shine?: boolean;  // Premium shine animation on hover
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      shine = false,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {/* Shine Effect - Premium touch */}
        {shine && variant === 'primary' && (
          <span className="absolute inset-0 overflow-hidden rounded-inherit pointer-events-none">
            <span 
              className="absolute inset-0 -translate-x-full opacity-0 group-hover:animate-shine"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
              }}
            />
          </span>
        )}
        
        {/* Button Content */}
        <span className="relative flex items-center gap-2">
          {isLoading && (
            <Loader2 className="h-4 w-4 animate-spin" />
          )}
          {!isLoading && leftIcon}
          <span>{children}</span>
          {!isLoading && rightIcon}
        </span>
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };

// ============================================
// ENHANCED CARD COMPONENT
// ============================================

// components/ui/Card.tsx
'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const cardVariants = cva(
  [
    'rounded-2xl overflow-hidden transition-all duration-250 ease-out',
  ],
  {
    variants: {
      variant: {
        default: [
          'bg-white border border-[hsl(240,10%,94%)]',
          'shadow-[0_4px_6px_-1px_rgba(0,0,0,0.04)]',
        ],
        glass: [
          'bg-white/70 backdrop-blur-xl',
          'border border-white/50',
          'shadow-[0_4px_6px_-1px_rgba(0,0,0,0.04)]',
        ],
        elevated: [
          'bg-white border border-[hsl(240,10%,94%)]',
          'shadow-[0_10px_15px_-3px_rgba(0,0,0,0.06)]',
        ],
        outlined: [
          'bg-transparent border-2 border-[hsl(240,10%,88%)]',
        ],
      },
      hover: {
        none: '',
        lift: [
          'hover:-translate-y-0.5',
          'hover:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.06)]',
          'hover:border-[hsl(240,10%,88%)]',
        ],
        glow: [
          'hover:shadow-[0_0_20px_rgba(115,103,240,0.15)]',
          'hover:border-[hsl(252,82%,67%)]/30',
        ],
        border: [
          'hover:border-[hsl(252,82%,67%)]/50',
        ],
      },
      padding: {
        none: '',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
        xl: 'p-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      hover: 'lift',
      padding: 'md',
    },
  }
);

interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, hover, padding, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(cardVariants({ variant, hover, padding }), className)}
        {...props}
      />
    );
  }
);
Card.displayName = 'Card';

// Card Sub-components
const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col space-y-1.5 pb-5', className)}
      {...props}
    />
  )
);
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn(
        'text-lg font-semibold text-[hsl(240,20%,12%)] tracking-tight',
        className
      )}
      {...props}
    />
  )
);
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-sm text-[hsl(240,8%,45%)]', className)}
      {...props}
    />
  )
);
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('', className)} {...props} />
  )
);
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center pt-5 mt-5 border-t border-[hsl(240,10%,94%)]', className)}
      {...props}
    />
  )
);
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };

// ============================================
// ENHANCED INPUT COMPONENT
// ============================================

// components/ui/Input.tsx
'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const inputVariants = cva(
  [
    'w-full rounded-xl border bg-white',
    'px-4 py-2.5 text-sm text-[hsl(240,20%,12%)]',
    'placeholder:text-[hsl(240,6%,56%)]',
    'transition-all duration-200 ease-out',
    'focus:outline-none focus:ring-2',
    'hover:border-[hsl(240,10%,72%)]',
    'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[hsl(240,15%,97%)]',
  ],
  {
    variants: {
      variant: {
        outline: [
          'border-[hsl(240,10%,88%)]',
          'focus:border-[hsl(252,82%,67%)] focus:ring-[hsl(252,82%,67%)]/20',
        ],
        filled: [
          'border-transparent bg-[hsl(240,15%,97%)]',
          'focus:bg-white focus:border-[hsl(252,82%,67%)] focus:ring-[hsl(252,82%,67%)]/20',
        ],
        flushed: [
          'rounded-none border-0 border-b-2 border-[hsl(240,10%,88%)] px-0',
          'focus:border-[hsl(252,82%,67%)] focus:ring-0',
        ],
      },
      size: {
        sm: 'h-9 px-3 text-xs',
        md: 'h-10',
        lg: 'h-12 px-5 text-base',
      },
      state: {
        default: '',
        error: [
          'border-[hsl(0,84%,60%)] focus:border-[hsl(0,84%,60%)] focus:ring-[hsl(0,84%,60%)]/20',
          'animate-shake',
        ],
        success: [
          'border-[hsl(152,69%,47%)] focus:border-[hsl(152,69%,47%)] focus:ring-[hsl(152,69%,47%)]/20',
        ],
      },
    },
    defaultVariants: {
      variant: 'outline',
      size: 'md',
      state: 'default',
    },
  }
);

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  errorMessage?: string;
  helperText?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      variant,
      size,
      state,
      leftIcon,
      rightIcon,
      errorMessage,
      helperText,
      ...props
    },
    ref
  ) => {
    return (
      <div className="w-full">
        <div className="relative">
          {leftIcon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(240,6%,56%)] transition-colors duration-200 peer-focus:text-[hsl(252,82%,67%)]">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            className={cn(
              inputVariants({ variant, size, state }),
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(240,6%,56%)]">
              {rightIcon}
            </span>
          )}
        </div>
        {(errorMessage || helperText) && (
          <p
            className={cn(
              'mt-1.5 text-xs',
              errorMessage ? 'text-[hsl(0,84%,60%)]' : 'text-[hsl(240,6%,56%)]'
            )}
          >
            {errorMessage || helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };

// ============================================
// ENHANCED BADGE COMPONENT
// ============================================

// components/ui/Badge.tsx
'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const badgeVariants = cva(
  [
    'inline-flex items-center justify-center',
    'px-2.5 py-0.5 rounded-full',
    'text-[11px] font-semibold uppercase tracking-wider',
    'transition-all duration-200',
  ],
  {
    variants: {
      variant: {
        primary: 'bg-[hsl(252,82%,67%)]/12 text-[hsl(252,82%,67%)]',
        secondary: 'bg-[hsl(240,15%,97%)] text-[hsl(240,10%,40%)]',
        success: 'bg-[hsl(152,69%,47%)]/12 text-[hsl(152,69%,47%)]',
        warning: 'bg-[hsl(32,100%,58%)]/12 text-[hsl(32,100%,58%)]',
        danger: 'bg-[hsl(0,84%,60%)]/12 text-[hsl(0,84%,60%)]',
        info: 'bg-[hsl(195,100%,45%)]/12 text-[hsl(195,100%,45%)]',
        gray: 'bg-[hsl(240,12%,94%)] text-[hsl(240,8%,56%)]',
      },
      style: {
        filled: '',
        outline: 'bg-transparent border',
        soft: '',
      },
      size: {
        sm: 'px-2 py-0.5 text-[10px]',
        md: '',
        lg: 'px-3 py-1 text-xs',
      },
    },
    compoundVariants: [
      {
        variant: 'primary',
        style: 'outline',
        class: 'border-[hsl(252,82%,67%)]/40 text-[hsl(252,82%,67%)]',
      },
      {
        variant: 'success',
        style: 'outline',
        class: 'border-[hsl(152,69%,47%)]/40 text-[hsl(152,69%,47%)]',
      },
      {
        variant: 'danger',
        style: 'outline',
        class: 'border-[hsl(0,84%,60%)]/40 text-[hsl(0,84%,60%)]',
      },
    ],
    defaultVariants: {
      variant: 'primary',
      style: 'filled',
      size: 'md',
    },
  }
);

interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, style, size, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(badgeVariants({ variant, style, size }), className)}
        {...props}
      />
    );
  }
);

Badge.displayName = 'Badge';

export { Badge };

// ============================================
// ENHANCED MODAL COMPONENT
// ============================================

// components/ui/Modal.tsx
'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const modalContentVariants = cva(
  [
    'relative bg-white rounded-2xl w-full',
    'shadow-[0_25px_50px_-12px_rgba(0,0,0,0.12)]',
    'flex flex-col max-h-[90vh]',
    'animate-scale-in',
  ],
  {
    variants: {
      size: {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        '2xl': 'max-w-2xl',
        full: 'max-w-full mx-4',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

interface ModalProps
  extends VariantProps<typeof modalContentVariants> {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  showCloseButton?: boolean;
  closeOnBackdropClick?: boolean;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnBackdropClick = true,
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Add padding to prevent layout shift
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    } else {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
    }
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (typeof document === 'undefined' || !isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[hsl(240,20%,12%)]/40 backdrop-blur-sm transition-opacity"
        onClick={closeOnBackdropClick ? onClose : undefined}
      />

      {/* Modal Content */}
      <div className={cn(modalContentVariants({ size }))}>
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-[hsl(240,10%,94%)]">
            {title ? (
              <div>
                <h3 className="text-lg font-semibold text-[hsl(240,20%,12%)] tracking-tight">
                  {title}
                </h3>
                {description && (
                  <p className="text-sm text-[hsl(240,8%,45%)] mt-0.5">{description}</p>
                )}
              </div>
            ) : (
              <div />
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl hover:bg-[hsl(240,15%,97%)] text-[hsl(240,8%,56%)] hover:text-[hsl(240,15%,20%)] transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar">{children}</div>
      </div>
    </div>,
    document.body
  );
};

export { Modal };

// ============================================
// PREMIUM STATS CARD COMPONENT
// ============================================

// components/admin/StatsCard.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'purple';
  link?: string;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const colorMap = {
  primary: {
    bg: 'bg-[hsl(252,82%,67%)]/10',
    iconBg: 'bg-gradient-to-br from-[hsl(252,82%,67%)]/20 to-[hsl(252,82%,67%)]/10',
    text: 'text-[hsl(252,82%,67%)]',
    glow: 'shadow-[0_0_20px_rgba(115,103,240,0.15)]',
  },
  success: {
    bg: 'bg-[hsl(152,69%,47%)]/10',
    iconBg: 'bg-gradient-to-br from-[hsl(152,69%,47%)]/20 to-[hsl(152,69%,47%)]/10',
    text: 'text-[hsl(152,69%,47%)]',
    glow: 'shadow-[0_0_20px_rgba(40,199,111,0.15)]',
  },
  warning: {
    bg: 'bg-[hsl(32,100%,58%)]/10',
    iconBg: 'bg-gradient-to-br from-[hsl(32,100%,58%)]/20 to-[hsl(32,100%,58%)]/10',
    text: 'text-[hsl(32,100%,58%)]',
    glow: 'shadow-[0_0_20px_rgba(255,159,67,0.15)]',
  },
  danger: {
    bg: 'bg-[hsl(0,84%,60%)]/10',
    iconBg: 'bg-gradient-to-br from-[hsl(0,84%,60%)]/20 to-[hsl(0,84%,60%)]/10',
    text: 'text-[hsl(0,84%,60%)]',
    glow: 'shadow-[0_0_20px_rgba(234,84,85,0.15)]',
  },
  info: {
    bg: 'bg-[hsl(195,100%,45%)]/10',
    iconBg: 'bg-gradient-to-br from-[hsl(195,100%,45%)]/20 to-[hsl(195,100%,45%)]/10',
    text: 'text-[hsl(195,100%,45%)]',
    glow: 'shadow-[0_0_20px_rgba(0,207,232,0.15)]',
  },
  purple: {
    bg: 'bg-purple-500/10',
    iconBg: 'bg-gradient-to-br from-purple-500/20 to-purple-500/10',
    text: 'text-purple-500',
    glow: 'shadow-[0_0_20px_rgba(168,85,247,0.15)]',
  },
};

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon,
  color,
  link,
  description,
  trend,
}) => {
  const colors = colorMap[color];

  const Content = (
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-4">
        <div
          className={cn(
            'w-12 h-12 rounded-2xl flex items-center justify-center',
            colors.iconBg,
            colors.text,
            'transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg'
          )}
        >
          {icon}
        </div>
        <div>
          <p className="text-[hsl(240,6%,56%)] text-[11px] font-semibold uppercase tracking-wider">
            {title}
          </p>
          <p className="text-2xl font-bold text-[hsl(240,20%,12%)] mt-0.5 tracking-tight">
            {value}
          </p>
          {description && (
            <p className="text-[hsl(240,8%,45%)] text-xs mt-0.5">{description}</p>
          )}
          {trend && (
            <div className="flex items-center gap-1 mt-1">
              {trend.isPositive ? (
                <ArrowUpRight className="w-3.5 h-3.5 text-[hsl(152,69%,47%)]" />
              ) : (
                <ArrowDownRight className="w-3.5 h-3.5 text-[hsl(0,84%,60%)]" />
              )}
              <span
                className={cn(
                  'text-xs font-medium',
                  trend.isPositive ? 'text-[hsl(152,69%,47%)]' : 'text-[hsl(0,84%,60%)]'
                )}
              >
                {trend.value}%
              </span>
              <span className="text-[hsl(240,6%,56%)] text-xs">vs last month</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const containerClasses = cn(
    'bg-white rounded-2xl p-5',
    'border border-[hsl(240,10%,94%)]',
    'shadow-[0_4px_6px_-1px_rgba(0,0,0,0.04)]',
    'transition-all duration-300 ease-out',
    'group cursor-pointer',
    'hover:-translate-y-0.5 hover:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.06)]',
    'hover:border-[hsl(240,10%,88%)]',
    'block h-full'
  );

  if (link) {
    return (
      <Link href={link} className={containerClasses}>
        {Content}
      </Link>
    );
  }

  return <div className={containerClasses}>{Content}</div>;
};

export default StatsCard;

// ============================================
// SKELETON LOADING COMPONENT
// ============================================

// components/ui/Skeleton.tsx
'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  animate?: boolean;
}

const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = 'text',
  width,
  height,
  animate = true,
  style,
  ...props
}) => {
  const variantStyles = {
    text: 'rounded-md',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
    rounded: 'rounded-xl',
  };

  return (
    <div
      className={cn(
        'bg-[hsl(240,12%,94%)]',
        variantStyles[variant],
        animate && 'animate-shimmer',
        className
      )}
      style={{
        width: width,
        height: height,
        ...style,
      }}
      {...props}
    />
  );
};

// Pre-built skeleton patterns
const SkeletonCard: React.FC<{ lines?: number }> = ({ lines = 3 }) => (
  <div className="bg-white rounded-2xl p-6 border border-[hsl(240,10%,94%)]">
    <div className="flex items-center gap-4 mb-4">
      <Skeleton variant="circular" width={48} height={48} />
      <div className="flex-1">
        <Skeleton width="60%" height={16} className="mb-2" />
        <Skeleton width="40%" height={12} />
      </div>
    </div>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton key={i} width={i === lines - 1 ? '80%' : '100%'} height={12} className="mb-2" />
    ))}
  </div>
);

const SkeletonStats: React.FC = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
    {Array.from({ length: 4 }).map((_, i) => (
      <div
        key={i}
        className="bg-white rounded-2xl p-5 border border-[hsl(240,10%,94%)]"
      >
        <div className="flex items-center gap-4">
          <Skeleton variant="rounded" width={48} height={48} />
          <div className="flex-1">
            <Skeleton width={80} height={12} className="mb-2" />
            <Skeleton width={60} height={28} />
          </div>
        </div>
      </div>
    ))}
  </div>
);

export { Skeleton, SkeletonCard, SkeletonStats };
