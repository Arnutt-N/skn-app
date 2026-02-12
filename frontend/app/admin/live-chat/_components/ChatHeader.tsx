'use client';

import React from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';

import { ChatModeToggle } from '@/components/admin/ChatModeToggle';
import type { CurrentChat } from '../_types';
import { SessionActions } from './SessionActions';

interface ChatHeaderProps {
  currentChat: CurrentChat | null;
  claiming: boolean;
  isMobileView: boolean;
  showCustomerPanel: boolean;
  onBackToList: () => void;
  onToggleMode: (mode: 'BOT' | 'HUMAN') => void;
  onClaim: () => void;
  onClose: () => void;
  onTransfer: () => void;
  onToggleCustomerPanel: () => void;
}

export function ChatHeader({
  currentChat,
  claiming,
  isMobileView,
  showCustomerPanel,
  onBackToList,
  onToggleMode,
  onClaim,
  onClose,
  onTransfer,
  onToggleCustomerPanel,
}: ChatHeaderProps) {
  return (
    <header className="h-14 px-4 bg-white/80 backdrop-blur-xl border-b border-slate-100/60 flex items-center justify-between thai-text">
      <div className="flex items-center gap-3">
        {isMobileView && (
          <button
            onClick={onBackToList}
            className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 focus-ring"
            aria-label="Back to conversations"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}
        <button className="relative cursor-pointer focus-ring rounded-full" onClick={onToggleCustomerPanel} aria-label="Toggle customer panel">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={currentChat?.picture_url} className="w-10 h-10 rounded-full object-cover" alt={currentChat?.display_name || ''} />
          <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${currentChat?.session?.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-orange-500'}`} />
        </button>
        <div>
          <p className="font-semibold text-slate-800 text-sm thai-no-break">{currentChat?.display_name}</p>
          <p className="text-xs text-slate-500 thai-no-break">{currentChat?.chat_mode === 'HUMAN' ? 'Manual Mode' : 'Bot Mode'}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="hidden md:block">
          <ChatModeToggle currentMode={currentChat?.chat_mode || 'BOT'} onToggle={onToggleMode} disabled={false} />
        </div>
        <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" />
        <SessionActions
          session={currentChat?.session}
          claiming={claiming}
          onClaim={onClaim}
          onClose={onClose}
          onTransfer={onTransfer}
        />
        <button
          onClick={onToggleCustomerPanel}
          className={`p-2 rounded-xl border focus-ring ${showCustomerPanel ? 'bg-primary/8 text-primary border-primary/20' : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'}`}
          aria-label={showCustomerPanel ? 'Hide customer panel' : 'Show customer panel'}
        >
          {showCustomerPanel ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
}
