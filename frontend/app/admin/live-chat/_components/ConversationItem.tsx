'use client';

import React, { memo } from 'react';
import { MoreVertical } from 'lucide-react';

import type { Conversation } from '../_types';

interface ConversationItemProps {
  optionId: string;
  conversation: Conversation;
  selected: boolean;
  formattedTime?: string;
  onClick: () => void;
  onMenuClick: () => void;
}

export const ConversationItem = memo(function ConversationItem({
  optionId,
  conversation,
  selected,
  formattedTime,
  onClick,
  onMenuClick,
}: ConversationItemProps) {
  const isWaiting = conversation.session?.status === 'WAITING';
  const isActive = conversation.session?.status === 'ACTIVE';
  return (
    <div
      id={optionId}
      role="option"
      aria-selected={selected}
      className={`group relative flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all thai-text ${selected
        ? 'bg-primary/15 border border-primary/30'
        : 'hover:bg-white/5 border border-transparent'
        }`}
      onClick={onClick}
    >
      <div className="relative flex-shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={conversation.picture_url || `https://ui-avatars.com/api/?name=${conversation.display_name}&background=6366f1&color=fff&size=44`}
          className="w-11 h-11 rounded-full object-cover"
          alt={conversation.display_name}
        />
        <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#2B2840] ${isWaiting ? 'bg-orange-500' : isActive ? 'bg-emerald-500' : 'bg-slate-500'}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className={`font-semibold truncate text-sm ${selected ? 'text-white' : 'text-slate-200'}`}>
            {conversation.display_name}
          </span>
          <span className="text-[10px] text-slate-500 flex-shrink-0 thai-no-break">
            {formattedTime || ''}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 mt-1">
          <span className={`truncate text-xs thai-no-break ${selected ? 'text-primary-light/70' : 'text-slate-400'}`}>
            {conversation.last_message?.content || 'No messages yet'}
          </span>
          {conversation.unread_count > 0 && (
            <span className="min-w-[18px] h-[18px] px-1 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {conversation.unread_count > 9 ? '9+' : conversation.unread_count}
            </span>
          )}
        </div>
        {!!conversation.tags?.length && (
        <div className="mt-1.5 flex items-center gap-1 overflow-hidden">
            {conversation.tags.slice(0, 2).map((tag) => (
              <span
                key={tag.id}
                className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium text-white thai-no-break"
                style={{ backgroundColor: tag.color }}
              >
                {tag.name}
              </span>
            ))}
            {conversation.tags.length > 2 && (
              <span className="text-[10px] text-slate-500">+{conversation.tags.length - 2}</span>
            )}
          </div>
        )}
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onMenuClick();
        }}
        className="p-1.5 rounded-lg cursor-pointer text-slate-500 hover:text-white opacity-0 group-hover:opacity-100 focus-ring"
        aria-label={`Open actions for ${conversation.display_name}`}
      >
        <MoreVertical className="w-4 h-4" />
      </button>
    </div>
  );
});
