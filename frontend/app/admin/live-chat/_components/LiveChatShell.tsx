'use client';

import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

import { useLiveChatContext } from '../_context/LiveChatContext';
import { ChatArea } from './ChatArea';
import { ConversationList } from './ConversationList';
import { CustomerPanel } from './CustomerPanel';
import { TransferDialog } from './TransferDialog';

export function LiveChatShell() {
  const {
    state,
    isMobileView,
    fetchConversations,
    setShowTransferDialog,
    transferSession,
    setShowCustomerPanel,
  } = useLiveChatContext();

  return (
    <>
      {!state.backendOnline && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60]">
          <div className="bg-gradient-to-br from-danger to-red-600 text-white px-4 py-2 rounded-full shadow-xl flex items-center gap-2 text-sm font-medium thai-text">
            <AlertCircle className="w-4 h-4" />
            <span className="thai-no-break">Connection Lost</span>
            <button onClick={fetchConversations} className="ml-2 p-1 hover:bg-white/20 rounded-full focus-ring" aria-label="Retry loading conversations">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
      <div className="flex h-screen w-full bg-slate-100 overflow-hidden font-sans">
        {(!isMobileView || !state.selectedId) && <ConversationList />}
        {(!isMobileView || state.selectedId) && <ChatArea />}
        {state.selectedId && state.showCustomerPanel && (
          <div
            className={isMobileView ? 'fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm' : ''}
            onClick={isMobileView ? () => setShowCustomerPanel(false) : undefined}
          >
            <div
              className={isMobileView ? 'absolute right-0 top-0 h-full w-[88%] max-w-sm' : 'h-full'}
              onClick={isMobileView ? (e) => e.stopPropagation() : undefined}
            >
              <CustomerPanel currentChat={state.currentChat} onClose={() => setShowCustomerPanel(false)} />
            </div>
          </div>
        )}
        <TransferDialog
          open={state.showTransferDialog}
          onClose={() => setShowTransferDialog(false)}
          onTransfer={transferSession}
        />
      </div>
    </>
  );
}
