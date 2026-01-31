'use client';

import React from 'react';
import { Bot, User, Zap } from 'lucide-react';

interface ChatModeToggleProps {
  currentMode: 'BOT' | 'HUMAN';
  onToggle: (newMode: 'BOT' | 'HUMAN') => void;
  disabled?: boolean;
}

export const ChatModeToggle: React.FC<ChatModeToggleProps> = ({
  currentMode,
  onToggle,
  disabled = false,
}) => {
  const isHuman = currentMode === 'HUMAN';

  const handleToggle = () => {
    if (!disabled) {
      onToggle(isHuman ? 'BOT' : 'HUMAN');
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={disabled}
      className={`relative h-7 bg-slate-100 rounded-full flex items-center cursor-pointer transition-all duration-200 border border-slate-200 group ${disabled ? 'opacity-60 cursor-not-allowed' : 'hover:border-slate-300'}`}
      type="button"
    >
      {/* Sliding Background */}
      <div
        className={`absolute top-[2px] bottom-[2px] w-[calc(50%-2px)] rounded-full transition-all duration-200 ${isHuman
          ? 'left-[calc(50%)] bg-indigo-600'
          : 'left-[2px] bg-white border border-slate-200'
          }`}
      />

      {/* Bot Option */}
      <div className={`relative z-10 flex-1 flex items-center justify-center gap-1 px-2.5 min-w-[52px] transition-colors duration-200 ${!isHuman ? 'text-slate-700' : 'text-slate-400'}`}>
        <Bot className={`w-3.5 h-3.5 ${!isHuman ? 'text-blue-500' : 'text-slate-400'}`} />
        <span className="text-[10px] font-semibold">Auto</span>
      </div>

      {/* Human Option */}
      <div className={`relative z-10 flex-1 flex items-center justify-center gap-1 px-2.5 min-w-[52px] transition-colors duration-200 ${isHuman ? 'text-white' : 'text-slate-400'}`}>
        <User className={`w-3.5 h-3.5 ${isHuman ? 'text-white' : 'text-slate-400'}`} />
        <span className="text-[10px] font-semibold">Manual</span>
      </div>
    </button>
  );
};
