'use client';

import React, { useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const radioGroupVariants = cva('flex', {
  variants: {
    orientation: {
      vertical: 'flex-col gap-2',
      horizontal: 'flex-row gap-4 flex-wrap',
    },
  },
  defaultVariants: {
    orientation: 'vertical',
  },
});

const radioItemVariants = cva(
  [
    'relative flex cursor-pointer items-center gap-3',
    'transition-all duration-200 ease-out',
    'focus-within:outline-none',
  ],
  {
    variants: {
      variant: {
        default: '',
        card: [
          'rounded-xl border border-gray-200 p-4',
          'hover:border-brand-300 hover:bg-brand-50/50',
          'has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50',
          'has-[:checked]:ring-2 has-[:checked]:ring-brand-500/20',
        ],
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface RadioGroupProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'>,
    VariantProps<typeof radioGroupVariants> {
  value?: string;
  onValueChange?: (value: string) => void;
  name?: string;
  disabled?: boolean;
}

const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  (
    {
      className,
      orientation,
      value,
      onValueChange,
      name,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const groupRef = useRef<HTMLDivElement>(null);

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        const group = groupRef.current;
        if (!group) return;

        const items = Array.from(
          group.querySelectorAll<HTMLInputElement>('input[type="radio"]:not(:disabled)')
        );
        const currentIndex = items.findIndex((item) => item === document.activeElement || item.checked);

        let nextIndex = -1;
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
          e.preventDefault();
          nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
        } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
          e.preventDefault();
          nextIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
        }

        if (nextIndex >= 0) {
          items[nextIndex].focus();
          items[nextIndex].click();
        }
      },
      []
    );

    return (
      <div
        ref={(node) => {
          (groupRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
          if (typeof ref === 'function') ref(node);
          else if (ref) ref.current = node;
        }}
        role="radiogroup"
        className={cn(radioGroupVariants({ orientation }), className)}
        onKeyDown={handleKeyDown}
        {...props}
      >
        {React.Children.map(children, (child) => {
          if (React.isValidElement<RadioGroupItemProps>(child)) {
            return React.cloneElement(child, {
              name,
              checked: value !== undefined ? child.props.value === value : undefined,
              onChange: onValueChange
                ? () => onValueChange(child.props.value)
                : undefined,
              disabled: disabled || child.props.disabled,
            });
          }
          return child;
        })}
      </div>
    );
  }
);

RadioGroup.displayName = 'RadioGroup';

export interface RadioGroupItemProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'>,
    VariantProps<typeof radioItemVariants> {
  value: string;
  label?: string;
  description?: string;
}

const RadioGroupItem = React.forwardRef<HTMLInputElement, RadioGroupItemProps>(
  (
    {
      className,
      variant,
      value,
      label,
      description,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <label className={cn(radioItemVariants({ variant }), className)}>
        <input
          ref={ref}
          type="radio"
          role="radio"
          aria-checked={props.checked}
          value={value}
          className={cn(
            'h-4 w-4 shrink-0 border-2 border-gray-300 text-brand-500',
            'checked:border-brand-500 checked:bg-brand-500',
            'focus:ring-2 focus:ring-brand-500/20 focus:ring-offset-2 focus:outline-none',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'transition-all duration-200'
          )}
          {...props}
        />
        {(label || description || children) && (
          <div className="flex flex-col">
            {label && (
              <span className="text-sm font-medium text-gray-900">
                {label}
              </span>
            )}
            {description && (
              <span className="text-xs text-gray-500">{description}</span>
            )}
            {children}
          </div>
        )}
      </label>
    );
  }
);

RadioGroupItem.displayName = 'RadioGroupItem';

export { RadioGroup, RadioGroupItem, radioGroupVariants, radioItemVariants };
