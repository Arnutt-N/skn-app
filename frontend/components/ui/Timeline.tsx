'use client';

import React from 'react';
import { cn } from '@/lib/utils';

type TimelineVariant = 'default' | 'compact';

interface TimelineItem {
  date: string;
  title: string;
  description?: string;
  type?: 'follow' | 'unfollow' | 'refollow' | 'block' | 'default';
  icon?: React.ReactNode;
}

interface TimelineProps {
  items: TimelineItem[];
  variant?: TimelineVariant;
  className?: string;
}

// Color mapping for dot types using existing design tokens
const dotColors: Record<string, string> = {
  follow: 'bg-success',
  unfollow: 'bg-warning',
  refollow: 'bg-info',
  block: 'bg-danger',
  default: 'bg-brand-500',
};

export function Timeline({ items, variant = 'default', className }: TimelineProps) {
  return (
    <div className={cn('relative', className)}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const dotColor = dotColors[item.type ?? 'default'];

        return (
          <div key={index} className="relative flex gap-4">
            {/* Connector line + dot */}
            <div className="flex flex-col items-center">
              <div className={cn(
                'relative z-10 flex-shrink-0 rounded-full border-2 border-surface dark:border-surface-dark',
                variant === 'compact' ? 'w-3 h-3' : 'w-4 h-4',
                dotColor
              )}>
                {item.icon && variant !== 'compact' && (
                  <div className="absolute -left-1 -top-1 w-6 h-6 flex items-center justify-center text-white">
                    {item.icon}
                  </div>
                )}
              </div>
              {!isLast && (
                <div className="w-0.5 flex-1 min-h-8 bg-gray-200 dark:bg-gray-700" />
              )}
            </div>

            {/* Content */}
            <div className={cn(
              'pb-6',
              variant === 'compact' ? 'pb-4' : 'pb-6'
            )}>
              <time className="text-xs text-text-tertiary font-mono">
                {item.date}
              </time>
              <h4 className={cn(
                'font-medium text-text-primary',
                variant === 'compact' ? 'text-sm' : 'text-base'
              )}>
                {item.title}
              </h4>
              {item.description && (
                <p className="text-sm text-text-secondary mt-1">
                  {item.description}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export type { TimelineItem, TimelineProps };
export default Timeline;
