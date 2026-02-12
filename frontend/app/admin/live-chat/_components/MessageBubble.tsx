'use client';

import React, { memo } from 'react';
import { AlertCircle, Bot, FileText, RefreshCw, User } from 'lucide-react';

import type { Message } from '@/lib/websocket/types';

interface MessageBubbleProps {
  message: Message;
  elementId?: string;
  isPending: boolean;
  isFailed: boolean;
  senderLabel: string;
  showSender: boolean;
  showAvatar: boolean;
  incomingAvatar?: string;
  onRetry?: (tempId: string) => void;
}

function getMessageText(message: Message): React.ReactNode {
  if (message.message_type === 'flex') return 'Rich Content';
  try {
    if (message.content.startsWith('{') || message.content.startsWith('[')) {
      const parsed = JSON.parse(message.content);
      return parsed.responses || parsed.Responses || parsed.response || parsed.text || message.content;
    }
  } catch {
    return message.content;
  }
  return message.content;
}

function renderMessageContent(message: Message): React.ReactNode {
  const payload = (message.payload || {}) as Record<string, unknown>;

  if (message.message_type === 'image') {
    const previewUrl = typeof payload.preview_url === 'string' ? payload.preview_url : '';
    const imageUrl = typeof payload.url === 'string' ? payload.url : previewUrl;
    if (imageUrl) {
      return (
        <a href={imageUrl} target="_blank" rel="noreferrer" className="block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt="Incoming image" className="max-h-64 rounded-xl object-cover" />
        </a>
      );
    }
    return <span>{message.content || '[Image]'}</span>;
  }

  if (message.message_type === 'sticker') {
    const packageId = typeof payload.package_id === 'string' ? payload.package_id : '';
    const stickerId = typeof payload.sticker_id === 'string' ? payload.sticker_id : '';
    return (
      <div className="text-xs">
        Sticker {packageId && stickerId ? `${packageId}/${stickerId}` : ''}
      </div>
    );
  }

  if (message.message_type === 'file') {
    const fileName = typeof payload.file_name === 'string' ? payload.file_name : message.content || 'File';
    const size = typeof payload.size === 'number' ? payload.size : null;
    const url = typeof payload.url === 'string' ? payload.url : '';
    return (
      <div className="flex items-center gap-2">
        <FileText className="w-4 h-4" />
        <div className="min-w-0">
          <div className="truncate">{fileName}</div>
          {size !== null && <div className="text-[11px] opacity-70">{Math.round(size / 1024)} KB</div>}
          {url && (
            <a href={url} target="_blank" rel="noreferrer" className="text-[11px] underline">
              Download
            </a>
          )}
        </div>
      </div>
    );
  }

  return getMessageText(message);
}

export const MessageBubble = memo(function MessageBubble({
  message,
  elementId,
  isPending,
  isFailed,
  senderLabel,
  showSender,
  showAvatar,
  incomingAvatar,
  onRetry,
}: MessageBubbleProps) {
  const incoming = message.direction === 'INCOMING';
  const bubbleClass = incoming
    ? 'bg-white text-slate-700 rounded-bl-md border border-slate-100'
    : message.sender_role === 'BOT'
      ? 'bg-chat-bot text-slate-700 rounded-br-md'
      : 'bg-chat-admin text-white rounded-br-md';

  return (
    <div id={elementId} className={`flex items-end gap-2 ${incoming ? 'justify-start' : 'justify-end'}`}>
      {incoming && (showAvatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={incomingAvatar} className="w-8 h-8 rounded-full object-cover flex-shrink-0" alt="" />
      ) : <div className="w-8 flex-shrink-0" />)}
      <div className="max-w-[60%]">
        {showSender && (
          <p className={`text-[10px] mb-1 px-1 ${incoming ? 'text-slate-500' : message.sender_role === 'BOT' ? 'text-slate-400 text-right' : 'text-indigo-600 text-right'}`}>
            {senderLabel} • {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
        <div className={`px-4 py-2.5 text-sm leading-relaxed rounded-2xl ${bubbleClass}`}>
          {renderMessageContent(message)}
        </div>
        {!incoming && message.temp_id && (
          <div className="mt-1 flex items-center justify-end gap-1 text-xs">
            {isPending && <RefreshCw className="w-3.5 h-3.5 text-indigo-400 animate-spin" />}
            {isFailed && (
              <>
                <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                <button
                  onClick={() => message.temp_id && onRetry?.(message.temp_id)}
                  className="text-[10px] text-indigo-600 hover:underline"
                  aria-label="Retry message"
                >
                  Retry
                </button>
              </>
            )}
          </div>
        )}
      </div>
      {!incoming && (showAvatar ? (
        message.sender_role === 'BOT' ? (
          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-blue-400 to-cyan-500 shadow-md">
            <Bot className="w-4 h-4 text-white" />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-indigo-500 to-green-500 shadow-md">
            <User className="w-4 h-4 text-white" />
          </div>
        )
      ) : <div className="w-8 flex-shrink-0" />)}
    </div>
  );
});
