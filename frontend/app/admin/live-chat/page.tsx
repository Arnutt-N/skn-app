'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
    MessageCircle, Search, Send,
    MoreVertical, User, Bot, Info,
    ChevronLeft, ChevronRight
} from 'lucide-react';
import { TypingIndicator } from '@/components/admin/TypingIndicator';
import { ConversationActionMenu } from '@/components/admin/ConversationActionMenu';
import { ChatModeToggle } from '@/components/admin/ChatModeToggle';

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

interface Message {
    id: number;
    direction: 'INCOMING' | 'OUTGOING';
    content: string;
    created_at: string;
    message_type: string;
    sender_role?: 'USER' | 'BOT' | 'ADMIN';
}

export default function LiveChatPage() {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [currentChat, setCurrentChat] = useState<any>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(true);
    const [chatLoading, setChatLoading] = useState(false);
    const [filterStatus, setFilterStatus] = useState<string | null>(null);
    const [sending, setSending] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [activeActionMenu, setActiveActionMenu] = useState<string | null>(null);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

    useEffect(() => {
        if (inputText.length > 0) {
            setIsTyping(true);
            const timeout = setTimeout(() => setIsTyping(false), 1000);
            return () => clearTimeout(timeout);
        } else {
            setIsTyping(false);
        }
    }, [inputText]);

    useEffect(() => {
        const handleClickOutside = () => setActiveActionMenu(null);
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const fetchConversations = async () => {
        try {
            const res = await fetch(`${API_BASE}/admin/live-chat/conversations${filterStatus ? `?status=${filterStatus}` : ''}`);
            if (res.ok) {
                const data = await res.json();
                setConversations(data.conversations);
            } else {
                console.error(`API Error: ${res.status} ${res.statusText}`);
            }
        } catch (error) {
            console.error("Failed to fetch conversations - backend may not be running", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchChatDetail = async (id: string) => {
        setChatLoading(true);
        try {
            const res = await fetch(`${API_BASE}/admin/live-chat/conversations/${id}`);
            if (res.ok) {
                const data = await res.json();
                setCurrentChat(data);
                setMessages(data.messages);
            } else {
                console.error(`API Error: ${res.status} ${res.statusText}`);
            }
        } catch (error) {
            console.error("Failed to fetch chat detail - backend may not be running", error);
        } finally {
            setChatLoading(false);
        }
    };

    useEffect(() => {
        fetchConversations();
        const interval = setInterval(fetchConversations, 5000);
        return () => clearInterval(interval);
    }, [filterStatus]);

    useEffect(() => {
        if (!selectedId) return;
        fetchChatDetail(selectedId);
        const interval = setInterval(() => fetchChatDetail(selectedId), 3000);
        return () => clearInterval(interval);
    }, [selectedId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputText.trim() || !selectedId || sending) return;

        setSending(true);
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
            }
        } catch (error) {
            console.error("Failed to send message", error);
        } finally {
            setSending(false);
        }
    };

    const handleActionMenuToggle = (e: React.MouseEvent, userId: string) => {
        e.stopPropagation();
        setActiveActionMenu(activeActionMenu === userId ? null : userId);
    };

    const handleActionMenuClose = () => {
        setActiveActionMenu(null);
    };

    const handleConversationAction = (action: 'preview' | 'follow-up' | 'pin' | 'mark-read' | 'spam' | 'delete', userId: string) => {
        console.log(`Action: ${action} for user: ${userId}`);
        setActiveActionMenu(null);
        // TODO: Implement actual action handlers
    };

    const handleClaim = async () => {
        if (!selectedId) return;
        try {
            const res = await fetch(`${API_BASE}/admin/live-chat/conversations/${selectedId}/claim`, { method: 'POST' });
            if (res.ok) fetchChatDetail(selectedId);
        } catch (error) { console.error(error); }
    };

    const handleClose = async () => {
        if (!selectedId) return;
        try {
            const res = await fetch(`${API_BASE}/admin/live-chat/conversations/${selectedId}/close`, { method: 'POST' });
            if (res.ok) fetchChatDetail(selectedId);
        } catch (error) { console.error(error); }
    };

    const handleToggleMode = async (mode: 'BOT' | 'HUMAN') => {
        if (!selectedId) return;
        try {
            const res = await fetch(`${API_BASE}/admin/live-chat/conversations/${selectedId}/mode`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mode })
            });
            if (res.ok) fetchChatDetail(selectedId);
        } catch (error) { console.error(error); }
    };

    return (
        <>
            {/* LIVE-CHAT SIDEBAR - Fixed Left (Replaces Admin Sidebar) */}
            <aside
                className={`fixed left-0 top-0 z-[60] h-full bg-[#2f3349] text-white shadow-xl transition-all duration-300 ease-in-out flex flex-col overflow-x-hidden ${
                    isSidebarCollapsed ? 'w-20' : 'w-64'
                }`}
            >
                {/* Sidebar Header */}
                <div className={`p-4 border-b border-slate-700/50 flex items-center justify-between ${isSidebarCollapsed ? 'flex-col gap-3' : ''}`}>
                    {!isSidebarCollapsed ? (
                        <>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 text-white font-bold text-sm shadow-lg">
                                    SK
                                </div>
                                <span className="font-bold text-lg tracking-tight text-white/95">
                                    Live-Chat
                                </span>
                            </div>
                            <button
                                onClick={() => setIsSidebarCollapsed(true)}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                aria-label="Collapse sidebar"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                        </>
                    ) : (
                        <>
                            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 text-white font-bold text-sm shadow-lg">
                                SK
                            </div>
                            <button
                                onClick={() => setIsSidebarCollapsed(false)}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                aria-label="Expand sidebar"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </>
                    )}
                </div>

                {!isSidebarCollapsed && (
                    <>
                        {/* Search Bar */}
                        <div className="px-4 pt-4 pb-3">
                            <div className="relative group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-400 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Search conversations..."
                                    className="w-full pl-9 pr-3 py-2 bg-[#3a3f5b] border-transparent text-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-500"
                                />
                            </div>
                        </div>

                        {/* Status Filter Tabs */}
                        <div className="px-4 pb-3 flex gap-2">
                            {['ALL', 'WAITING', 'ACTIVE'].map((status) => (
                                <button
                                    key={status}
                                    onClick={() => setFilterStatus(status === 'ALL' ? null : status)}
                                    className={`flex-1 py-1.5 text-[10px] font-bold rounded-md uppercase tracking-wider transition-all ${
                                        (status === 'ALL' && !filterStatus) || filterStatus === status
                                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                                            : 'bg-[#3a3f5b] text-slate-400 hover:text-white hover:bg-[#434968]'
                                    }`}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>
                    </>
                )}

                {/* User List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {loading ? (
                        <div className="p-3 space-y-2">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="h-16 bg-[#3a3f5b]/50 rounded-lg animate-pulse" />
                            ))}
                        </div>
                    ) : conversations.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 text-sm">
                            {isSidebarCollapsed ? (
                                <MessageCircle className="w-6 h-6 mx-auto opacity-50" />
                            ) : (
                                <>
                                    <MessageCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />
                                    <p className="text-xs">No conversations</p>
                                    <p className="text-[10px] opacity-50 mt-1">Check backend status</p>
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="p-2 space-y-1">
                            {conversations.map((conv) => (
                                <div
                                    key={conv.line_user_id}
                                    onClick={() => setSelectedId(conv.line_user_id)}
                                    className={`group relative w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all cursor-pointer ${
                                        selectedId === conv.line_user_id
                                            ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                                            : 'text-slate-300 hover:bg-[#3a3f5b] hover:text-white'
                                    }`}
                                >
                                    {/* User Avatar with Status */}
                                    <div className="relative flex-shrink-0">
                                        <img
                                            src={conv.picture_url}
                                            alt={conv.display_name}
                                            className="w-10 h-10 rounded-full bg-slate-700 object-cover ring-2 ring-transparent group-hover:ring-white/20"
                                        />
                                        <div
                                            className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#2f3349] ${
                                                conv.session?.status === 'WAITING'
                                                    ? 'bg-orange-500'
                                                    : conv.session?.status === 'ACTIVE'
                                                    ? 'bg-emerald-500'
                                                    : 'bg-slate-500'
                                            }`}
                                        />
                                    </div>

                                    {!isSidebarCollapsed && (
                                        <>
                                            {/* User Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-center gap-2">
                                                    <h4
                                                        className={`text-sm font-semibold truncate ${
                                                            selectedId === conv.line_user_id ? 'text-white' : 'text-slate-200'
                                                        }`}
                                                    >
                                                        {conv.display_name}
                                                    </h4>
                                                    {conv.unread_count > 0 && (
                                                        <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0">
                                                            {conv.unread_count}
                                                        </span>
                                                    )}
                                                </div>
                                                <p
                                                    className={`text-xs truncate mt-0.5 ${
                                                        selectedId === conv.line_user_id ? 'text-indigo-100' : 'text-slate-400'
                                                    }`}
                                                >
                                                    {conv.last_message?.content || 'No messages'}
                                                </p>
                                            </div>

                                            {/* Hamburger Menu Button */}
                                            <div className="relative flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                                                <button
                                                    onClick={(e) => handleActionMenuToggle(e, conv.line_user_id)}
                                                    className={`p-1.5 rounded hover:bg-white/10 transition-all ${
                                                        selectedId === conv.line_user_id
                                                            ? 'opacity-100'
                                                            : 'opacity-0 group-hover:opacity-100'
                                                    }`}
                                                    aria-label="Open conversation menu"
                                                >
                                                    <MoreVertical className="w-4 h-4" />
                                                </button>
                                                <ConversationActionMenu
                                                    userId={conv.line_user_id}
                                                    isOpen={activeActionMenu === conv.line_user_id}
                                                    onClose={handleActionMenuClose}
                                                    onAction={handleConversationAction}
                                                />
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </aside>

            {/* CHAT PANEL - Offset by sidebar width */}
            <main
                className={`h-screen flex flex-col bg-slate-50 transition-all duration-300 ${
                    isSidebarCollapsed ? 'ml-20' : 'ml-64'
                }`}
            >
                {!selectedId ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
                            <MessageCircle className="w-12 h-12 text-slate-300" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-600">Select a conversation</h3>
                        <p className="text-sm mt-1 text-slate-500">Choose a user from the sidebar to start chatting</p>
                    </div>
                ) : (
                    <>
                        {/* Chat Header */}
                        <div className="h-16 border-b border-slate-200 px-6 flex items-center justify-between bg-white z-10 flex-shrink-0">
                            <div className="flex items-center gap-4">
                                <img src={currentChat?.picture_url} className="w-10 h-10 rounded-full border border-slate-100" />
                                <div>
                                    <h3 className="font-bold text-slate-800">{currentChat?.display_name}</h3>
                                    <div className="flex items-center gap-2 text-xs">
                                        <span className={`px-2 py-0.5 rounded-full font-bold ${currentChat?.chat_mode === 'HUMAN' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'
                                            }`}>
                                            {currentChat?.chat_mode === 'HUMAN' ? 'HUMAN MODE' : 'BOT MODE'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <ChatModeToggle
                                    currentMode={currentChat?.chat_mode || 'BOT'}
                                    onToggle={handleToggleMode}
                                    disabled={false}
                                />
                                <div className="h-6 w-px bg-slate-200 mx-1"></div>
                                {!currentChat?.session || currentChat?.session.status === 'WAITING' ? (
                                    <button
                                        onClick={handleClaim}
                                        className="px-4 py-2 bg-emerald-500 text-white rounded-lg font-bold text-xs shadow-md shadow-emerald-500/20 hover:bg-emerald-600 transition-all"
                                    >
                                        Claim Chat
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleClose}
                                        className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg font-bold text-xs hover:bg-slate-200 transition-all"
                                    >
                                        Resolve & Close
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-slate-100">
                            {messages.map((msg) => {
                                const isIncoming = msg.direction === 'INCOMING';
                                const isBot = msg.sender_role === 'BOT';
                                const isAdmin = msg.sender_role === 'ADMIN';
                                return (
                                    <div key={msg.id} className={`flex ${isIncoming ? 'justify-start' : 'justify-end'}`}>
                                        <div className={`max-w-[70%] space-y-1 ${isIncoming ? 'items-start' : 'items-end'} flex flex-col`}>
                                            {/* Sender Label (for outgoing messages) */}
                                            {!isIncoming && (
                                                <span className="text-[10px] font-bold text-slate-500 px-2 flex items-center gap-1">
                                                    {isBot ? (
                                                        <>
                                                            <Bot className="w-3 h-3" /> BOT
                                                        </>
                                                    ) : isAdmin ? (
                                                        <>
                                                            <User className="w-3 h-3" /> ADMIN
                                                        </>
                                                    ) : (
                                                        <>
                                                            <User className="w-3 h-3" /> SYSTEM
                                                        </>
                                                    )}
                                                </span>
                                            )}
                                            {/* Message Bubble */}
                                            <div
                                                className={`px-4 py-3 rounded-2xl text-sm shadow-sm leading-relaxed ${
                                                    isIncoming
                                                        ? 'bg-white text-slate-900 border border-slate-200 rounded-tl-none'
                                                        : isBot
                                                        ? 'bg-slate-200 text-slate-900 rounded-tr-none border border-slate-300'
                                                        : 'bg-indigo-600 text-white rounded-tr-none shadow-md shadow-indigo-500/20'
                                                }`}
                                            >
                                                {msg.message_type === 'flex' ? (
                                                    <div className="italic opacity-80 flex items-center gap-2">
                                                        <Info className="w-4 h-4" /> Flex Message
                                                    </div>
                                                ) : (
                                                    msg.content
                                                )}
                                            </div>
                                            {/* Timestamp */}
                                            <span className="text-[10px] text-slate-400 px-2">
                                                {new Date(msg.created_at).toLocaleTimeString([], {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                            {isTyping && (
                                <div className="flex justify-end">
                                    <TypingIndicator isTyping={isTyping} label="Operator typing" />
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="p-4 bg-white border-t border-slate-100">
                            <form onSubmit={handleSendMessage} className="flex gap-3 max-w-5xl mx-auto">
                                <button type="button" className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                                    <MoreVertical className="w-6 h-6" />
                                </button>
                                <div className="flex-1 relative">
                                    <input
                                        type="text"
                                        value={inputText}
                                        onChange={(e) => setInputText(e.target.value)}
                                        disabled={currentChat?.chat_mode === 'BOT'}
                                        placeholder={currentChat?.chat_mode === 'BOT' ? "Switch to Manual Mode to reply..." : "Type your message..."}
                                        className="w-full pl-5 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all disabled:opacity-60"
                                    />
                                    <button type="submit" disabled={!inputText.trim() || sending || currentChat?.chat_mode === 'BOT'} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 text-white rounded-lg shadow-md hover:scale-105 active:scale-95 disabled:opacity-0 disabled:scale-90 transition-all">
                                        <Send className="w-4 h-4" />
                                    </button>
                                </div>
                            </form>
                        </div>
                    </>
                )}
            </main>
        </>
    );
}
