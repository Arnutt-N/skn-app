'use client';

import React from 'react';
import { Search } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select, type SelectOption } from '@/components/ui/Select';

interface AdminSearchFilterBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  statusValue: string;
  onStatusChange: (value: string) => void;
  categoryValue?: string;
  onCategoryChange?: (value: string) => void;
  searchPlaceholder: string;
  statusOptions: SelectOption[];
  categoryOptions?: SelectOption[];
  showCategory?: boolean;
}

export function AdminSearchFilterBar({
  searchValue,
  onSearchChange,
  statusValue,
  onStatusChange,
  categoryValue,
  onCategoryChange,
  searchPlaceholder,
  statusOptions,
  categoryOptions,
  showCategory = true,
}: AdminSearchFilterBarProps) {
  return (
    <Card glass className="border-none shadow-sm">
      <CardContent className="p-4">
        <div className={`grid grid-cols-1 gap-4 ${showCategory ? 'md:grid-cols-4' : 'md:grid-cols-3'}`}>
          <div className="col-span-1 md:col-span-2">
            <Input
              placeholder={searchPlaceholder}
              className="thai-no-break"
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
              variant="filled"
            />
          </div>

          <Select
            value={statusValue}
            onChange={(e) => onStatusChange(e.target.value)}
            variant="filled"
            options={statusOptions}
          />
          {showCategory && onCategoryChange && categoryOptions && (
            <Select
              value={categoryValue ?? ''}
              onChange={(e) => onCategoryChange(e.target.value)}
              variant="filled"
              options={categoryOptions}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
