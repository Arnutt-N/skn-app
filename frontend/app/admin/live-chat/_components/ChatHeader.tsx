'use client';

import React from 'react';
import { ArrowLeft, Bot, ChevronLeft, ChevronRight, Star, User } from 'lucide-react';

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
  const isBot = currentChat?.chat_mode === 'BOT';
  const isActive = currentChat?.session?.status === 'ACTIVE';
  const isVip = currentChat?.tags?.some((t) => t.name.toUpperCase() === 'VIP');

  return (
    <header className="h-16 px-4 bg-surface border-b border-border-default flex items-center justify-between thai-text">
      <div className="flex items-center gap-3">
        {isMobileView && (
          <button
            onClick={onBackToList}
            className="p-2 rounded-xl border border-border-default text-text-tertiary hover:bg-gray-50"
            aria-label="Back to conversations"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}
        <button className="relative cursor-pointer rounded-full" onClick={onToggleCustomerPanel} aria-label="Toggle customer panel">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={currentChat?.picture_url} className="w-10 h-10 rounded-full object-cover" alt={currentChat?.display_name || ''} />
          <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-surface ${isActive ? 'bg-online' : 'bg-away'}`} />
        </button>
        <div>
          <div className="flex items-center gap-1.5">
            <p className="font-semibold text-text-primary text-sm thai-no-break">{currentChat?.display_name}</p>
            {isVip && <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />}
          </div>
          <p className="text-xs text-text-tertiary thai-no-break">
            {isBot ? 'Bot Mode' : 'Manual Mode'}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {/* Bot/Manual toggle pill */}
        <button
          onClick={() => onToggleMode(isBot ? 'HUMAN' : 'BOT')}
          className={`hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
            isBot
              ? 'bg-info/10 text-info hover:bg-info/20'
              : 'bg-online/10 text-online hover:bg-online/20'
          }`}
        >
          {isBot ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
          {isBot ? 'Bot' : 'Manual'}
        </button>
        <div className="h-6 w-px bg-border-default mx-1 hidden sm:block" />
        <SessionActions
          session={currentChat?.session}
          claiming={claiming}
          onClaim={onClaim}
          onClose={onClose}
          onTransfer={onTransfer}
        />
        <button
          onClick={onToggleCustomerPanel}
          className={`p-2 rounded-xl border transition-colors ${showCustomerPanel ? 'bg-brand-500/8 text-brand-600 border-brand-500/20' : 'bg-surface text-text-tertiary border-border-default hover:bg-gray-50'}`}
          aria-label={showCustomerPanel ? 'Hide customer panel' : 'Show customer panel'}
        >
          {showCustomerPanel ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
}
