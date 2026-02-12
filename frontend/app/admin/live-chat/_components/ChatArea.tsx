'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import { Home, MessageSquare, Wifi, WifiOff } from 'lucide-react';
import Link from 'next/link';

import type { Message } from '@/lib/websocket/types';
import { useLiveChatContext } from '../_context/LiveChatContext';
import { ChatHeader } from './ChatHeader';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { TypingIndicator } from './TypingIndicator';

function getSenderLabel(message: Message, displayName?: string) {
  if (message.direction === 'INCOMING') return displayName || 'User';
  if (message.sender_role === 'BOT') return 'Bot';
  return message.operator_name || 'Admin';
}

const VIRTUALIZATION_THRESHOLD = 200;
const VIRTUAL_ESTIMATED_ROW_HEIGHT = 88;
const VIRTUAL_OVERSCAN = 12;

export function ChatArea() {
  const {
    state,
    wsStatus,
    isMobileView,
    typingUsersCount,
    focusedMessageId,
    clearFocusedMessage,
    isHumanMode,
    sendMessage,
    sendMedia,
    claimSession,
    closeSession,
    toggleMode,
    setInputText,
    setShowTransferDialog,
    setShowCannedPicker,
    setShowCustomerPanel,
    setSoundEnabled,
    startTyping,
    loadOlderMessages,
    retryMessage,
    selectConversation,
  } = useLiveChatContext();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const historySentinelRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = React.useState(0);
  const [viewportHeight, setViewportHeight] = React.useState(0);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.messages.length]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    setViewportHeight(container.clientHeight);
    const observer = new ResizeObserver(() => {
      setViewportHeight(container.clientHeight);
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [state.selectedId]);

  useEffect(() => {
    if (!focusedMessageId) return;
    const idx = state.messages.findIndex((m) => m.id === focusedMessageId);
    if (idx < 0) return;
    const container = messagesContainerRef.current;
    if (!container) return;
    container.scrollTop = Math.max(
      0,
      idx * VIRTUAL_ESTIMATED_ROW_HEIGHT - container.clientHeight / 2,
    );
    const timer = window.setTimeout(() => {
      const target = document.getElementById(`message-${focusedMessageId}`);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      clearFocusedMessage();
    }, 40);
    return () => window.clearTimeout(timer);
  }, [clearFocusedMessage, focusedMessageId, state.messages]);

  useEffect(() => {
    if (!historySentinelRef.current || !state.selectedId) return;
    const observer = new IntersectionObserver(async (entries) => {
      if (!entries[0]?.isIntersecting) return;
      if (!state.hasMoreHistory || state.isLoadingHistory) return;
      const container = messagesContainerRef.current;
      const prevHeight = container?.scrollHeight || 0;
      await loadOlderMessages();
      requestAnimationFrame(() => {
        if (!container) return;
        const delta = container.scrollHeight - prevHeight;
        container.scrollTop += delta;
      });
    }, { root: messagesContainerRef.current, threshold: 0.1 });
    observer.observe(historySentinelRef.current);
    return () => observer.disconnect();
  }, [loadOlderMessages, state.hasMoreHistory, state.isLoadingHistory, state.selectedId]);

  const connectionStatus = useMemo(() => {
    switch (wsStatus) {
      case 'connected':
        return { icon: Wifi, className: 'bg-emerald-600/10 text-emerald-600', label: 'Connected' };
      case 'connecting':
      case 'authenticating':
        return { icon: Wifi, className: 'bg-amber-600/10 text-amber-600', label: 'Connecting...' };
      case 'reconnecting':
        return { icon: WifiOff, className: 'bg-orange-600/10 text-orange-600', label: 'Reconnecting...' };
      default:
        return { icon: WifiOff, className: 'bg-slate-500/10 text-slate-500', label: 'Offline' };
    }
  }, [wsStatus]);

  const virtualEnabled = state.messages.length > VIRTUALIZATION_THRESHOLD;
  const visibleWindow = useMemo(() => {
    const total = state.messages.length;
    if (!virtualEnabled || total === 0) {
      return {
        startIndex: 0,
        endIndex: total,
        topPadding: 0,
        bottomPadding: 0,
      };
    }
    const start = Math.max(
      0,
      Math.floor(scrollTop / VIRTUAL_ESTIMATED_ROW_HEIGHT) - VIRTUAL_OVERSCAN,
    );
    const visibleCount = Math.ceil(viewportHeight / VIRTUAL_ESTIMATED_ROW_HEIGHT) + VIRTUAL_OVERSCAN * 2;
    const end = Math.min(total, start + visibleCount);
    return {
      startIndex: start,
      endIndex: end,
      topPadding: start * VIRTUAL_ESTIMATED_ROW_HEIGHT,
      bottomPadding: Math.max(0, (total - end) * VIRTUAL_ESTIMATED_ROW_HEIGHT),
    };
  }, [scrollTop, state.messages.length, viewportHeight, virtualEnabled]);

  if (!state.selectedId) {
    const ConnIcon = connectionStatus.icon;
    const waitingCount = state.conversations.filter((c) => c.session?.status === 'WAITING').length;
    const activeCount = state.conversations.filter((c) => c.session?.status === 'ACTIVE').length;
    return (
      <div className="flex-1 flex flex-col">
        <header className="h-14 px-5 bg-white/80 backdrop-blur-xl border-b border-slate-100/60 flex items-center justify-between">
          <span className="font-semibold text-slate-700 text-sm">Live Chat Console</span>
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${connectionStatus.className}`} aria-live="polite">
              <ConnIcon className="w-4 h-4" />
              {connectionStatus.label}
            </div>
            <Link href="/admin" className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all">
              <Home className="w-4 h-4" />Admin
            </Link>
          </div>
        </header>
      <div className="flex-1 flex items-center justify-center thai-text">
          <div className="text-center p-8">
            <div className="w-20 h-20 bg-white rounded-2xl shadow-xl flex items-center justify-center mx-auto mb-4 border border-slate-100/60">
              <MessageSquare className="w-9 h-9 text-primary" />
            </div>
            <p className="text-slate-700 font-semibold text-base mb-1 thai-no-break">Select a Conversation</p>
            <p className="text-slate-500 text-sm">Choose from the sidebar to start chatting</p>
            <div className="flex gap-6 justify-center mt-6">
              <div><div className="text-2xl font-bold text-slate-700">{waitingCount}</div><div className="text-xs text-slate-400">Waiting</div></div>
              <div><div className="text-2xl font-bold text-slate-700">{activeCount}</div><div className="text-xs text-slate-400">Active</div></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="flex-1 flex flex-col bg-slate-50 min-w-0 relative z-10">
      <ChatHeader
        currentChat={state.currentChat}
        claiming={state.claiming}
        isMobileView={isMobileView}
        showCustomerPanel={state.showCustomerPanel}
        onBackToList={() => selectConversation(null)}
        onToggleMode={toggleMode}
        onClaim={claimSession}
        onClose={closeSession}
        onTransfer={() => setShowTransferDialog(true)}
        onToggleCustomerPanel={() => setShowCustomerPanel(!state.showCustomerPanel)}
      />
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-2 bg-slate-100 chat-scrollbar"
        aria-live="polite"
        onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
      >
        <div ref={historySentinelRef} />
        {virtualEnabled && (
          <div
            aria-hidden
            style={{ height: `${visibleWindow.topPadding}px` }}
          />
        )}
        {state.isLoadingHistory && <div className="text-center text-xs text-slate-500 py-2">Loading older messages...</div>}
        <div className="flex justify-center pb-3">
          <span className="px-3 py-1 bg-white text-slate-500 text-xs font-medium rounded-full shadow-sm">
            {state.currentChat?.session?.started_at
              ? new Date(state.currentChat.session.started_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
              : 'Today'}
          </span>
        </div>
        {state.messages
          .slice(visibleWindow.startIndex, visibleWindow.endIndex)
          .map((message, visibleIdx) => {
          const idx = visibleWindow.startIndex + visibleIdx;
          const prev = state.messages[idx - 1];
          const next = state.messages[idx + 1];
          const showSender = !prev || prev.direction !== message.direction || prev.sender_role !== message.sender_role;
          const showAvatar = !next || next.direction !== message.direction || next.sender_role !== message.sender_role;
          const pending = !!(message.temp_id && state.pendingMessages.has(message.temp_id));
          const failed = !!(message.temp_id && state.failedMessages.has(message.temp_id));
          return (
            <MessageBubble
              key={message.id || message.temp_id}
              message={message}
              elementId={message.id ? `message-${message.id}` : undefined}
              isPending={pending}
              isFailed={failed}
              senderLabel={getSenderLabel(message, state.currentChat?.display_name)}
              showSender={showSender}
              showAvatar={showAvatar}
              incomingAvatar={state.currentChat?.picture_url}
              onRetry={retryMessage}
            />
          );
        })}
        {virtualEnabled && (
          <div
            aria-hidden
            style={{ height: `${visibleWindow.bottomPadding}px` }}
          />
        )}
        <TypingIndicator visible={typingUsersCount > 0} />
        <div ref={messagesEndRef} />
      </div>
      <MessageInput
        inputText={state.inputText}
        sending={state.sending}
        isHumanMode={isHumanMode}
        showCannedPicker={state.showCannedPicker}
        soundEnabled={state.soundEnabled}
        onInputChange={setInputText}
        onSend={() => sendMessage(state.inputText)}
        onSendFile={sendMedia}
        onToggleCannedPicker={() => setShowCannedPicker(!state.showCannedPicker)}
        onSelectCanned={(content) => setInputText(content)}
        onCloseCanned={() => setShowCannedPicker(false)}
        onToggleSound={() => setSoundEnabled(!state.soundEnabled)}
        onTyping={() => {
          if (state.selectedId && wsStatus === 'connected') startTyping(state.selectedId);
        }}
      />
    </main>
  );
}
