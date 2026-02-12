'use client';

import React from 'react';

export function QueueBadge({ count, tone }: { count: number; tone?: 'waiting' | 'active' | 'neutral' }) {
  if (count <= 0) return null;
  const toneClass = tone === 'waiting'
    ? 'bg-status-waiting/25 text-orange-200'
    : tone === 'active'
      ? 'bg-status-active/25 text-emerald-200'
      : 'bg-slate-600/50 text-slate-200';
  return (
    <span className={`text-[10px] px-1.5 rounded-full ${toneClass}`}>
      {count}
    </span>
  );
}
