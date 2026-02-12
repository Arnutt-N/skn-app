'use client';

import React from 'react';
import Link from 'next/link';
import { Home, Inbox, Search } from 'lucide-react';

import { useConversations } from '../_hooks/useConversations';
import { useLiveChatContext } from '../_context/LiveChatContext';
import { ConversationItem } from './ConversationItem';
import { QueueBadge } from './QueueBadge';

interface SearchMessageResult {
  id: number;
  line_user_id: string;
  display_name?: string | null;
  content: string;
  direction: 'INCOMING' | 'OUTGOING';
  sender_role?: 'USER' | 'BOT' | 'ADMIN' | null;
  created_at?: string | null;
}

export function ConversationList() {
  const {
    state,
    formatTime,
    setFilterStatus,
    setSearchQuery,
    selectConversation,
    jumpToMessage,
    setActiveActionMenu,
  } = useLiveChatContext();
  const { filtered, waitingCount, activeCount } = useConversations(state.conversations, state.searchQuery);
  const selectedIndex = filtered.findIndex((c) => c.line_user_id === state.selectedId);
  const selectedConversation = selectedIndex >= 0 ? filtered[selectedIndex] : null;
  const [searchResults, setSearchResults] = React.useState<SearchMessageResult[]>([]);
  const [searching, setSearching] = React.useState(false);

  React.useEffect(() => {
    const q = state.searchQuery.trim();
    if (!q) {
      setSearchResults([]);
      return;
    }
    const timeoutId = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/v1/admin/live-chat/messages/search?q=${encodeURIComponent(q)}&limit=10`);
        if (!res.ok) return;
        const data = await res.json();
        setSearchResults(data.items || []);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [state.searchQuery]);

  return (
    <aside className="w-full md:w-72 bg-gradient-to-b from-[#2B2840] to-[#1E1B33] flex flex-col flex-shrink-0 border-r border-white/5 thai-text">
      <div className="h-14 px-4 border-b border-white/5 flex items-center gap-3">
        <Link
          href="/admin"
          className="p-2 bg-white/8 hover:bg-primary/30 text-slate-400 hover:text-white rounded-xl transition-all"
          aria-label="Back to admin dashboard"
        >
          <Home className="w-4 h-4" />
        </Link>
        <h1 className="flex-1 text-white font-bold text-sm text-center tracking-tight">Live Chat</h1>
      </div>

      <div className="px-4 py-3 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={state.searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-10 pr-3 py-2.5 bg-white/5 border border-white/10 text-slate-200 rounded-xl text-sm focus-ring focus:border-primary/40 focus:bg-white/8 placeholder:text-slate-500 transition-all thai-no-break"
            aria-label="Search conversations"
          />
        </div>
        <div className="flex gap-1.5">
          <button
            className={`flex-1 py-1.5 px-2 text-[11px] font-semibold rounded-lg transition-all focus-ring ${state.filterStatus === null ? 'bg-gradient-to-br from-primary to-primary-dark text-white shadow-sm' : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200'}`}
            onClick={() => setFilterStatus(null)}
          >
            <span className="flex items-center justify-center gap-1">All <QueueBadge count={state.conversations.length} tone="neutral" /></span>
          </button>
          <button
            className={`flex-1 py-1.5 px-2 text-[11px] font-semibold rounded-lg transition-all focus-ring ${state.filterStatus === 'WAITING' ? 'bg-gradient-to-br from-primary to-primary-dark text-white shadow-sm' : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200'}`}
            onClick={() => setFilterStatus('WAITING')}
          >
            <span className="flex items-center justify-center gap-1">Waiting <QueueBadge count={waitingCount} tone="waiting" /></span>
          </button>
          <button
            className={`flex-1 py-1.5 px-2 text-[11px] font-semibold rounded-lg transition-all focus-ring ${state.filterStatus === 'ACTIVE' ? 'bg-gradient-to-br from-primary to-primary-dark text-white shadow-sm' : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200'}`}
            onClick={() => setFilterStatus('ACTIVE')}
          >
            <span className="flex items-center justify-center gap-1">Active <QueueBadge count={activeCount} tone="active" /></span>
          </button>
        </div>
      </div>

      <div
        className="flex-1 overflow-y-auto dark-scrollbar px-2"
        role="listbox"
        aria-label="Conversation list"
        aria-activedescendant={selectedConversation ? `conversation-option-${selectedConversation.line_user_id}` : undefined}
        tabIndex={0}
        onKeyDown={(event) => {
          if (!filtered.length) return;
          if (event.key === 'ArrowDown') {
            event.preventDefault();
            const next = Math.min((selectedIndex < 0 ? -1 : selectedIndex) + 1, filtered.length - 1);
            selectConversation(filtered[next].line_user_id);
          } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            const next = Math.max((selectedIndex < 0 ? 0 : selectedIndex) - 1, 0);
            selectConversation(filtered[next].line_user_id);
          } else if (event.key === 'Enter' && selectedIndex >= 0) {
            event.preventDefault();
            selectConversation(filtered[selectedIndex].line_user_id);
          }
        }}
      >
        {state.searchQuery.trim() && (
          <div className="px-1 pt-2 pb-1">
            <div className="px-2 py-1 text-[10px] tracking-wide text-slate-500 font-semibold">
              Message Search
            </div>
            {searching && <div className="px-2 py-2 text-xs text-slate-400">Searching...</div>}
            {!searching && searchResults.length === 0 && (
              <div className="px-2 py-2 text-xs text-slate-500">No matching messages</div>
            )}
            {!searching && searchResults.length > 0 && (
              <div className="space-y-1 mb-2">
                {searchResults.map((result) => (
                  <button
                    key={result.id}
                    onClick={() => jumpToMessage(result.line_user_id, result.id)}
                    className="w-full text-left p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
                  >
                    <div className="text-[11px] text-slate-200 font-medium truncate">
                      {result.display_name || result.line_user_id}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">{result.content}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        {state.loading && state.conversations.length === 0 ? (
          <div className="space-y-2 p-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3 p-3 bg-white/5 rounded-xl animate-pulse">
                <div className="w-11 h-11 bg-slate-700/50 rounded-full" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-3 bg-slate-700/50 rounded w-2/3" />
                  <div className="h-2.5 bg-slate-700/30 rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 opacity-60">
            <Inbox className="w-10 h-10 text-slate-500 mb-3" />
            <span className="text-slate-400 text-sm">No conversations</span>
          </div>
        ) : (
          <div className="space-y-1 py-2">
            {filtered.map((conversation) => (
              <ConversationItem
                key={conversation.line_user_id}
                optionId={`conversation-option-${conversation.line_user_id}`}
                conversation={conversation}
                selected={state.selectedId === conversation.line_user_id}
                formattedTime={conversation.last_message?.created_at ? formatTime(conversation.last_message.created_at) : undefined}
                onClick={() => {
                  selectConversation(conversation.line_user_id);
                  setActiveActionMenu(null);
                }}
                onMenuClick={() => setActiveActionMenu(state.activeActionMenu === conversation.line_user_id ? null : conversation.line_user_id)}
              />
            ))}
          </div>
        )}
      </div>
      <div className="px-4 py-2.5 border-t border-white/5 bg-black/10 text-xs text-slate-500 flex justify-center">
        <span>{activeCount} active • {waitingCount} waiting</span>
      </div>
    </aside>
  );
}
