'use client';

import React, { useRef } from 'react';
import { Bot, Image, MessageSquareText, Maximize2, Minimize2, Paperclip, Send, Smile, Sticker, Volume2, VolumeX, Zap } from 'lucide-react';

import { CannedResponsePicker } from '@/components/admin/CannedResponsePicker';
import { useLiveChatStore } from '../_store/liveChatStore';
import { EmojiPicker } from './EmojiPicker';
import { StickerPicker } from './StickerPicker';
import { QuickReplies } from './QuickReplies';

interface MessageInputProps {
  inputText: string;
  sending: boolean;
  isHumanMode: boolean;
  showCannedPicker: boolean;
  soundEnabled: boolean;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onSendFile: (file: File) => void;
  onToggleCannedPicker: () => void;
  onSelectCanned: (content: string) => void;
  onCloseCanned: () => void;
  onToggleSound: () => void;
  onTyping: () => void;
}

export function MessageInput({
  inputText,
  sending,
  isHumanMode,
  showCannedPicker,
  soundEnabled,
  onInputChange,
  onSend,
  onSendFile,
  onToggleCannedPicker,
  onSelectCanned,
  onCloseCanned,
  onToggleSound,
  onTyping,
}: MessageInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // UI extension state from Zustand
  const showEmojiPicker = useLiveChatStore((s) => s.showEmojiPicker);
  const showStickerPicker = useLiveChatStore((s) => s.showStickerPicker);
  const showQuickReplies = useLiveChatStore((s) => s.showQuickReplies);
  const inputExpanded = useLiveChatStore((s) => s.inputExpanded);
  const toggleEmojiPicker = useLiveChatStore((s) => s.toggleEmojiPicker);
  const toggleStickerPicker = useLiveChatStore((s) => s.toggleStickerPicker);
  const toggleQuickReplies = useLiveChatStore((s) => s.toggleQuickReplies);
  const toggleInputExpanded = useLiveChatStore((s) => s.toggleInputExpanded);
  const closeAllPickers = useLiveChatStore((s) => s.closeAllPickers);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    onInputChange(inputText + emoji);
    closeAllPickers();
    textareaRef.current?.focus();
  };

  const handleQuickReplySelect = (message: string) => {
    onInputChange(message);
    closeAllPickers();
    textareaRef.current?.focus();
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const btnClass = (active: boolean) =>
    `p-1.5 rounded-lg transition-colors ${active ? 'bg-brand-500/10 text-brand-600' : 'text-text-tertiary hover:text-text-primary hover:bg-gray-100'}`;

  return (
    <footer className="bg-surface border-t border-border-default relative thai-text">
      {/* Bot mode indicator */}
      {!isHumanMode && (
        <div className="absolute -top-8 left-0 right-0 flex justify-center pointer-events-none">
          <span className="px-3 py-1 bg-info/10 text-info text-xs font-semibold rounded-full border border-info/20 flex items-center gap-1.5 thai-no-break">
            <Bot className="w-3.5 h-3.5" />Bot is handling
          </span>
        </div>
      )}

      {/* Canned responses picker */}
      <CannedResponsePicker
        isOpen={showCannedPicker}
        onClose={onCloseCanned}
        onSelect={onSelectCanned}
        inputText={inputText}
      />

      {/* Quick replies bar */}
      {showQuickReplies && <QuickReplies onSelect={handleQuickReplySelect} />}

      {/* Emoji picker */}
      {showEmojiPicker && <EmojiPicker onSelect={handleEmojiSelect} />}

      {/* Sticker picker */}
      {showStickerPicker && <StickerPicker onSelect={(url) => { onInputChange(`[sticker:${url}]`); closeAllPickers(); }} />}

      {/* Toolbar */}
      <div className={`flex items-center gap-0.5 px-3 py-1.5 border-b border-border-subtle ${!isHumanMode ? 'opacity-50 pointer-events-none' : ''}`}>
        <button type="button" onClick={toggleEmojiPicker} className={btnClass(showEmojiPicker)} aria-label="Emoji">
          <Smile className="w-4 h-4" />
        </button>
        <button type="button" onClick={toggleStickerPicker} className={btnClass(showStickerPicker)} aria-label="Sticker">
          <Sticker className="w-4 h-4" />
        </button>
        <button type="button" onClick={openFilePicker} className={btnClass(false)} aria-label="Image">
          <Image className="w-4 h-4" />
        </button>
        <button type="button" onClick={openFilePicker} className={btnClass(false)} aria-label="File">
          <Paperclip className="w-4 h-4" />
        </button>
        <button type="button" onClick={toggleQuickReplies} className={btnClass(showQuickReplies)} aria-label="Quick replies">
          <Zap className="w-4 h-4" />
        </button>
        <button type="button" onClick={toggleInputExpanded} className={btnClass(inputExpanded)} aria-label="Expand">
          {inputExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
        <div className="flex-1" />
        <button type="button" onClick={onToggleCannedPicker} className="p-1.5 text-text-tertiary hover:text-brand-600 rounded-lg transition-colors" aria-label="Canned responses">
          <MessageSquareText className="w-4 h-4" />
        </button>
        <button type="button" onClick={onToggleSound} className="p-1.5 text-text-tertiary hover:text-text-primary rounded-lg transition-colors" aria-label={soundEnabled ? 'Mute' : 'Unmute'}>
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>
      </div>

      {/* Input area */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSend();
        }}
        className={`flex gap-2 p-3 ${!isHumanMode ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onSendFile(file);
            e.currentTarget.value = '';
          }}
        />
        <label htmlFor="chat-input" className="sr-only">Message</label>
        <textarea
          id="chat-input"
          ref={textareaRef}
          value={inputText}
          onChange={(e) => {
            onInputChange(e.target.value);
            onTyping();
          }}
          onKeyDown={handleKeyDown}
          disabled={!isHumanMode || sending}
          placeholder="Type / for quick replies..."
          rows={inputExpanded ? 4 : 1}
          className="flex-1 bg-gray-50 border border-border-default rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500/30 resize-none transition-all thai-no-break"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || sending || !isHumanMode}
          className={`p-3 rounded-xl transition-all ${
            inputText.trim() && isHumanMode
              ? 'bg-brand-600 text-white hover:bg-brand-700 active:scale-[0.97]'
              : 'bg-gray-200 text-text-tertiary cursor-not-allowed'
          }`}
          aria-label="Send message"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </footer>
  );
}
