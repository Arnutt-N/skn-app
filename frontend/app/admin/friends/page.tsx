'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { MoreVertical, User } from 'lucide-react';
import type { SelectOption } from '@/components/ui/Select';
import { AdminSearchFilterBar } from '@/components/admin/AdminSearchFilterBar';
import { AdminTableHead, type AdminTableHeadColumn } from '@/components/admin/AdminTableHead';

interface Friend {
    line_user_id: string;
    display_name: string;
    picture_url?: string;
    friend_status: string;
    friend_since?: string;
    last_message_at?: string;
    chat_mode: string;
}

export default function FriendsPage() {
    const [friends, setFriends] = useState<Friend[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState<string | null>(null);
    const statusOptions: SelectOption[] = [
        { value: '', label: 'All Status' },
        { value: 'ACTIVE', label: 'Active' },
        { value: 'BLOCKED', label: 'Blocked' },
        { value: 'UNFOLLOWED', label: 'Unfollowed' },
    ];
    const tableColumns: AdminTableHeadColumn[] = [
        { key: 'user', label: 'User', className: 'px-6 py-4' },
        { key: 'status', label: 'Status', className: 'px-6 py-4' },
        { key: 'chat_mode', label: 'Chat Mode', className: 'px-6 py-4' },
        { key: 'since', label: 'Since', className: 'px-6 py-4' },
        { key: 'last_active', label: 'Last Active', className: 'px-6 py-4' },
        { key: 'actions', label: 'Actions', align: 'right', className: 'px-6 py-4' },
    ];

    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

    const fetchFriends = useCallback(async () => {
        setLoading(true);
        try {
            const query = statusFilter ? `?status=${statusFilter}` : '';
            const res = await fetch(`${API_BASE}/admin/friends${query}`);
            if (res.ok) {
                const data = await res.json();
                setFriends(data.friends);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [API_BASE, statusFilter]);

    useEffect(() => {
        fetchFriends();
    }, [fetchFriends]);

    const filteredFriends = friends.filter(f =>
        f.display_name?.toLowerCase().includes(filter.toLowerCase()) ||
        f.line_user_id.toLowerCase().includes(filter.toLowerCase())
    );

    return (
        <div className="p-6 max-w-7xl mx-auto thai-text">
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight thai-no-break">LINE Friends</h1>
                    <p className="text-slate-400 text-sm thai-no-break">Manage users who follow the Official Account</p>
                </div>
            </div>

            <div className="mb-6">
                <AdminSearchFilterBar
                    searchValue={filter}
                    onSearchChange={setFilter}
                    statusValue={statusFilter ?? ''}
                    onStatusChange={(value) => setStatusFilter(value || null)}
                    searchPlaceholder="Search users..."
                    statusOptions={statusOptions}
                    showCategory={false}
                />
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100/60 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <AdminTableHead columns={tableColumns} rowClassName="text-slate-500" />
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">Loading friends...</td>
                                </tr>
                            ) : filteredFriends.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">No users found.</td>
                                </tr>
                            ) : (
                                filteredFriends.map((friend) => (
                                    <tr key={friend.line_user_id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden">
                                                    {friend.picture_url ? (
                                                        // eslint-disable-next-line @next/next/no-img-element
                                                        <img src={friend.picture_url} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                                                            <User className="w-5 h-5" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-slate-900">{friend.display_name || 'Unknown'}</div>
                                                    <div className="text-xs text-slate-400 font-mono">{friend.line_user_id.substring(0, 8)}...</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${friend.friend_status === 'ACTIVE' ? 'bg-success/12 text-success' :
                                                    friend.friend_status === 'BLOCKED' ? 'bg-danger/12 text-danger' :
                                                        'bg-slate-100 text-slate-600'
                                                }`}>
                                                {friend.friend_status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${friend.chat_mode === 'HUMAN' ? 'bg-primary/12 text-primary' : 'bg-slate-100 text-slate-600'
                                                }`}>
                                                {friend.chat_mode}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                            {friend.friend_since ? new Date(friend.friend_since).toLocaleDateString() : '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                            {friend.last_message_at ? new Date(friend.last_message_at).toLocaleString() : '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <button className="text-slate-400 hover:text-primary transition-colors">
                                                <MoreVertical className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
