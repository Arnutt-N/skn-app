/**
 * Pixel-Perfect Component Library
 * 10/10 Design Implementation
 * 
 * Every component is crafted with meticulous attention to detail
 */

// ============================================
// UTILITY FUNCTIONS
// ============================================

// lib/utils.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ============================================
// AVATAR COMPONENT
// ============================================

// components/ui/Avatar.tsx
'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const avatarVariants = cva(
  'relative inline-flex items-center justify-center overflow-hidden',
  {
    variants: {
      size: {
        xs: 'w-6 h-6 text-xs',
        sm: 'w-8 h-8 text-xs',
        md: 'w-10 h-10 text-sm',
        lg: 'w-12 h-12 text-base',
        xl: 'w-16 h-16 text-lg',
        '2xl': 'w-20 h-20 text-xl',
      },
      shape: {
        circle: 'rounded-full',
        square: 'rounded-xl',
      },
    },
    defaultVariants: {
      size: 'md',
      shape: 'circle',
    },
  }
);

interface AvatarProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof avatarVariants> {
  src?: string;
  alt?: string;
  fallback?: string;
  status?: 'online' | 'offline' | 'busy' | 'away';
}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, size, shape, src, alt, fallback, status, ...props }, ref) => {
    const [imageError, setImageError] = React.useState(false);
    
    return (
      <div ref={ref} className="relative inline-block">
        <div
          className={cn(avatarVariants({ size, shape }), className)}
          {...props}
        >
          {src && !imageError ? (
            <img
              src={src}
              alt={alt}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-medium">
              {fallback?.slice(0, 2).toUpperCase() || '?'}
            </div>
          )}
        </div>
        
        {/* Status Indicator */}
        {status && (
          <span
            className={cn(
              'absolute bottom-0 right-0 block rounded-full ring-2 ring-white',
              size === 'xs' && 'w-2 h-2',
              size === 'sm' && 'w-2.5 h-2.5',
              size === 'md' && 'w-3 h-3',
              size === 'lg' && 'w-3.5 h-3.5',
              size === 'xl' && 'w-4 h-4',
              size === '2xl' && 'w-5 h-5',
              status === 'online' && 'bg-green-500',
              status === 'offline' && 'bg-gray-400',
              status === 'busy' && 'bg-red-500',
              status === 'away' && 'bg-yellow-500'
            )}
          />
        )}
      </div>
    );
  }
);
Avatar.displayName = 'Avatar';

// Avatar Group
interface AvatarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  max?: number;
}

const AvatarGroup = React.forwardRef<HTMLDivElement, AvatarGroupProps>(
  ({ className, children, max, ...props }, ref) => {
    const childrenArray = React.Children.toArray(children);
    const showMax = max && childrenArray.length > max;
    const displayedChildren = showMax ? childrenArray.slice(0, max) : childrenArray;
    const remaining = childrenArray.length - (max || 0);
    
    return (
      <div ref={ref} className={cn('flex items-center -space-x-2', className)} {...props}>
        {displayedChildren}
        {showMax && (
          <div className="relative inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 text-gray-600 text-xs font-medium ring-2 ring-white">
            +{remaining}
          </div>
        )}
      </div>
    );
  }
);
AvatarGroup.displayName = 'AvatarGroup';

export { Avatar, AvatarGroup };

// ============================================
// TOOLTIP COMPONENT
// ============================================

// components/ui/Tooltip.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { createPortal } from 'react-dom';

interface TooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  align?: 'start' | 'center' | 'end';
  delay?: number;
}

export function Tooltip({ 
  children, 
  content, 
  side = 'top', 
  align = 'center',
  delay = 200 
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  const updatePosition = () => {
    if (!triggerRef.current || !tooltipRef.current) return;
    
    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    
    let top = 0;
    let left = 0;
    
    // Calculate position based on side
    switch (side) {
      case 'top':
        top = triggerRect.top - tooltipRect.height - 8;
        break;
      case 'bottom':
        top = triggerRect.bottom + 8;
        break;
      case 'left':
        left = triggerRect.left - tooltipRect.width - 8;
        break;
      case 'right':
        left = triggerRect.right + 8;
        break;
    }
    
    // Calculate alignment
    if (side === 'top' || side === 'bottom') {
      switch (align) {
        case 'start':
          left = triggerRect.left;
          break;
        case 'center':
          left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
          break;
        case 'end':
          left = triggerRect.right - tooltipRect.width;
          break;
      }
    } else {
      switch (align) {
        case 'start':
          top = triggerRect.top;
          break;
        case 'center':
          top = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
          break;
        case 'end':
          top = triggerRect.bottom - tooltipRect.height;
          break;
      }
    }
    
    setPosition({ top, left });
  };
  
  useEffect(() => {
    if (isVisible) {
      updatePosition();
      window.addEventListener('scroll', updatePosition);
      window.addEventListener('resize', updatePosition);
    }
    
    return () => {
      window.removeEventListener('scroll', updatePosition);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isVisible]);
  
  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };
  
  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };
  
  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="inline-flex"
      >
        {children}
      </div>
      
      {isVisible && typeof document !== 'undefined' && createPortal(
        <div
          ref={tooltipRef}
          className={cn(
            'fixed z-50 px-3 py-1.5',
            'bg-gray-900 text-white text-xs font-medium',
            'rounded-lg shadow-lg',
            'animate-fade-in-up',
            'pointer-events-none'
          )}
          style={{ top: position.top, left: position.left }}
        >
          {content}
          {/* Arrow */}
          <div
            className={cn(
              'absolute w-2 h-2 bg-gray-900 rotate-45',
              side === 'top' && 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2',
              side === 'bottom' && 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2',
              side === 'left' && 'right-0 top-1/2 translate-x-1/2 -translate-y-1/2',
              side === 'right' && 'left-0 top-1/2 -translate-x-1/2 -translate-y-1/2'
            )}
          />
        </div>,
        document.body
      )}
    </>
  );
}

// ============================================
// SEPARATOR COMPONENT
// ============================================

// components/ui/Separator.tsx
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
          <div className={cn(
            'bg-gray-200',
            orientation === 'horizontal' ? 'h-px flex-1' : 'w-px flex-1'
          )} />
          <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">
            {label}
          </span>
          <div className={cn(
            'bg-gray-200',
            orientation === 'horizontal' ? 'h-px flex-1' : 'w-px flex-1'
          )} />
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

// ============================================
// SWITCH COMPONENT
// ============================================

// components/ui/Switch.tsx
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
          'relative inline-flex h-6 w-11 cursor-pointer items-center',
          'rounded-full transition-colors duration-200',
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
            'inline-block h-4 w-4 transform rounded-full bg-white shadow-sm',
            'transition-all duration-200 ease-out',
            checked ? 'translate-x-6' : 'translate-x-1'
          )}
        />
      </label>
    );
  }
);
Switch.displayName = 'Switch';

export { Switch };

// ============================================
// CHECKBOX COMPONENT
// ============================================

// components/ui/Checkbox.tsx
'use client';

import React from 'react';
import { Check, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  checked?: boolean | 'indeterminate';
  onCheckedChange?: (checked: boolean | 'indeterminate') => void;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, onCheckedChange, ...props }, ref) => {
    return (
      <label
        className={cn(
          'relative flex items-center justify-center',
          'w-5 h-5 rounded-md border-2',
          'transition-all duration-200 cursor-pointer',
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

// ============================================
// LABEL COMPONENT
// ============================================

// components/ui/Label.tsx
'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const labelVariants = cva(
  'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
  {
    variants: {
      variant: {
        default: 'text-gray-700',
        secondary: 'text-gray-500',
        error: 'text-red-500',
      },
      size: {
        default: 'text-sm',
        sm: 'text-xs',
        lg: 'text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

interface LabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement>,
    VariantProps<typeof labelVariants> {}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(labelVariants({ variant, size }), className)}
        {...props}
      />
    );
  }
);
Label.displayName = 'Label';

export { Label };

// ============================================
// TOAST COMPONENT
// ============================================

// components/ui/Toast.tsx
'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createPortal } from 'react-dom';

interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: 'default' | 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

interface ToastContextType {
  toast: (props: Omit<Toast, 'id'>) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  const toast = useCallback((props: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast = { ...props, id };
    setToasts((prev) => [...prev, newToast]);
    
    // Auto dismiss
    setTimeout(() => {
      dismiss(id);
    }, props.duration || 5000);
  }, []);
  
  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);
  
  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

const toastVariants = {
  default: 'bg-white border-gray-200 text-gray-900',
  success: 'bg-green-50 border-green-200 text-green-900',
  error: 'bg-red-50 border-red-200 text-red-900',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-900',
  info: 'bg-blue-50 border-blue-200 text-blue-900',
};

const toastIcons = {
  default: Info,
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const iconColors = {
  default: 'text-gray-500',
  success: 'text-green-500',
  error: 'text-red-500',
  warning: 'text-yellow-500',
  info: 'text-blue-500',
};

function ToastViewport({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  if (typeof document === 'undefined') return null;
  
  return createPortal(
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast, index) => {
        const Icon = toastIcons[toast.variant || 'default'];
        const iconColor = iconColors[toast.variant || 'default'];
        
        return (
          <div
            key={toast.id}
            className={cn(
              'w-80 p-4 rounded-xl border shadow-lg',
              'animate-slide-in-right',
              toastVariants[toast.variant || 'default']
            )}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-start gap-3">
              <Icon className={cn('w-5 h-5 flex-shrink-0 mt-0.5', iconColor)} />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{toast.title}</p>
                {toast.description && (
                  <p className="text-sm opacity-80 mt-1">{toast.description}</p>
                )}
              </div>
              <button
                onClick={() => onDismiss(toast.id)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>,
    document.body
  );
}

export { ToastProvider, useToast };
