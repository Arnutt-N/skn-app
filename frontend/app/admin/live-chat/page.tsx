'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
    Search, Send, MoreVertical, Bot, User, AlertCircle, RefreshCw,
    CheckCircle2, Clock, X, MessageSquare, Users, Zap,
    Smile, Paperclip, FileText, ExternalLink,
    Copy, Star, Archive, Home, Trash2, Bell, ChevronRight, ChevronLeft,
    Inbox, Hash, Eye, Pin, CheckCheck, ShieldAlert, UserPlus,
    Wifi, WifiOff
} from 'lucide-react';
import { ChatModeToggle } from '@/components/admin/ChatModeToggle';
import { useLiveChatSocket } from '@/hooks/useLiveChatSocket';
import { MessageType, ConnectionState, Message, ConversationUpdatePayload } from '@/lib/websocket/types';

interface Session {
    id: number;
    status: 'WAITING' | 'ACTIVE' | 'CLOSED';
    started_at: string;
    operator_id?: number;
}

interface Conversation {
    line_user_id: string;
    display_name: string;
    picture_url: string;
    friend_status: string;
    chat_mode: 'BOT' | 'HUMAN';
    session?: Session;
    last_message?: {
        content: string;
        created_at: string;
    };
    unread_count: number;
}

export default function LiveChatPage() {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [currentChat, setCurrentChat] = useState<any>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(true);
    const [backendOnline, setBackendOnline] = useState(true);
    const [filterStatus, setFilterStatus] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [sending, setSending] = useState(false);
    const [showCustomerPanel, setShowCustomerPanel] = useState(true);
    const [activeActionMenu, setActiveActionMenu] = useState<string | null>(null);
    const [wsStatus, setWsStatus] = useState<ConnectionState>('disconnected');
    const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
    // Message status tracking
    const [pendingMessages, setPendingMessages] = useState<Set<string>>(new Set());
    const [failedMessages, setFailedMessages] = useState<Map<string, string>>(new Map());
    // Admin ID from auth - TODO: Replace with proper auth context when available
    const [adminId, setAdminId] = useState<string>('1');

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const isFirstLoadRef = useRef<boolean>(true);
    const inputRef = useRef<HTMLInputElement>(null);
    const prevSelectedIdRef = useRef<string | null>(null);

    const API_BASE = '/api/v1';

    // WebSocket event handlers
    const handleNewMessage = useCallback((message: Message) => {
        setMessages(prev => {
            // Check if message already exists (by id or temp_id)
            const exists = prev.some(m => 
                m.id === message.id || 
                (message.temp_id && m.temp_id === message.temp_id)
            );
            if (exists) {
                // Update existing message (replace temp with real)
                return prev.map(m => 
                    (m.temp_id && m.temp_id === message.temp_id) ? message : m
                );
            }
            return [...prev, message];
        });
        // Refresh conversations list to update last message
        fetchConversations();
    }, []);

    const handleMessageSent = useCallback((message: Message) => {
        handleNewMessage(message);
        setSending(false);
        setInputText('');
    }, [handleNewMessage]);

    const handleTyping = useCallback((lineUserId: string, adminId: string, isTyping: boolean) => {
        if (isTyping) {
            setTypingUsers(prev => new Set(prev).add(adminId));
        } else {
            setTypingUsers(prev => {
                const next = new Set(prev);
                next.delete(adminId);
                return next;
            });
        }
    }, []);

    const handleSessionClaimed = useCallback((lineUserId: string, operatorId: number) => {
        if (currentChat?.line_user_id === lineUserId) {
            setCurrentChat((prev: any) => ({
                ...prev,
                session: {
                    ...prev?.session,
                    status: 'ACTIVE',
                    operator_id: operatorId
                }
            }));
        }
        fetchConversations();
    }, [currentChat?.line_user_id]);

    const handleSessionClosed = useCallback((lineUserId: string) => {
        if (currentChat?.line_user_id === lineUserId) {
            setCurrentChat((prev: any) => ({
                ...prev,
                chat_mode: 'BOT',
                session: null
            }));
        }
        fetchConversations();
    }, [currentChat?.line_user_id]);

    const handleConversationUpdate = useCallback((data: ConversationUpdatePayload) => {
        if (selectedId === data.line_user_id) {
            setCurrentChat(data);
            setMessages(data.messages);
        }
    }, [selectedId]);

    const handleConnectionChange = useCallback((state: ConnectionState) => {
        setWsStatus(state);
        if (state === 'connected') {
            setBackendOnline(true);
        }
    }, []);

    // Handle message ACK - remove from pending
    const handleMessageAck = useCallback((tempId: string, messageId: number) => {
        setPendingMessages(prev => {
            const next = new Set(prev);
            next.delete(tempId);
            return next;
        });
        setFailedMessages(prev => {
            const next = new Map(prev);
            next.delete(tempId);
            return next;
        });
    }, []);

    // Handle message failed - add to failed map
    const handleMessageFailed = useCallback((tempId: string, error: string) => {
        setPendingMessages(prev => {
            const next = new Set(prev);
            next.delete(tempId);
            return next;
        });
        setFailedMessages(prev => new Map(prev).set(tempId, error));
        setSending(false);
    }, []);

    // Auto-retry failed messages when reconnecting
    useEffect(() => {
        if (wsStatus === 'connected' && failedMessages.size > 0) {
            const retryEntries = Array.from(failedMessages.entries());
            retryEntries.forEach(([tempId]) => {
                // Find message in messages to get its text
                const msg = messages.find(m => m.temp_id === tempId);
                if (msg) {
                    wsSendMessage(msg.content, tempId);
                }
            });
        }
    }, [wsStatus, failedMessages, messages, wsSendMessage]);

    // Initialize WebSocket with admin ID
    const { joinRoom, leaveRoom, sendMessage: wsSendMessage, startTyping, claimSession, closeSession, reconnect, retryMessage } = useLiveChatSocket({
        adminId, // Pass admin ID from auth
        onNewMessage: handleNewMessage,
        onMessageSent: handleMessageSent,
        onMessageAck: handleMessageAck,
        onMessageFailed: handleMessageFailed,
        onTyping: handleTyping,
        onSessionClaimed: handleSessionClaimed,
        onSessionClosed: handleSessionClosed,
        onConversationUpdate: handleConversationUpdate,
        onConnectionChange: handleConnectionChange,
        onError: (error) => console.error('WebSocket error:', error),
    });

    const fetchConversations = async () => {
        try {
            const res = await fetch(`${API_BASE}/admin/live-chat/conversations${filterStatus ? `?status=${filterStatus}` : ''}`);
            if (res.ok) {
                const data = await res.json();
                setConversations(data.conversations || data || []);
                setBackendOnline(true);
            } else {
                setBackendOnline(false);
            }
        } catch {
            setBackendOnline(false);
        } finally {
            setLoading(false);
        }
    };

    const fetchChatDetail = async (id: string) => {
        try {
            const res = await fetch(`${API_BASE}/admin/live-chat/conversations/${id}`);
            if (res.ok) {
                const data = await res.json();
                setCurrentChat(data);
                setMessages(data.messages || []);
                setBackendOnline(true);
            }
        } catch {
            setBackendOnline(false);
        }
    };

    // Initial load and polling fallback
    useEffect(() => {
        fetchConversations();
        // Keep polling as fallback when WebSocket is not connected
        const interval = setInterval(() => {
            if (wsStatus !== 'connected') {
                fetchConversations();
            }
        }, 5000);
        return () => clearInterval(interval);
    }, [filterStatus, wsStatus]);

    // Handle conversation selection
    useEffect(() => {
        if (!selectedId) return;
        
        // Leave previous room
        if (prevSelectedIdRef.current && prevSelectedIdRef.current !== selectedId) {
            leaveRoom();
        }
        
        // Fetch initial data
        fetchChatDetail(selectedId);
        
        // Join WebSocket room
        if (wsStatus === 'connected') {
            joinRoom(selectedId);
        }
        
        prevSelectedIdRef.current = selectedId;
        isFirstLoadRef.current = true;
        
        return () => {
            if (selectedId) {
                leaveRoom();
            }
        };
    }, [selectedId, wsStatus, joinRoom, leaveRoom]);

    // Auto-scroll to bottom
    useEffect(() => {
        if (!messages.length) return;
        const latestMsg = messages[messages.length - 1];
        if (isFirstLoadRef.current) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
            isFirstLoadRef.current = false;
        } else {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputText.trim() || !selectedId || sending) return;

        setSending(true);

        // Optimistic UI
        const tempId = `temp-${Date.now()}`;
        const optimisticMessage: Message = {
            id: 0,
            line_user_id: selectedId,
            direction: 'OUTGOING',
            content: inputText,
            message_type: 'text',
            sender_role: 'ADMIN',
            operator_name: 'Admin',
            created_at: new Date().toISOString(),
            temp_id: tempId
        };
        setMessages(prev => [...prev, optimisticMessage]);
        setPendingMessages(prev => new Set(prev).add(tempId));

        if (wsStatus === 'connected') {
            // Send via WebSocket
            wsSendMessage(inputText, tempId);
        } else {
            // Fallback to REST
            try {
                const res = await fetch(`${API_BASE}/admin/live-chat/conversations/${selectedId}/messages`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text: inputText })
                });
                if (res.ok) {
                    setInputText('');
                    fetchChatDetail(selectedId);
                    fetchConversations();
                } else {
                    // REST failed - mark as failed
                    setFailedMessages(prev => new Map(prev).set(tempId, 'Failed to send'));
                    setPendingMessages(prev => {
                        const next = new Set(prev);
                        next.delete(tempId);
                        return next;
                    });
                }
            } catch (err) {
                console.error('Failed to send message:', err);
                setFailedMessages(prev => new Map(prev).set(tempId, 'Network error'));
                setPendingMessages(prev => {
                    const next = new Set(prev);
                    next.delete(tempId);
                    return next;
                });
            } finally {
                setSending(false);
            }
        }
    };

    const handleToggleMode = async (mode: 'BOT' | 'HUMAN') => {
        if (!selectedId) return;
        try {
            const res = await fetch(`${API_BASE}/admin/live-chat/conversations/${selectedId}/mode`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mode })
            });
            if (res.ok) {
                await fetchChatDetail(selectedId);
                if (mode === 'HUMAN') inputRef.current?.focus();
            }
        } catch { }
    };

    const handleClaim = async () => {
        if (!selectedId) return;
        
        if (wsStatus === 'connected') {
            claimSession();
        } else {
            try {
                const res = await fetch(`${API_BASE}/admin/live-chat/conversations/${selectedId}/claim`, { method: 'POST' });
                if (res.ok) fetchChatDetail(selectedId);
            } catch { }
        }
    };

    const handleClose = async () => {
        if (!selectedId) return;
        
        if (wsStatus === 'connected') {
            closeSession();
        } else {
            try {
                const res = await fetch(`${API_BASE}/admin/live-chat/conversations/${selectedId}/close`, { method: 'POST' });
                if (res.ok) fetchChatDetail(selectedId);
            } catch { }
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputText(e.target.value);
        if (wsStatus === 'connected' && selectedId) {
            startTyping(selectedId);
        }
    };

    const filteredConversations = conversations.filter(conv =>
        conv.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.line_user_id.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const waitingCount = conversations.filter(c => c.session?.status === 'WAITING').length;
    const activeCount = conversations.filter(c => c.session?.status === 'ACTIVE').length;

    const formatTime = (date: string) => {
        const d = new Date(date);
        const now = new Date();
        const diff = now.getTime() - d.getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'now';
        if (mins < 60) return `${mins}m`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h`;
        if (hours < 48) return 'Yesterday';
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const isHumanMode = currentChat?.chat_mode === 'HUMAN';

    const getSenderLabel = (msg: Message) => {
        if (msg.direction === 'INCOMING') return currentChat?.display_name;
        if (msg.sender_role === 'BOT') return 'Bot';
        return msg.operator_name || 'Admin';
    };

    const getMessageContent = (msg: Message) => {
        if (msg.message_type === 'flex') return null;
        if ((msg as any).responses) return (msg as any).responses;
        try {
            if (msg.content.startsWith('{') || msg.content.startsWith('[')) {
                const parsed = JSON.parse(msg.content);
                if (parsed.responses) return parsed.responses;
                if (parsed.Responses) return parsed.Responses;
                if (parsed.response) return parsed.response;
                if (parsed.text) return parsed.text;
                if (parsed.categories && !parsed.response && !parsed.text && !parsed.responses) return '[Rich Content]';
            }
        } catch { }
        return msg.content;
    };

    const getConnectionStatus = () => {
        switch (wsStatus) {
            case 'connected':
                return { icon: Wifi, color: 'text-emerald-500', bg: 'bg-emerald-50', label: 'Live' };
            case 'connecting':
            case 'authenticating':
                return { icon: Wifi, color: 'text-amber-500', bg: 'bg-amber-50', label: 'Connecting...' };
            case 'reconnecting':
                return { icon: WifiOff, color: 'text-orange-500', bg: 'bg-orange-50', label: 'Reconnecting...' };
            default:
                return { icon: WifiOff, color: 'text-slate-400', bg: 'bg-slate-100', label: 'Offline' };
        }
    };

    // Unified sizing constants - UX Best Practice
    const HEADER_HEIGHT = 'h-14'; // 56px - standard header
    const SIDEBAR_WIDTH = 'w-72'; // 288px
    const PANEL_WIDTH = 'w-64'; // 256px

    const connStatus = getConnectionStatus();
    const ConnIcon = connStatus.icon;

    return (
        <>
            <style jsx global>{`
                .chat-scrollbar::-webkit-scrollbar { width: 6px; }
                .chat-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .chat-scrollbar::-webkit-scrollbar-thumb { background: rgba(148, 163, 184, 0.3); border-radius: 10px; }
                .chat-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(148, 163, 184, 0.5); }
                .dark-scrollbar::-webkit-scrollbar { width: 5px; }
                .dark-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .dark-scrollbar::-webkit-scrollbar-thumb { background: rgba(100, 116, 139, 0.3); border-radius: 10px; }
                .dark-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(100, 116, 139, 0.5); }
                @keyframes slideInLeft { from { opacity: 0; transform: translateX(-12px); } to { opacity: 1; transform: translateX(0); } }
                @keyframes slideInRight { from { opacity: 0; transform: translateX(12px); } to { opacity: 1; transform: translateX(0); } }
                .msg-left { animation: slideInLeft 0.25s ease-out; }
                .msg-right { animation: slideInRight 0.25s ease-out; }
            `}</style>

            <div className="flex h-screen w-full bg-slate-100 overflow-hidden font-sans">
                {/* Connection Alert */}
                {!backendOnline && (
                    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60]">
                        <div className="bg-red-500 text-white px-4 py-2 rounded-full shadow-xl flex items-center gap-2 text-sm font-medium">
                            <AlertCircle className="w-4 h-4" />
                            Connection Lost
                            <button onClick={fetchConversations} className="ml-2 p-1 hover:bg-white/20 rounded-full cursor-pointer">
                                <RefreshCw className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Left: Sidebar */}
                <aside className={`${SIDEBAR_WIDTH} bg-[#2f3349] flex flex-col flex-shrink-0 border-r border-[#1a1d2d]`}>
                    {/* Header */}
                    <div className={`${HEADER_HEIGHT} px-4 border-b border-slate-700/50 flex items-center gap-3`}>
                        <Link href="/admin" className="p-2 bg-slate-800 hover:bg-indigo-600 text-slate-400 hover:text-white rounded-lg transition-all cursor-pointer">
                            <Home className="w-4 h-4" />
                        </Link>
                        <h1 className="flex-1 text-white font-bold text-sm text-center">Live Chat</h1>
                        <div className="flex items-center gap-1">
                            <ConnIcon className={`w-4 h-4 ${connStatus.color}`} />
                            <span className={`text-[10px] ${connStatus.color}`}>{connStatus.label}</span>
                        </div>
                    </div>

                    {/* Search & Filters */}
                    <div className="px-4 py-3 space-y-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search conversations..."
                                className="w-full pl-10 pr-3 py-2.5 bg-[#3a3f5b]/50 border border-slate-600/40 text-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500/50 placeholder:text-slate-500"
                            />
                        </div>

                        {/* Filter Tabs */}
                        <div className="flex gap-1.5">
                            {[
                                { key: null, label: 'All', count: conversations.length },
                                { key: 'WAITING', label: 'Waiting', count: waitingCount, color: 'orange' },
                                { key: 'ACTIVE', label: 'Active', count: activeCount, color: 'emerald' },
                            ].map((tab) => (
                                <button
                                    key={tab.label}
                                    onClick={() => setFilterStatus(tab.key as any)}
                                    className={`flex-1 py-1.5 px-2 text-[11px] font-medium rounded-md transition-all cursor-pointer flex items-center justify-center gap-1 ${filterStatus === tab.key
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-slate-700/40 text-slate-400 hover:bg-slate-700/60 hover:text-slate-200'
                                        }`}
                                >
                                    {tab.label}
                                    {tab.count > 0 && (
                                        <span className={`text-[10px] px-1.5 rounded-full ${filterStatus === tab.key
                                            ? 'bg-white/20'
                                            : tab.color === 'orange' ? 'bg-orange-500/30 text-orange-300' : tab.color === 'emerald' ? 'bg-emerald-500/30 text-emerald-300' : 'bg-slate-600/50'
                                            }`}>
                                            {tab.count}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Conversation List */}
                    <div className="flex-1 overflow-y-auto dark-scrollbar px-2">
                        {loading && conversations.length === 0 ? (
                            <div className="space-y-2 p-2">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="flex gap-3 p-3 bg-[#3a3f5b]/30 rounded-xl animate-pulse">
                                        <div className="w-11 h-11 bg-slate-700/50 rounded-full" />
                                        <div className="flex-1 space-y-2 py-1">
                                            <div className="h-3 bg-slate-700/50 rounded w-2/3" />
                                            <div className="h-2.5 bg-slate-700/30 rounded w-full" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : filteredConversations.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center p-6 opacity-60">
                                <Inbox className="w-10 h-10 text-slate-500 mb-3" />
                                <span className="text-slate-400 text-sm">No conversations</span>
                            </div>
                        ) : (
                            <div className="space-y-1 py-2">
                                {filteredConversations.map((conv) => {
                                    const isSelected = selectedId === conv.line_user_id;
                                    const isWaiting = conv.session?.status === 'WAITING';
                                    const isActive = conv.session?.status === 'ACTIVE';

                                    return (
                                        <div
                                            key={conv.line_user_id}
                                            className={`group relative flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${isSelected
                                                ? 'bg-indigo-600/15 border border-indigo-500/40'
                                                : 'hover:bg-[#3a3f5b]/40 border border-transparent'
                                                }`}
                                            onClick={() => { setSelectedId(conv.line_user_id); setActiveActionMenu(null); }}
                                        >
                                            {/* Avatar */}
                                            <div className="relative flex-shrink-0">
                                                <img
                                                    src={conv.picture_url || `https://ui-avatars.com/api/?name=${conv.display_name}&background=6366f1&color=fff&size=44`}
                                                    className="w-11 h-11 rounded-full object-cover"
                                                    alt=""
                                                />
                                                <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#2f3349] ${isWaiting ? 'bg-orange-500' : isActive ? 'bg-emerald-500' : 'bg-slate-500'}`} />
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className={`font-semibold truncate text-sm ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                                                        {conv.display_name}
                                                    </span>
                                                    <span className="text-[10px] text-slate-500 flex-shrink-0">
                                                        {conv.last_message?.created_at && formatTime(conv.last_message.created_at)}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between gap-2 mt-1">
                                                    <span className={`truncate text-xs ${isSelected ? 'text-indigo-200/70' : 'text-slate-400'}`}>
                                                        {conv.last_message?.content || 'No messages yet'}
                                                    </span>
                                                    {conv.unread_count > 0 && (
                                                        <span className="min-w-[18px] h-[18px] px-1 bg-indigo-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                                            {conv.unread_count > 9 ? '9+' : conv.unread_count}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Menu */}
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setActiveActionMenu(activeActionMenu === conv.line_user_id ? null : conv.line_user_id); }}
                                                className={`p-1.5 rounded-lg cursor-pointer ${activeActionMenu === conv.line_user_id ? 'bg-slate-600 text-white' : 'text-slate-500 hover:text-white opacity-0 group-hover:opacity-100'}`}
                                            >
                                                <MoreVertical className="w-4 h-4" />
                                            </button>

                                            {/* Dropdown */}
                                            {activeActionMenu === conv.line_user_id && (
                                                <div className="absolute right-0 top-12 z-50 w-44 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl py-1" onClick={(e) => e.stopPropagation()}>
                                                    {[
                                                        { icon: Eye, label: 'Preview', color: '' },
                                                        { icon: UserPlus, label: 'Follow Up', color: '' },
                                                        { icon: Pin, label: 'Pin', color: '' },
                                                        { icon: CheckCheck, label: 'Mark Read', color: '' },
                                                        { icon: Archive, label: 'Archive', color: '' },
                                                        { icon: ShieldAlert, label: 'Spam', color: 'text-orange-400' },
                                                        { icon: Trash2, label: 'Delete', color: 'text-red-400' },
                                                    ].map((item, i) => (
                                                        <button key={i} className={`w-full px-3 py-2 text-left text-xs flex items-center gap-2 hover:bg-slate-700 cursor-pointer ${item.color || 'text-slate-300 hover:text-white'}`}>
                                                            <item.icon className="w-3.5 h-3.5" />{item.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-4 py-2.5 border-t border-slate-700/50 bg-[#25293c]/50 text-xs text-slate-500 flex justify-between">
                        <span>{wsStatus === 'connected' ? 'Live' : 'Polling'}</span>
                        <span>{activeCount} active • {waitingCount} waiting</span>
                    </div>
                </aside>

                {/* Center: Chat Area */}
                <main className="flex-1 flex flex-col bg-slate-50 min-w-0 relative z-10">
                    {!selectedId ? (
                        <div className="flex-1 flex flex-col">
                            {/* Empty Navbar */}
                            <header className={`${HEADER_HEIGHT} px-5 bg-white border-b border-slate-200 flex items-center justify-between`}>
                                <span className="font-semibold text-slate-700 text-sm">Live Chat Console</span>
                                <div className="flex items-center gap-3">
                                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${connStatus.bg} ${connStatus.color}`}>
                                        <div className={`w-2 h-2 rounded-full ${connStatus.color}`} />
                                        <Bot className="w-4 h-4" />
                                        {connStatus.label}
                                    </div>
                                    <Link href="/admin" className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-medium cursor-pointer flex items-center gap-1.5">
                                        <Home className="w-4 h-4" />Admin
                                    </Link>
                                </div>
                            </header>

                            {/* Empty Content */}
                            <div className="flex-1 flex items-center justify-center">
                                <div className="text-center p-8">
                                    <div className="w-20 h-20 bg-white rounded-2xl shadow-xl flex items-center justify-center mx-auto mb-4">
                                        <MessageSquare className="w-9 h-9 text-indigo-500" />
                                    </div>
                                    <p className="text-slate-700 font-semibold text-base mb-1">Select a Conversation</p>
                                    <p className="text-slate-500 text-sm">Choose from the sidebar to start chatting</p>
                                    <div className="flex gap-6 justify-center mt-6">
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-slate-700">{waitingCount}</div>
                                            <div className="text-xs text-slate-400 uppercase">Waiting</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-slate-700">{activeCount}</div>
                                            <div className="text-xs text-slate-400 uppercase">Active</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Chat Navbar */}
                            <header className={`${HEADER_HEIGHT} px-4 bg-white border-b border-slate-200 flex items-center justify-between`}>
                                <div className="flex items-center gap-3">
                                    <div className="relative cursor-pointer" onClick={() => setShowCustomerPanel(!showCustomerPanel)}>
                                        <img src={currentChat?.picture_url} className="w-10 h-10 rounded-full object-cover" alt="" />
                                        <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${currentChat?.session?.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-orange-500'}`} />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-slate-800 text-sm">{currentChat?.display_name}</p>
                                        <p className="text-xs text-slate-500">{isHumanMode ? 'Manual Mode' : 'Bot Mode'}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <div className="hidden md:block">
                                        <ChatModeToggle currentMode={currentChat?.chat_mode || 'BOT'} onToggle={handleToggleMode} disabled={false} />
                                    </div>
                                    <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" />
                                    {(!currentChat?.session || currentChat?.session?.status === 'WAITING') && (
                                        <button onClick={handleClaim} className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full text-xs font-semibold cursor-pointer flex items-center gap-1.5">
                                            <Users className="w-4 h-4" />Claim
                                        </button>
                                    )}
                                    {currentChat?.session?.status === 'ACTIVE' && (
                                        <button onClick={handleClose} className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full text-xs font-semibold cursor-pointer flex items-center gap-1.5">
                                            <CheckCircle2 className="w-4 h-4" />Done
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setShowCustomerPanel(!showCustomerPanel)}
                                        className={`p-2 rounded-full border cursor-pointer ${showCustomerPanel ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'}`}
                                    >
                                        {showCustomerPanel ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                                    </button>
                                </div>
                            </header>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-100 chat-scrollbar">
                                <div className="flex justify-center pb-3">
                                    <span className="px-3 py-1 bg-white text-slate-500 text-xs font-medium rounded-full shadow-sm">
                                        {new Date(currentChat?.session?.started_at || Date.now()).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                    </span>
                                </div>

                                {messages.map((msg, idx) => {
                                    const isIncoming = msg.direction === 'INCOMING';
                                    const prevMsg = messages[idx - 1];
                                    const nextMsg = messages[idx + 1];
                                    const isFirstInGroup = !prevMsg || prevMsg.direction !== msg.direction || prevMsg.sender_role !== msg.sender_role;
                                    const isLastInGroup = !nextMsg || nextMsg.direction !== msg.direction || nextMsg.sender_role !== msg.sender_role;
                                    const messageContent = getMessageContent(msg);
                                    const isPending = msg.temp_id && pendingMessages.has(msg.temp_id);
                                    const isFailed = msg.temp_id && failedMessages.has(msg.temp_id);

                                    return (
                                        <div key={msg.id || msg.temp_id} className={`flex items-end gap-2 ${isIncoming ? 'justify-start msg-left' : 'justify-end msg-right'}`}>
                                            {/* User Avatar */}
                                            {isIncoming && (
                                                isLastInGroup ? (
                                                    <img src={currentChat?.picture_url} className="w-8 h-8 rounded-full object-cover flex-shrink-0" alt="" />
                                                ) : <div className="w-8 flex-shrink-0" />
                                            )}

                                            <div className={`max-w-[60%]`}>
                                                {isFirstInGroup && (
                                                    <p className={`text-[10px] mb-1 px-1 ${isIncoming ? 'text-slate-500' : msg.sender_role === 'BOT' ? 'text-slate-400 text-right' : 'text-indigo-600 text-right'}`}>
                                                        {getSenderLabel(msg)} • {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                )}
                                                <div className={`px-4 py-2.5 text-sm leading-relaxed rounded-2xl ${isIncoming
                                                    ? 'bg-white text-slate-700 rounded-bl-md border border-slate-100'
                                                    : msg.sender_role === 'BOT'
                                                        ? 'bg-slate-200 text-slate-600 rounded-br-md'
                                                        : 'bg-indigo-600 text-white rounded-br-md'
                                                    }`}>
                                                    {msg.message_type === 'flex' ? (
                                                        <span className="flex items-center gap-1.5 text-xs opacity-80"><FileText className="w-4 h-4" />Rich Content</span>
                                                    ) : messageContent}
                                                </div>
                                                {/* Message Status Indicators */}
                                                {!isIncoming && msg.temp_id && (
                                                    <div className="ml-2 flex items-center gap-1">
                                                        {isPending && <RefreshCw className="w-3.5 h-3.5 text-indigo-400 animate-spin" />}
                                                        {isFailed && (
                                                            <>
                                                                <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                                                                <button
                                                                    onClick={() => retryMessage(msg.temp_id)}
                                                                    className="text-[10px] text-indigo-600 hover:underline cursor-pointer"
                                                                >
                                                                    Retry
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Bot/Admin Avatar */}
                                            {!isIncoming && (
                                                isLastInGroup ? (
                                                    msg.sender_role === 'BOT' ? (
                                                        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-blue-400 to-cyan-500 shadow-md">
                                                            <Bot className="w-4 h-4 text-white" />
                                                        </div>
                                                    ) : (
                                                        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-indigo-500 to-purple-600 shadow-md">
                                                            <User className="w-4 h-4 text-white" />
                                                        </div>
                                                    )
                                                ) : <div className="w-8 flex-shrink-0" />
                                            )}
                                        </div>
                                    );
                                })}
                                
                                {/* Typing Indicator */}
                                {typingUsers.size > 0 && (
                                    <div className="flex items-center gap-2 text-slate-400 text-xs">
                                        <div className="flex gap-1">
                                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                        </div>
                                        <span>Someone is typing...</span>
                                    </div>
                                )}
                                
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input */}
                            <footer className="bg-white border-t border-slate-200 p-3 relative">
                                {!isHumanMode && (
                                    <div className="absolute -top-8 left-0 right-0 flex justify-center pointer-events-none">
                                        <span className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-semibold rounded-full border border-blue-100 flex items-center gap-1.5">
                                            <Bot className="w-3.5 h-3.5" />Bot is handling
                                        </span>
                                    </div>
                                )}
                                <form onSubmit={handleSendMessage} className={`flex gap-2 ${!isHumanMode ? 'opacity-50 pointer-events-none' : ''}`}>
                                    <div className="flex-1 flex items-center gap-2 bg-slate-100 rounded-xl px-3 py-2 border border-slate-200 focus-within:border-indigo-300 focus-within:bg-white">
                                        <button type="button" className="p-1.5 text-slate-400 hover:text-indigo-500 cursor-pointer"><Paperclip className="w-5 h-5" /></button>
                                        <input
                                            ref={inputRef}
                                            type="text"
                                            value={inputText}
                                            onChange={handleInputChange}
                                            disabled={!isHumanMode || sending}
                                            placeholder="Type your message..."
                                            className="flex-1 bg-transparent outline-none text-sm text-slate-700 placeholder:text-slate-400"
                                        />
                                        <button type="button" className="p-1.5 text-slate-400 hover:text-orange-500 cursor-pointer"><Smile className="w-5 h-5" /></button>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={!inputText.trim() || sending || !isHumanMode}
                                        className={`p-3 rounded-xl cursor-pointer ${inputText.trim() && isHumanMode ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                                    >
                                        {sending ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                    </button>
                                </form>
                            </footer>
                        </>
                    )}
                </main>

                {/* Right: Customer Panel */}
                {selectedId && showCustomerPanel && (
                    <aside className={`${PANEL_WIDTH} bg-white border-l border-slate-200 flex flex-col flex-shrink-0 z-20`}>
                        {/* Panel Header */}
                        <div className={`${HEADER_HEIGHT} px-4 border-b border-slate-100 flex items-center justify-between bg-slate-50`}>
                            <span className="font-semibold text-slate-700 text-xs uppercase tracking-wide">Customer Info</span>
                            <button onClick={() => setShowCustomerPanel(false)} className="p-1.5 text-slate-400 hover:text-slate-600 cursor-pointer"><X className="w-4 h-4" /></button>
                        </div>

                        {/* Profile */}
                        <div className="p-5 border-b border-slate-100 text-center">
                            <img src={currentChat?.picture_url} className="w-16 h-16 rounded-full object-cover mx-auto mb-3 ring-4 ring-slate-100" alt="" />
                            <p className="font-semibold text-slate-800 text-sm">{currentChat?.display_name}</p>
                            <button className="text-xs text-indigo-600 hover:underline cursor-pointer flex items-center gap-1 mx-auto mt-1">
                                View Profile <ExternalLink className="w-3 h-3" />
                            </button>
                            <div className="flex justify-center gap-2 mt-4">
                                {[Copy, Bell, Star].map((Icon, i) => (
                                    <button key={i} className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-lg cursor-pointer">
                                        <Icon className="w-4 h-4 text-slate-400" />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Info */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 chat-scrollbar">
                            <div className="bg-slate-50 rounded-xl p-3">
                                <p className="text-[10px] text-slate-400 uppercase font-semibold mb-1.5">LINE ID</p>
                                <p className="text-xs text-slate-600 font-mono truncate">{currentChat?.line_user_id?.substring(0, 20)}...</p>
                            </div>
                            <div className="bg-slate-50 rounded-xl p-3 flex justify-between items-center">
                                <span className="text-xs text-slate-500">Session Status</span>
                                <span className={`px-2 py-1 rounded-lg text-[10px] font-semibold ${currentChat?.session?.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-600' : 'bg-orange-100 text-orange-600'}`}>
                                    {currentChat?.session?.status || 'None'}
                                </span>
                            </div>
                            <div className="bg-slate-50 rounded-xl p-3 flex justify-between items-center">
                                <span className="text-xs text-slate-500">Connection</span>
                                <span className={`px-2 py-1 rounded-lg text-[10px] font-semibold ${connStatus.bg} ${connStatus.color}`}>
                                    {connStatus.label}
                                </span>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-slate-100">
                            <button className="w-full py-2.5 text-xs font-medium text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-lg border border-slate-200 hover:border-red-200 cursor-pointer flex items-center justify-center gap-1.5">
                                <Trash2 className="w-4 h-4" />Delete Conversation
                            </button>
                        </div>
                    </aside>
                )}

                {/* Overlay */}
                {activeActionMenu && <div className="fixed inset-0 z-40" onClick={() => setActiveActionMenu(null)} />}
            </div>
        </>
    );
}
