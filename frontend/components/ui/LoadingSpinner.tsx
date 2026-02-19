'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const sizeMap = {
    sm: { icon: 'h-5 w-5', text: 'text-xs' },
    md: { icon: 'h-8 w-8', text: 'text-sm' },
    lg: { icon: 'h-12 w-12', text: 'text-base' },
};

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    label?: string;
    className?: string;
    /** If true, renders full-height centered (min-h-[40vh]). Default: true */
    fullPage?: boolean;
}

export function LoadingSpinner({
    size = 'md',
    label,
    className,
    fullPage = true,
}: LoadingSpinnerProps) {
    const { icon, text } = sizeMap[size];

    return (
        <div
            className={cn(
                'flex flex-col items-center justify-center gap-3',
                fullPage && 'min-h-[40vh] w-full',
                className
            )}
        >
            <Loader2
                className={cn(icon, 'animate-spin text-brand-500 dark:text-brand-400')}
            />
            {label && (
                <p className={cn(text, 'text-gray-400 font-medium dark:text-gray-500')}>
                    {label}
                </p>
            )}
        </div>
    );
}

export default LoadingSpinner;
