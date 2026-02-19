'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    children?: React.ReactNode; // Action buttons slot
    className?: string;
}

export default function PageHeader({
    title,
    subtitle,
    children,
    className,
}: PageHeaderProps) {
    return (
        <div
            className={cn(
                'flex items-center justify-between',
                'bg-white rounded-2xl p-5',
                'border border-gray-100 shadow-sm',
                'dark:bg-gray-800 dark:border-gray-700',
                className
            )}
        >
            <div>
                <h1 className="text-2xl font-bold text-gray-800 tracking-tight thai-no-break dark:text-gray-100">
                    {title}
                </h1>
                {subtitle && (
                    <p className="text-sm text-gray-400 mt-0.5 thai-no-break dark:text-gray-500">
                        {subtitle}
                    </p>
                )}
            </div>
            {children && (
                <div className="flex items-center gap-3">{children}</div>
            )}
        </div>
    );
}
