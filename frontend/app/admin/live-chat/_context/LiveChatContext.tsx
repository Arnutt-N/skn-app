'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import { useSearchParams } from 'next/navigation';

import { useAuth } from '@/contexts/AuthContext';
import { useLiveChatSocket } from '@/hooks/useLiveChatSocket';
import { useNotificationSound } from '@/hooks/useNotificationSound';
import type {
  ConnectionState,
  ConversationUpdatePayload,
  Message,
  SessionTransferredPayload,
} from '@/lib/websocket/types';
import { useChatReducer } from '../_hooks/useChatReducer';
import type { Conversation, CurrentChat, Session } from '../_types';

interface LiveChatContextValue {
  state: ReturnType<typeof useChatReducer>[0];
  wsStatus: ConnectionState;
  isMobileView: boolean;
  typingUsersCount: number;
  focusedMessageId: number | null;
  isHumanMode: boolean;
  selectedConversation: Conversation | null;
  setSearchQuery: (value: string) => void;
  setFilterStatus: (value: string | null) => void;
  setInputText: (value: string) => void;
  setShowCustomerPanel: (value: boolean) => void;
  setActiveActionMenu: (value: string | null) => void;
  setShowTransferDialog: (value: boolean) => void;
  setShowCannedPicker: (value: boolean) => void;
  setSoundEnabled: (value: boolean) => void;
  selectConversation: (id: string | null) => void;
  jumpToMessage: (lineUserId: string, messageId: number) => void;
  clearFocusedMessage: () => void;
  fetchConversations: () => Promise<void>;
  fetchChatDetail: (id: string, includeMessages?: boolean) => Promise<void>;
  sendMessage: (text: string) => Promise<void>;
  sendMedia: (file: File) => Promise<void>;
  claimSession: () => Promise<void>;
  closeSession: () => Promise<void>;
  transferSession: (toOperatorId: number, reason?: string) => Promise<void>;
  toggleMode: (mode: 'BOT' | 'HUMAN') => Promise<void>;
  loadOlderMessages: () => Promise<void>;
  reconnect: () => void;
  retryMessage: (tempId: string) => void;
  startTyping: (lineUserId: string) => void;
  formatTime: (value: string) => string;
}

const LiveChatContext = createContext<LiveChatContextValue | undefined>(undefined);
const API_BASE = '/api/v1';

export function LiveChatProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useChatReducer();
  const { user, token } = useAuth();
  const searchParams = useSearchParams();
  const { playNotification, setEnabled } = useNotificationSound();

  const selectedIdRef = useRef<string | null>(null);
  const messagesRef = useRef<Message[]>([]);
  const wsStatusRef = useRef<ConnectionState>('disconnected');
  const firstLoadRef = useRef<boolean>(true);
  const initializedRef = useRef<boolean>(false);
  const typingUsersRef = useRef<Set<string>>(new Set());
  const [wsStatus, setWsStatus] = React.useState<ConnectionState>('disconnected');
  const [isMobileView, setIsMobileView] = React.useState(false);
  const [typingUsersCount, setTypingUsersCount] = React.useState(0);
  const [focusedMessageId, setFocusedMessageId] = React.useState<number | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(max-width: 767px)');
    const update = () => setIsMobileView(mediaQuery.matches);
    update();
    mediaQuery.addEventListener('change', update);
    return () => mediaQuery.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    selectedIdRef.current = state.selectedId;
    messagesRef.current = state.messages;
  }, [state.selectedId, state.messages]);

  useEffect(() => {
    wsStatusRef.current = wsStatus;
  }, [wsStatus]);

  const setSearchQuery = useCallback((value: string) => {
    dispatch({ type: 'SET_SEARCH', payload: value });
  }, [dispatch]);

  const setFilterStatus = useCallback((value: string | null) => {
    dispatch({ type: 'SET_FILTER', payload: value });
  }, [dispatch]);

  const setInputText = useCallback((value: string) => {
    dispatch({ type: 'SET_INPUT', payload: value });
    if (value === '/') {
      dispatch({ type: 'SET_SHOW_CANNED_PICKER', payload: true });
    } else if (!value.startsWith('/')) {
      dispatch({ type: 'SET_SHOW_CANNED_PICKER', payload: false });
    }
  }, [dispatch]);

  const setShowCustomerPanel = useCallback((value: boolean) => {
    dispatch({ type: 'SET_SHOW_CUSTOMER_PANEL', payload: value });
  }, [dispatch]);

  const setActiveActionMenu = useCallback((value: string | null) => {
    dispatch({ type: 'SET_ACTIVE_ACTION_MENU', payload: value });
  }, [dispatch]);

  const setShowTransferDialog = useCallback((value: boolean) => {
    dispatch({ type: 'SET_SHOW_TRANSFER_DIALOG', payload: value });
  }, [dispatch]);

  const setShowCannedPicker = useCallback((value: boolean) => {
    dispatch({ type: 'SET_SHOW_CANNED_PICKER', payload: value });
  }, [dispatch]);

  const setSoundEnabled = useCallback((value: boolean) => {
    dispatch({ type: 'SET_SOUND_ENABLED', payload: value });
    setEnabled(value);
  }, [dispatch, setEnabled]);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/live-chat/conversations${state.filterStatus ? `?status=${state.filterStatus}` : ''}`);
      if (res.ok) {
        const data = await res.json();
        dispatch({ type: 'SET_CONVERSATIONS', payload: data.conversations || data || [] });
        dispatch({ type: 'SET_BACKEND_ONLINE', payload: true });
      } else {
        dispatch({ type: 'SET_BACKEND_ONLINE', payload: false });
      }
    } catch {
      dispatch({ type: 'SET_BACKEND_ONLINE', payload: false });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [dispatch, state.filterStatus]);

  const fetchChatDetail = useCallback(async (id: string, includeMessages = true) => {
    try {
      const res = await fetch(`${API_BASE}/admin/live-chat/conversations/${id}`);
      if (!res.ok) return;
      const data = (await res.json()) as CurrentChat;
      if (selectedIdRef.current !== id) return;
      dispatch({ type: 'SET_CURRENT_CHAT', payload: data });
      if (includeMessages) {
        const nextMessages = data.messages || [];
        dispatch({ type: 'SET_MESSAGES', payload: nextMessages });
        dispatch({ type: 'SET_HAS_MORE_HISTORY', payload: nextMessages.length >= 50 });
      }
      dispatch({ type: 'SET_BACKEND_ONLINE', payload: true });
    } catch {
      dispatch({ type: 'SET_BACKEND_ONLINE', payload: false });
    }
  }, [dispatch]);

  const fetchMessagesPage = useCallback(async (id: string, beforeId?: number) => {
    const query = new URLSearchParams();
    query.set('limit', '50');
    if (beforeId) query.set('before_id', String(beforeId));
    const res = await fetch(`${API_BASE}/admin/live-chat/conversations/${id}/messages?${query.toString()}`);
    if (!res.ok) throw new Error('failed to load messages');
    return res.json() as Promise<{ messages: Message[]; has_more: boolean }>;
  }, []);

  const handleMessageAck = useCallback((tempId: string) => {
    dispatch({ type: 'REMOVE_PENDING', payload: tempId });
    dispatch({ type: 'CLEAR_FAILED', payload: tempId });
  }, [dispatch]);

  const handleNewMessage = useCallback((message: Message) => {
    if (message.direction === 'INCOMING') playNotification();
    if (message.line_user_id !== selectedIdRef.current) return;
    const exists = messagesRef.current.some((m) => m.id === message.id || (message.temp_id && m.temp_id === message.temp_id));
    if (exists) {
      const next = messagesRef.current.map((m) => ((m.temp_id && m.temp_id === message.temp_id) ? message : m));
      dispatch({ type: 'SET_MESSAGES', payload: next });
      return;
    }
    dispatch({ type: 'ADD_MESSAGE', payload: message });
  }, [dispatch, playNotification]);

  const handleMessageSent = useCallback((message: Message) => {
    handleNewMessage(message);
    if (message.temp_id) handleMessageAck(message.temp_id);
    dispatch({ type: 'SET_SENDING', payload: false });
    dispatch({ type: 'SET_INPUT', payload: '' });
  }, [dispatch, handleMessageAck, handleNewMessage]);

  const handleConversationUpdate = useCallback((data: ConversationUpdatePayload) => {
    const currentSelectedId = selectedIdRef.current;
    const isSelected = currentSelectedId === data.line_user_id;
    const list = [...state.conversations];
    const idx = list.findIndex((c) => c.line_user_id === data.line_user_id);
    const existingTags = idx >= 0 ? (list[idx]?.tags || []) : [];
    let unread = 0;
    if (typeof data.unread_count === 'number') {
      unread = data.unread_count;
    } else if (!isSelected) {
      unread = idx === -1 ? 1 : (list[idx]?.unread_count || 0) + 1;
    }
    const updated: Conversation = {
      line_user_id: data.line_user_id,
      display_name: data.display_name,
      picture_url: data.picture_url || '',
      friend_status: 'ACTIVE',
      chat_mode: data.chat_mode,
      session: (data.session ?? undefined) as Session | undefined,
      last_message: data.last_message,
      unread_count: unread,
      tags: data.tags || existingTags,
    };
    if (idx === -1) {
      dispatch({ type: 'SET_CONVERSATIONS', payload: [updated, ...list] });
    } else {
      list.splice(idx, 1);
      dispatch({ type: 'SET_CONVERSATIONS', payload: [updated, ...list] });
    }
    if (isSelected) {
      dispatch({ type: 'SET_CURRENT_CHAT', payload: data as CurrentChat });
      if (data.messages) {
        dispatch({ type: 'SET_MESSAGES', payload: data.messages });
      }
    }
  }, [dispatch, state.conversations]);

  const handleSessionTransferred = useCallback((payload: SessionTransferredPayload) => {
    if (state.currentChat?.line_user_id !== payload.line_user_id) return;
        dispatch({
          type: 'SET_CURRENT_CHAT',
          payload: {
            ...state.currentChat,
            session: state.currentChat.session
              ? { ...state.currentChat.session, operator_id: payload.to_operator_id }
              : undefined,
          },
        });
    fetchConversations();
  }, [dispatch, fetchConversations, state.currentChat]);

  const adminId = user?.id || '1';
  const {
    joinRoom,
    leaveRoom,
    sendMessage: wsSendMessage,
    startTyping,
    claimSession: wsClaimSession,
    closeSession: wsCloseSession,
    transferSession: wsTransferSession,
    reconnect,
    retryMessage,
  } = useLiveChatSocket({
    adminId,
    token: token ?? undefined,
    onNewMessage: handleNewMessage,
    onMessageSent: handleMessageSent,
    onMessageAck: (tempId) => handleMessageAck(tempId),
    onMessageFailed: (tempId, error) => {
      dispatch({ type: 'REMOVE_PENDING', payload: tempId });
      dispatch({ type: 'SET_FAILED', payload: { tempId, error } });
      dispatch({ type: 'SET_SENDING', payload: false });
    },
    onTyping: (_lineUserId, admin, isTyping) => {
      const next = new Set(typingUsersRef.current);
      if (isTyping) next.add(admin);
      else next.delete(admin);
      typingUsersRef.current = next;
      setTypingUsersCount(next.size);
    },
    onSessionClaimed: (lineUserId, operatorId) => {
      if (state.currentChat?.line_user_id === lineUserId) {
        dispatch({
          type: 'SET_CURRENT_CHAT',
          payload: {
            ...state.currentChat,
            session: state.currentChat.session
              ? { ...state.currentChat.session, status: 'ACTIVE', operator_id: operatorId }
              : undefined,
          },
        });
      }
      fetchConversations();
    },
    onSessionClosed: (lineUserId) => {
      if (state.currentChat?.line_user_id === lineUserId) {
        dispatch({
          type: 'SET_CURRENT_CHAT',
          payload: { ...state.currentChat, chat_mode: 'BOT', session: undefined },
        });
      }
      fetchConversations();
    },
    onSessionTransferred: handleSessionTransferred,
    onConversationUpdate: handleConversationUpdate,
    onConnectionChange: (status) => {
      setWsStatus(status);
      if (status === 'connected') dispatch({ type: 'SET_BACKEND_ONLINE', payload: true });
    },
  });

  const selectConversation = useCallback((id: string | null) => {
    dispatch({ type: 'SELECT_CHAT', payload: id });
    if (id) {
      window.history.replaceState(null, '', `/admin/live-chat?chat=${id}`);
      const next = state.conversations.map((c) => (
        c.line_user_id === id ? { ...c, unread_count: 0 } : c
      ));
      dispatch({ type: 'SET_CONVERSATIONS', payload: next });
    } else {
      window.history.replaceState(null, '', '/admin/live-chat');
      dispatch({ type: 'SET_CURRENT_CHAT', payload: null });
      dispatch({ type: 'SET_MESSAGES', payload: [] });
    }
  }, [dispatch, state.conversations]);

  const jumpToMessage = useCallback((lineUserId: string, messageId: number) => {
    setFocusedMessageId(messageId);
    selectConversation(lineUserId);
  }, [selectConversation]);

  const clearFocusedMessage = useCallback(() => {
    setFocusedMessageId(null);
  }, []);

  useEffect(() => {
    if (!initializedRef.current) {
      const chatId = searchParams.get('chat');
      if (chatId) dispatch({ type: 'SELECT_CHAT', payload: chatId });
      initializedRef.current = true;
    }
  }, [dispatch, searchParams]);

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(() => {
      if (wsStatusRef.current !== 'connected') fetchConversations();
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchConversations]);

  useEffect(() => {
    if (!state.selectedId) return;
    dispatch({ type: 'SET_MESSAGES', payload: [] });
    firstLoadRef.current = true;
    fetchChatDetail(state.selectedId, false).then(async () => {
      const page = await fetchMessagesPage(state.selectedId!);
      if (selectedIdRef.current !== state.selectedId) return;
      dispatch({ type: 'SET_MESSAGES', payload: page.messages || [] });
      dispatch({ type: 'SET_HAS_MORE_HISTORY', payload: page.has_more });
    }).catch(() => undefined);
  }, [dispatch, fetchChatDetail, fetchMessagesPage, state.selectedId]);

  useEffect(() => {
    if (!state.selectedId || wsStatus !== 'connected') return;
    joinRoom(state.selectedId);
    return () => leaveRoom();
  }, [joinRoom, leaveRoom, state.selectedId, wsStatus]);

  useEffect(() => {
    if (!state.selectedId) return;
    const interval = setInterval(() => {
      if (wsStatusRef.current === 'connected') return;
      fetchChatDetail(state.selectedId!, false);
    }, 3000);
    return () => clearInterval(interval);
  }, [fetchChatDetail, state.selectedId]);

  const sendMessage = useCallback(async (text: string) => {
    if (!state.selectedId || !text.trim() || state.sending) return;
    dispatch({ type: 'SET_SENDING', payload: true });
    const tempId = `temp-${Date.now()}`;
    const optimistic: Message = {
      id: 0,
      line_user_id: state.selectedId,
      direction: 'OUTGOING',
      content: text,
      message_type: 'text',
      sender_role: 'ADMIN',
      operator_name: user?.display_name || 'Admin',
      created_at: new Date().toISOString(),
      temp_id: tempId,
    };
    dispatch({ type: 'ADD_MESSAGE', payload: optimistic });
    dispatch({ type: 'ADD_PENDING', payload: tempId });

    if (wsStatusRef.current === 'connected') {
      wsSendMessage(text, tempId);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/admin/live-chat/conversations/${state.selectedId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error('send failed');
      await fetchChatDetail(state.selectedId, true);
      await fetchConversations();
      handleMessageAck(tempId);
      dispatch({ type: 'SET_INPUT', payload: '' });
    } catch {
      dispatch({ type: 'SET_FAILED', payload: { tempId, error: 'Failed to send' } });
      dispatch({ type: 'REMOVE_PENDING', payload: tempId });
    } finally {
      dispatch({ type: 'SET_SENDING', payload: false });
    }
  }, [dispatch, fetchChatDetail, fetchConversations, handleMessageAck, state.selectedId, state.sending, user?.display_name, wsSendMessage]);

  const sendMedia = useCallback(async (file: File) => {
    if (!state.selectedId || state.sending) return;
    dispatch({ type: 'SET_SENDING', payload: true });
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API_BASE}/admin/live-chat/conversations/${state.selectedId}/media`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('media send failed');
      await fetchChatDetail(state.selectedId, true);
      await fetchConversations();
    } catch {
      dispatch({ type: 'SET_BACKEND_ONLINE', payload: false });
    } finally {
      dispatch({ type: 'SET_SENDING', payload: false });
    }
  }, [dispatch, fetchChatDetail, fetchConversations, state.selectedId, state.sending]);

  const claimSession = useCallback(async () => {
    if (!state.selectedId || state.claiming) return;
    dispatch({ type: 'SET_CLAIMING', payload: true });
    try {
      if (wsStatusRef.current === 'connected') {
        wsClaimSession();
      } else {
        const res = await fetch(`${API_BASE}/admin/live-chat/conversations/${state.selectedId}/claim`, { method: 'POST' });
        if (res.ok) await fetchChatDetail(state.selectedId, false);
      }
    } finally {
      dispatch({ type: 'SET_CLAIMING', payload: false });
    }
  }, [dispatch, fetchChatDetail, state.claiming, state.selectedId, wsClaimSession]);

  const closeSession = useCallback(async () => {
    if (!state.selectedId) return;
    if (wsStatusRef.current === 'connected') {
      wsCloseSession();
      return;
    }
    const res = await fetch(`${API_BASE}/admin/live-chat/conversations/${state.selectedId}/close`, { method: 'POST' });
    if (res.ok) await fetchChatDetail(state.selectedId, false);
  }, [fetchChatDetail, state.selectedId, wsCloseSession]);

  const transferSession = useCallback(async (toOperatorId: number, reason?: string) => {
    if (!state.selectedId) return;
    if (wsStatusRef.current === 'connected') {
      wsTransferSession(toOperatorId, reason);
      return;
    }
  }, [state.selectedId, wsTransferSession]);

  const toggleMode = useCallback(async (mode: 'BOT' | 'HUMAN') => {
    if (!state.selectedId) return;
    const res = await fetch(`${API_BASE}/admin/live-chat/conversations/${state.selectedId}/mode`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode }),
    });
    if (res.ok) await fetchChatDetail(state.selectedId, false);
  }, [fetchChatDetail, state.selectedId]);

  const loadOlderMessages = useCallback(async () => {
    if (!state.selectedId || state.isLoadingHistory || !state.hasMoreHistory) return;
    const current = messagesRef.current;
    const oldest = current[0];
    if (!oldest?.id) {
      dispatch({ type: 'SET_HAS_MORE_HISTORY', payload: false });
      return;
    }
    dispatch({ type: 'SET_LOADING_HISTORY', payload: true });
    try {
      const page = await fetchMessagesPage(state.selectedId, oldest.id);
      dispatch({ type: 'PREPEND_MESSAGES', payload: page.messages || [] });
      dispatch({ type: 'SET_HAS_MORE_HISTORY', payload: page.has_more });
    } finally {
      dispatch({ type: 'SET_LOADING_HISTORY', payload: false });
    }
  }, [dispatch, fetchMessagesPage, state.hasMoreHistory, state.isLoadingHistory, state.selectedId]);

  const selectedConversation = useMemo(() => (
    state.conversations.find((c) => c.line_user_id === state.selectedId) || null
  ), [state.conversations, state.selectedId]);

  const isHumanMode = state.currentChat?.chat_mode === 'HUMAN';

  const formatTime = useCallback((value: string) => {
    const d = new Date(value);
    const now = new Date();
    const mins = Math.floor((now.getTime() - d.getTime()) / 60000);
    if (mins < 1) return 'now';
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    if (hours < 48) return 'Yesterday';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }, []);

  const value: LiveChatContextValue = {
    state,
    wsStatus,
    isMobileView,
    typingUsersCount,
    focusedMessageId,
    isHumanMode,
    selectedConversation,
    setSearchQuery,
    setFilterStatus,
    setInputText,
    setShowCustomerPanel,
    setActiveActionMenu,
    setShowTransferDialog,
    setShowCannedPicker,
    setSoundEnabled,
    selectConversation,
    jumpToMessage,
    clearFocusedMessage,
    fetchConversations,
    fetchChatDetail,
    sendMessage,
    sendMedia,
    claimSession,
    closeSession,
    transferSession,
    toggleMode,
    loadOlderMessages,
    reconnect,
    retryMessage,
    startTyping,
    formatTime,
  };

  return <LiveChatContext.Provider value={value}>{children}</LiveChatContext.Provider>;
}

export function useLiveChatContext() {
  const context = useContext(LiveChatContext);
  if (!context) {
    throw new Error('useLiveChatContext must be used within LiveChatProvider');
  }
  return context;
}
