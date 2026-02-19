'use client';

import React, { useEffect } from 'react';
import { Eye, Pin, CheckCheck, Flag, Trash2, MessageCircle } from 'lucide-react';

interface ConversationActionMenuProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  onAction: (action: 'preview' | 'follow-up' | 'pin' | 'mark-read' | 'spam' | 'delete', userId: string) => void;
}

export const ConversationActionMenu: React.FC<ConversationActionMenuProps> = ({
  userId,
  isOpen,
  onClose,
  onAction,
}) => {
  // Close menu on outside click or Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-action-menu]')) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      data-action-menu
      role="menu"
      aria-label="Conversation actions"
      className="absolute right-0 top-8 w-56 bg-white rounded-lg shadow-xl border border-slate-100 z-50 py-1 animate-in fade-in zoom-in-95 duration-100"
    >
      <button
        role="menuitem"
        onClick={() => onAction('preview', userId)}
        className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2"
        aria-label="Preview incoming messages"
      >
        <Eye className="w-4 h-4" /> Preview Messages
      </button>

      <button
        role="menuitem"
        onClick={() => onAction('follow-up', userId)}
        className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2"
        aria-label="Mark for follow-up"
      >
        <MessageCircle className="w-4 h-4" /> Follow Up
      </button>

      <button
        role="menuitem"
        onClick={() => onAction('pin', userId)}
        className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2"
        aria-label="Pin conversation"
      >
        <Pin className="w-4 h-4" /> Pin
      </button>

      <button
        role="menuitem"
        onClick={() => onAction('mark-read', userId)}
        className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2"
        aria-label="Mark all as read"
      >
        <CheckCheck className="w-4 h-4" /> Mark as Read
      </button>

      <div className="border-t border-slate-100 my-1" />

      <button
        role="menuitem"
        onClick={() => onAction('spam', userId)}
        className="w-full text-left px-4 py-2 text-sm text-orange-600 hover:bg-orange-50 flex items-center gap-2"
        aria-label="Mark as spam"
      >
        <Flag className="w-4 h-4" /> Mark as Spam
      </button>

      <button
        role="menuitem"
        onClick={() => onAction('delete', userId)}
        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
        aria-label="Delete conversation"
      >
        <Trash2 className="w-4 h-4" /> Delete
      </button>
    </div>
  );
};
