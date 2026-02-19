'use client';

import React from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import { cn } from '@/lib/utils';

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('p-3', className)}
      classNames={{
        months: 'flex flex-col gap-4 sm:flex-row sm:gap-6',
        month: 'space-y-4',
        caption: 'relative flex items-center justify-center pt-1',
        caption_label: 'text-sm font-semibold text-text-primary',
        nav: 'flex items-center gap-1',
        nav_button:
          'h-7 w-7 rounded-lg border border-border-default bg-surface p-0 text-text-secondary transition-colors hover:bg-gray-100 hover:text-text-primary',
        nav_button_previous: 'absolute left-1',
        nav_button_next: 'absolute right-1',
        table: 'w-full border-collapse',
        head_row: 'flex',
        head_cell: 'w-9 rounded-md text-[0.8rem] font-medium text-text-secondary',
        row: 'mt-2 flex w-full',
        cell: 'relative h-9 w-9 p-0 text-center text-sm [&:has([aria-selected].day-range-end)]:rounded-r-lg [&:has([aria-selected].day-outside)]:bg-brand-50 [&:has([aria-selected])]:bg-brand-50 first:[&:has([aria-selected])]:rounded-l-lg last:[&:has([aria-selected])]:rounded-r-lg focus-within:relative focus-within:z-20',
        day: 'h-9 w-9 rounded-lg p-0 font-normal text-text-primary transition-colors hover:bg-brand-50 hover:text-brand-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 aria-selected:opacity-100',
        day_range_end: 'day-range-end',
        day_selected:
          'bg-brand-500 text-white hover:bg-brand-600 focus:bg-brand-600',
        day_today: 'bg-gray-100 text-text-primary',
        day_outside:
          'day-outside text-text-tertiary aria-selected:bg-brand-50 aria-selected:text-text-secondary',
        day_disabled: 'text-text-tertiary opacity-50',
        day_range_middle:
          'aria-selected:bg-brand-50 aria-selected:text-brand-900',
        day_hidden: 'invisible',
        ...classNames,
      }}
      components={{
        Chevron: ({ className: chevronClassName, orientation = 'right' }) => {
          const iconClassName = cn('h-4 w-4', chevronClassName);

          if (orientation === 'left') {
            return <ChevronLeft className={iconClassName} />;
          }
          if (orientation === 'up') {
            return <ChevronUp className={iconClassName} />;
          }
          if (orientation === 'down') {
            return <ChevronDown className={iconClassName} />;
          }

          return <ChevronRight className={iconClassName} />;
        },
      }}
      {...props}
    />
  );
}
Calendar.displayName = 'Calendar';

export { Calendar };
export default Calendar;
