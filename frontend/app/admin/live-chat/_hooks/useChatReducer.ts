'use client';

import { useReducer } from 'react';

import type { Message } from '@/lib/websocket/types';
import type { Conversation, CurrentChat } from '../_types';

interface ChatState {
  conversations: Conversation[];
  selectedId: string | null;
  currentChat: CurrentChat | null;
  messages: Message[];
  loading: boolean;
  backendOnline: boolean;
  filterStatus: string | null;
  searchQuery: string;
  inputText: string;
  sending: boolean;
  claiming: boolean;
  showCustomerPanel: boolean;
  activeActionMenu: string | null;
  showTransferDialog: boolean;
  showCannedPicker: boolean;
  soundEnabled: boolean;
  pendingMessages: Set<string>;
  failedMessages: Map<string, string>;
  hasMoreHistory: boolean;
  isLoadingHistory: boolean;
}

type ChatAction =
  | { type: 'SET_CONVERSATIONS'; payload: Conversation[] }
  | { type: 'SELECT_CHAT'; payload: string | null }
  | { type: 'SET_CURRENT_CHAT'; payload: CurrentChat | null }
  | { type: 'SET_MESSAGES'; payload: Message[] }
  | { type: 'ADD_MESSAGE'; payload: Message }
  | { type: 'PREPEND_MESSAGES'; payload: Message[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_BACKEND_ONLINE'; payload: boolean }
  | { type: 'SET_FILTER'; payload: string | null }
  | { type: 'SET_SEARCH'; payload: string }
  | { type: 'SET_INPUT'; payload: string }
  | { type: 'SET_SENDING'; payload: boolean }
  | { type: 'SET_CLAIMING'; payload: boolean }
  | { type: 'SET_SHOW_CUSTOMER_PANEL'; payload: boolean }
  | { type: 'SET_ACTIVE_ACTION_MENU'; payload: string | null }
  | { type: 'SET_SHOW_TRANSFER_DIALOG'; payload: boolean }
  | { type: 'SET_SHOW_CANNED_PICKER'; payload: boolean }
  | { type: 'SET_SOUND_ENABLED'; payload: boolean }
  | { type: 'ADD_PENDING'; payload: string }
  | { type: 'REMOVE_PENDING'; payload: string }
  | { type: 'SET_FAILED'; payload: { tempId: string; error: string } }
  | { type: 'CLEAR_FAILED'; payload: string }
  | { type: 'SET_HAS_MORE_HISTORY'; payload: boolean }
  | { type: 'SET_LOADING_HISTORY'; payload: boolean };

const initialState: ChatState = {
  conversations: [],
  selectedId: null,
  currentChat: null,
  messages: [],
  loading: true,
  backendOnline: true,
  filterStatus: null,
  searchQuery: '',
  inputText: '',
  sending: false,
  claiming: false,
  showCustomerPanel: true,
  activeActionMenu: null,
  showTransferDialog: false,
  showCannedPicker: false,
  soundEnabled: true,
  pendingMessages: new Set(),
  failedMessages: new Map(),
  hasMoreHistory: true,
  isLoadingHistory: false,
};

function reducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'SET_CONVERSATIONS':
      return { ...state, conversations: action.payload };
    case 'SELECT_CHAT':
      return { ...state, selectedId: action.payload };
    case 'SET_CURRENT_CHAT':
      return { ...state, currentChat: action.payload };
    case 'SET_MESSAGES':
      return { ...state, messages: action.payload };
    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.payload] };
    case 'PREPEND_MESSAGES':
      return { ...state, messages: [...action.payload, ...state.messages] };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_BACKEND_ONLINE':
      return { ...state, backendOnline: action.payload };
    case 'SET_FILTER':
      return { ...state, filterStatus: action.payload };
    case 'SET_SEARCH':
      return { ...state, searchQuery: action.payload };
    case 'SET_INPUT':
      return { ...state, inputText: action.payload };
    case 'SET_SENDING':
      return { ...state, sending: action.payload };
    case 'SET_CLAIMING':
      return { ...state, claiming: action.payload };
    case 'SET_SHOW_CUSTOMER_PANEL':
      return { ...state, showCustomerPanel: action.payload };
    case 'SET_ACTIVE_ACTION_MENU':
      return { ...state, activeActionMenu: action.payload };
    case 'SET_SHOW_TRANSFER_DIALOG':
      return { ...state, showTransferDialog: action.payload };
    case 'SET_SHOW_CANNED_PICKER':
      return { ...state, showCannedPicker: action.payload };
    case 'SET_SOUND_ENABLED':
      return { ...state, soundEnabled: action.payload };
    case 'ADD_PENDING': {
      const next = new Set(state.pendingMessages);
      next.add(action.payload);
      return { ...state, pendingMessages: next };
    }
    case 'REMOVE_PENDING': {
      const next = new Set(state.pendingMessages);
      next.delete(action.payload);
      return { ...state, pendingMessages: next };
    }
    case 'SET_FAILED': {
      const next = new Map(state.failedMessages);
      next.set(action.payload.tempId, action.payload.error);
      return { ...state, failedMessages: next };
    }
    case 'CLEAR_FAILED': {
      const next = new Map(state.failedMessages);
      next.delete(action.payload);
      return { ...state, failedMessages: next };
    }
    case 'SET_HAS_MORE_HISTORY':
      return { ...state, hasMoreHistory: action.payload };
    case 'SET_LOADING_HISTORY':
      return { ...state, isLoadingHistory: action.payload };
    default:
      return state;
  }
}

export function useChatReducer() {
  return useReducer(reducer, initialState);
}

export type { ChatState, ChatAction };
