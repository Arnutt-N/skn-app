'use client';

import React from 'react';
import { ArrowRightLeft, CheckCircle2, RefreshCw, Users } from 'lucide-react';

import type { Session } from '../_types';

interface SessionActionsProps {
  session?: Session;
  claiming: boolean;
  onClaim: () => void;
  onClose: () => void;
  onTransfer: () => void;
}

export function SessionActions({ session, claiming, onClaim, onClose, onTransfer }: SessionActionsProps) {
  return (
    <div role="group" aria-label="Session actions" className="flex items-center gap-2 thai-text">
      {session?.status === 'WAITING' && (
        <button
          onClick={onClaim}
          disabled={claiming}
          className={`px-3 py-1.5 text-white rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all focus-ring ${claiming ? 'bg-primary/70 cursor-wait' : 'bg-gradient-to-br from-primary to-primary-dark hover:shadow-lg active:scale-[0.97]'}`}
          aria-label="Claim session"
        >
          {claiming ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
          <span className="thai-no-break">{claiming ? 'Claiming...' : 'Claim'}</span>
        </button>
      )}
      {session?.status === 'ACTIVE' && (
        <>
          <button onClick={onTransfer} className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-full text-xs font-semibold flex items-center gap-1.5 focus-ring" aria-label="Transfer session">
            <ArrowRightLeft className="w-4 h-4" /><span className="thai-no-break">Transfer</span>
          </button>
          <button onClick={onClose} className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full text-xs font-semibold flex items-center gap-1.5 focus-ring" aria-label="Close session">
            <CheckCircle2 className="w-4 h-4" /><span className="thai-no-break">Done</span>
          </button>
        </>
      )}
    </div>
  );
}
