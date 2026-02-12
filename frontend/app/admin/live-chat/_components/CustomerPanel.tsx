'use client';

import React from 'react';
import { Bell, Copy, ExternalLink, RefreshCw, Star, Trash2, X } from 'lucide-react';

import type { CurrentChat } from '../_types';
import { useAuth } from '@/contexts/AuthContext';
import { useLiveChatContext } from '../_context/LiveChatContext';

export function CustomerPanel({
  currentChat,
  onClose,
}: {
  currentChat: CurrentChat | null;
  onClose: () => void;
}) {
  const { token } = useAuth();
  const { fetchChatDetail, fetchConversations } = useLiveChatContext();
  const [refreshing, setRefreshing] = React.useState(false);
  if (!currentChat) return null;
  const encodedLineUserId = encodeURIComponent(currentChat.line_user_id);
  const exportCsvUrl = `/api/v1/admin/export/conversations/${encodedLineUserId}/csv`;
  const exportPdfUrl = `/api/v1/admin/export/conversations/${encodedLineUserId}/pdf`;

  const downloadExport = async (url: string, fallbackName: string) => {
    try {
      const response = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) {
        throw new Error(`Export failed: ${response.status}`);
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const disposition = response.headers.get('content-disposition') || '';
      const match = disposition.match(/filename="([^"]+)"/);
      const filename = match?.[1] || fallbackName;

      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      console.error(error);
    }
  };

  const refreshProfile = async () => {
    setRefreshing(true);
    try {
      const response = await fetch(`/api/v1/admin/live-chat/conversations/${encodedLineUserId}/refresh-profile`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) {
        throw new Error(`Refresh failed: ${response.status}`);
      }
      await Promise.all([
        fetchChatDetail(currentChat.line_user_id),
        fetchConversations(),
      ]);
    } catch (error) {
      console.error(error);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <aside className="w-64 bg-white border-l border-slate-100/60 flex flex-col flex-shrink-0 z-20 thai-text">
      <div className="h-14 px-4 border-b border-slate-100/60 flex items-center justify-between bg-slate-50/50">
        <span className="font-semibold text-slate-700 text-[11px] tracking-[0.1em]">Customer Info</span>
        <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600" aria-label="Close customer panel">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="p-5 border-b border-slate-100/60 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={currentChat.picture_url} className="w-16 h-16 rounded-full object-cover mx-auto mb-3 ring-4 ring-slate-100/60" alt={currentChat.display_name} />
        <p className="font-semibold text-slate-800 text-sm">{currentChat.display_name}</p>
        <button className="text-xs text-primary hover:underline flex items-center gap-1 mx-auto mt-1">
          View Profile <ExternalLink className="w-3 h-3" />
        </button>
        <button
          onClick={refreshProfile}
          disabled={refreshing}
          className="text-xs text-slate-600 hover:text-primary flex items-center gap-1 mx-auto mt-2 disabled:opacity-60"
        >
          <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh Profile'}
        </button>
        <div className="flex justify-center gap-2 mt-4">
          {[Copy, Bell, Star].map((Icon, i) => (
            <button key={i} className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all" aria-label="Customer quick action">
              <Icon className="w-4 h-4 text-slate-400" />
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3 chat-scrollbar">
        <div className="bg-slate-50 rounded-xl p-3">
          <p className="text-[10px] text-slate-400 font-semibold mb-1.5">LINE ID</p>
          <p className="text-xs text-slate-600 font-mono truncate">{currentChat.line_user_id}</p>
        </div>
        <div className="bg-slate-50 rounded-xl p-3 flex justify-between items-center">
          <span className="text-xs text-slate-500">Session Status</span>
          <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${currentChat.session?.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-600' : currentChat.session?.status === 'WAITING' ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-600'}`}>
            {currentChat.session?.status || 'None'}
          </span>
        </div>
        <div className="bg-slate-50 rounded-xl p-3 space-y-2">
          <p className="text-[10px] text-slate-400 font-semibold">Export</p>
          <div className="flex gap-2">
            <button
              onClick={() => downloadExport(exportCsvUrl, `${currentChat.line_user_id}.csv`)}
              className="flex-1 text-center text-xs px-2 py-2 rounded-lg border border-slate-200 hover:bg-white text-slate-600"
            >
              Download CSV
            </button>
            <button
              onClick={() => downloadExport(exportPdfUrl, `${currentChat.line_user_id}.pdf`)}
              className="flex-1 text-center text-xs px-2 py-2 rounded-lg border border-slate-200 hover:bg-white text-slate-600"
            >
              Download PDF
            </button>
          </div>
        </div>
      </div>
      <div className="p-4 border-t border-slate-100/60">
        <button className="w-full py-2.5 text-xs font-medium text-slate-500 hover:text-danger hover:bg-danger/8 rounded-xl border border-slate-200 hover:border-danger/20 flex items-center justify-center gap-1.5 transition-all">
          <Trash2 className="w-4 h-4" />Delete Conversation
        </button>
      </div>
    </aside>
  );
}
