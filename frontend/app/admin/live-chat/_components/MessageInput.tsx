'use client';

import React, { useRef } from 'react';
import { Bot, MessageSquareText, Paperclip, Send, Smile, Volume2, VolumeX } from 'lucide-react';

import { CannedResponsePicker } from '@/components/admin/CannedResponsePicker';

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
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <footer className="bg-white/80 backdrop-blur-xl border-t border-slate-100/60 p-3 relative thai-text">
      {!isHumanMode && (
        <div className="absolute -top-8 left-0 right-0 flex justify-center pointer-events-none">
          <span className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-semibold rounded-full border border-blue-100 flex items-center gap-1.5 thai-no-break">
            <Bot className="w-3.5 h-3.5" />Bot is handling
          </span>
        </div>
      )}
      <CannedResponsePicker
        isOpen={showCannedPicker}
        onClose={onCloseCanned}
        onSelect={onSelectCanned}
        inputText={inputText}
      />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSend();
        }}
        className={`flex gap-2 ${!isHumanMode ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <div className="flex-1 flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2 border border-slate-200 focus-within:border-primary/30 focus-within:bg-white transition-all">
          <button type="button" onClick={onToggleCannedPicker} className="p-1.5 text-slate-400 hover:text-primary focus-ring rounded-lg" aria-label="Open canned responses">
            <MessageSquareText className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={!isHumanMode || sending}
            className="p-1.5 text-slate-400 hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed focus-ring rounded-lg"
            aria-label="Attach file"
          >
            <Paperclip className="w-5 h-5" />
          </button>
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
          <input
            id="chat-input"
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => {
              onInputChange(e.target.value);
              onTyping();
            }}
            disabled={!isHumanMode || sending}
            placeholder="Type / for quick replies..."
            className="flex-1 bg-transparent outline-none text-sm text-slate-700 placeholder:text-slate-400 thai-no-break"
          />
          <button type="button" onClick={onToggleSound} className="p-1.5 text-slate-400 hover:text-primary focus-ring rounded-lg" aria-label={soundEnabled ? 'Mute notifications' : 'Unmute notifications'}>
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
          <button type="button" className="p-1.5 text-slate-400 hover:text-orange-500 focus-ring rounded-lg" aria-label="Emoji picker">
            <Smile className="w-5 h-5" />
          </button>
        </div>
        <button
          type="submit"
          disabled={!inputText.trim() || sending || !isHumanMode}
          className={`p-3 rounded-xl transition-all ${inputText.trim() && isHumanMode ? 'bg-gradient-to-br from-primary to-primary-dark text-white hover:shadow-lg active:scale-[0.97]' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
          aria-label="Send message"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </footer>
  );
}
