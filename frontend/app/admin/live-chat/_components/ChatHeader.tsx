'use client';

import React from 'react';
import {
  ArrowLeft,
  Bot,
  ChevronLeft,
  ChevronRight,
  Star,
  User,
} from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import type { CurrentChat } from '../_types';
import { SessionActions } from './SessionActions';

interface ChatHeaderProps {
  currentChat: CurrentChat | null;
  claiming: boolean;
  isMobileView: boolean;
  showCustomerPanel: boolean;
  onBackToList: () => void;
  onToggleMode: (mode: 'BOT' | 'HUMAN') => void | Promise<void>;
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
  const isVip = currentChat?.tags?.some((tag) => tag.name.toUpperCase() === 'VIP');

  const statusColor = isActive ? 'bg-online' : currentChat ? 'bg-away' : 'bg-offline';
  const displayName = currentChat?.display_name || 'Unknown User';
  const fallback = displayName.charAt(0) || 'U';

  return (
    <header className="h-16 border-b border-border-default bg-surface px-4 thai-text">
      <div className="flex h-full items-center justify-between">
        <div className="flex items-center gap-3">
          {isMobileView && (
            <button
              onClick={onBackToList}
              className="rounded-xl border border-border-default p-2 text-text-tertiary transition-colors hover:bg-gray-50"
              aria-label="Back to conversations"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}

          <button
            className="relative cursor-pointer"
            onClick={onToggleCustomerPanel}
            aria-label="Toggle customer panel"
          >
            <Avatar
              size="md"
              src={currentChat?.picture_url}
              alt={displayName}
              fallback={fallback}
              className="border border-border-subtle"
            />
            <span
              className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-surface ${statusColor}`}
            />
          </button>

          <div>
            <div className="flex items-center gap-1.5">
              <p className="thai-no-break text-sm font-semibold text-text-primary">{displayName}</p>
              {isVip && <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />}
            </div>
            <p className="thai-no-break text-xs text-text-tertiary">
              {isBot ? 'Bot Mode' : 'Manual Mode'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggleMode(isBot ? 'HUMAN' : 'BOT')}
            className={`ring-1 ring-inset hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all md:inline-flex ${
              isBot
                ? 'bg-gray-100 text-text-secondary ring-gray-200 hover:bg-gray-200'
                : 'bg-brand-50 text-brand-600 ring-brand-100 hover:bg-brand-100'
            }`}
          >
            {isBot ? <Bot className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
            {isBot ? 'BOT' : 'MANUAL'}
          </button>

          <div className="mx-1 hidden h-6 w-px bg-border-default sm:block" />

          <SessionActions
            session={currentChat?.session}
            claiming={claiming}
            onClaim={onClaim}
            onClose={onClose}
            onTransfer={onTransfer}
          />

          <button
            onClick={onToggleCustomerPanel}
            className={`rounded-xl border p-2 transition-colors ${
              showCustomerPanel
                ? 'border-brand-200 bg-brand-50 text-brand-600'
                : 'border-border-default bg-surface text-text-tertiary hover:bg-gray-50'
            }`}
            aria-label={showCustomerPanel ? 'Hide customer panel' : 'Show customer panel'}
          >
            {showCustomerPanel ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </header>
  );
}
