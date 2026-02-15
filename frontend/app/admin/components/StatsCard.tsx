'use client';

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
    iconBg: 'bg-gradient-to-br from-brand-100 to-brand-50',
    text: 'text-brand-600',
    glow: 'group-hover:shadow-brand-500/20',
  },
  success: {
    iconBg: 'bg-gradient-to-br from-green-100 to-green-50',
    text: 'text-green-600',
    glow: 'group-hover:shadow-green-500/20',
  },
  warning: {
    iconBg: 'bg-gradient-to-br from-amber-100 to-amber-50',
    text: 'text-amber-600',
    glow: 'group-hover:shadow-amber-500/20',
  },
  danger: {
    iconBg: 'bg-gradient-to-br from-red-100 to-red-50',
    text: 'text-red-600',
    glow: 'group-hover:shadow-red-500/20',
  },
  info: {
    iconBg: 'bg-gradient-to-br from-blue-100 to-blue-50',
    text: 'text-blue-600',
    glow: 'group-hover:shadow-blue-500/20',
  },
  purple: {
    iconBg: 'bg-gradient-to-br from-purple-100 to-purple-50',
    text: 'text-purple-600',
    glow: 'group-hover:shadow-purple-500/20',
  },
};

export default function StatsCard({
  title,
  value,
  icon,
  color,
  link,
  description,
  trend
}: StatsCardProps) {
  const colors = colorMap[color];

  const Content = (
    <div className="grid grid-cols-[auto_1fr] items-start gap-4 h-full">
      <div
        className={cn(
          'w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0',
          'transition-all duration-300',
          'group-hover:scale-110 group-hover:shadow-lg',
          colors.iconBg,
          colors.text,
          colors.glow
        )}
      >
        {icon}
      </div>

      <div className="min-w-0 flex flex-col justify-start">
        <p className="text-gray-500 text-[11px] font-semibold uppercase tracking-wider dark:text-gray-400">
          {title}
        </p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5 tracking-tight dark:text-gray-100">
          {value}
        </p>

        <div className="mt-1 min-h-[18px]">
          {description && (
            <p className="text-gray-400 text-xs dark:text-gray-500">{description}</p>
          )}

          {trend && (
            <div className="flex items-center gap-1">
              {trend.isPositive ? (
                <ArrowUpRight className="w-3.5 h-3.5 text-green-500" />
              ) : (
                <ArrowDownRight className="w-3.5 h-3.5 text-red-500" />
              )}
              <span
                className={cn(
                  'text-xs font-medium',
                  trend.isPositive ? 'text-green-500' : 'text-red-500'
                )}
              >
                {trend.value}%
              </span>
              <span className="text-gray-400 text-xs dark:text-gray-500">vs last month</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const containerClasses = cn(
    'bg-white rounded-2xl p-5',
    'border border-gray-100',
    'shadow-sm shadow-gray-200/50',
    'transition-all duration-300 ease-out',
    'group cursor-pointer',
    'hover:-translate-y-1 hover:shadow-lg',
    'hover:border-gray-200',
    'block h-full',
    'dark:bg-gray-800 dark:border-gray-700 dark:shadow-none',
    'dark:hover:border-gray-600'
  );

  if (link) {
    return (
      <Link href={link} className={containerClasses}>
        {Content}
      </Link>
    );
  }

  return <div className={containerClasses}>{Content}</div>;
}
