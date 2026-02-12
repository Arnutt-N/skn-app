'use client';

import React, { Suspense } from 'react';

import { LiveChatProvider } from './_context/LiveChatContext';
import { LiveChatShell } from './_components/LiveChatShell';

function LiveChatLoading() {
  return (
    <div className="flex h-screen w-full bg-slate-100 items-center justify-center thai-text">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-500 text-sm thai-no-break">Loading Live Chat...</p>
      </div>
    </div>
  );
}

function LiveChatContent() {
  return (
    <LiveChatProvider>
      <LiveChatShell />
    </LiveChatProvider>
  );
}

export default function LiveChatPage() {
  return (
    <Suspense fallback={<LiveChatLoading />}>
      <LiveChatContent />
    </Suspense>
  );
}
