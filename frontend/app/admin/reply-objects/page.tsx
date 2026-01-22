'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface ReplyObject {
    id: number;
    object_id: string;
    name: string;
    object_type: string;
    category?: string;
    payload: any;
    alt_text?: string;
    is_active: boolean;
    created_at: string;
}

const OBJECT_TYPES = ['text', 'flex', 'image', 'sticker', 'video', 'audio', 'location'];

export default function ReplyObjectsPage() {
    const [objects, setObjects] = useState<ReplyObject[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        object_id: '',
        name: '',
        category: '',
        object_type: 'flex',
        payload: '{}',
        alt_text: ''
    });

    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

    useEffect(() => {
        fetchObjects();
    }, []);

    const fetchObjects = async () => {
        try {
            const res = await fetch(`${API_BASE}/admin/reply-objects`);
            if (res.ok) setObjects(await res.json());
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                payload: JSON.parse(formData.payload)
            };

            const url = editingId
                ? `${API_BASE}/admin/reply-objects/${editingId}`
                : `${API_BASE}/admin/reply-objects`;

            const res = await fetch(url, {
                method: editingId ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                await fetchObjects();
                resetForm();
            } else {
                const error = await res.json();
                alert(error.detail || 'Error saving');
            }
        } catch (error) {
            alert('Invalid JSON payload');
        }
    };

    const handleEdit = (obj: ReplyObject) => {
        setFormData({
            object_id: obj.object_id,
            name: obj.name,
            category: obj.category || '',
            object_type: obj.object_type,
            payload: JSON.stringify(obj.payload, null, 2),
            alt_text: obj.alt_text || ''
        });
        setEditingId(obj.object_id);
        setShowForm(true);
    };

    const handleDelete = async (objectId: string) => {
        if (!confirm(`Delete $${objectId}?`)) return;

        const res = await fetch(`${API_BASE}/admin/reply-objects/${objectId}`, {
            method: 'DELETE'
        });

        if (res.ok) fetchObjects();
    };

    const resetForm = () => {
        setFormData({ object_id: '', name: '', category: '', object_type: 'flex', payload: '{}', alt_text: '' });
        setEditingId(null);
        setShowForm(false);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-800">Reply Objects</h1>
                    <p className="text-slate-500 font-medium">Manage reusable message templates</p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl hover:from-indigo-500 hover:to-purple-500 transition-all font-bold shadow-lg shadow-indigo-600/20 active:scale-95 text-white"
                >
                    + New Template
                </button>
            </div>

            {/* Objects Grid */}
            {loading ? (
                <div className="flex flex-col items-center justify-center min-h-[400px]">
                    <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                    <p className="mt-4 text-slate-400 font-bold tracking-widest text-xs uppercase">Loading Assets...</p>
                </div>
            ) : objects.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[400px] bg-white rounded-[3rem] border border-slate-200 border-dashed p-20 text-center">
                    <div className="w-32 h-32 bg-indigo-50 rounded-full flex items-center justify-center mb-10 border border-indigo-100 shadow-inner">
                        <svg className="w-12 h-12 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                    </div>
                    <h3 className="text-3xl font-black text-slate-800 mb-4 tracking-tight">Empty Repository</h3>
                    <p className="text-slate-500 text-lg max-w-sm leading-relaxed">No reusable templates found. Create your first template to simplify your automated responses.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {objects.map((obj) => (
                        <div
                            key={obj.id}
                            className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden hover:border-indigo-200 transition-all duration-300 group relative shadow-lg hover:shadow-xl"
                        >
                            <div className="p-8">
                                <div className="flex items-start justify-between mb-6">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-indigo-500 font-black font-mono text-sm tracking-tighter">${obj.object_id}</span>
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-800 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{obj.name}</h3>
                                    </div>
                                    <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border shadow-sm ${obj.object_type === 'flex' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                                        obj.object_type === 'image' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                            obj.object_type === 'sticker' ? 'bg-yellow-50 text-yellow-600 border-yellow-100' :
                                                'bg-slate-50 text-slate-500 border-slate-100'
                                        }`}>
                                        {obj.object_type}
                                    </span>
                                </div>

                                {obj.category && (
                                    <div className="flex items-center gap-2 mb-6 text-slate-400 uppercase tracking-widest text-[9px] font-bold">
                                        <span className="w-1 h-1 bg-slate-400 rounded-full" />
                                        {obj.category}
                                    </div>
                                )}

                                <div className="flex gap-3 h-12">
                                    <button
                                        onClick={() => handleEdit(obj)}
                                        className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-bold transition-all border border-slate-100 uppercase tracking-widest hover:text-indigo-600"
                                    >
                                        Modify
                                    </button>
                                    <button
                                        onClick={() => handleDelete(obj.object_id)}
                                        className="px-4 bg-red-50 hover:bg-red-100 text-red-400 hover:text-red-500 rounded-xl transition-all border border-red-100"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] border border-slate-200 w-full max-w-3xl flex flex-col max-h-[90vh] shadow-2xl overflow-hidden scale-in-95 animate-in duration-300">
                        <div className="p-10 border-b border-slate-100 flex justify-between items-center shrink-0 bg-slate-50/50">
                            <div>
                                <p className="text-indigo-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Configuration</p>
                                <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">
                                    {editingId ? 'Edit Object' : 'New Template'}
                                </h2>
                            </div>
                            <button onClick={resetForm} className="p-3 bg-white hover:bg-slate-100 rounded-2xl text-slate-400 hover:text-slate-600 transition-colors shadow-sm border border-slate-100">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-10 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Universal ID *</label>
                                    <input
                                        type="text"
                                        value={formData.object_id}
                                        onChange={(e) => setFormData({ ...formData, object_id: e.target.value })}
                                        disabled={!!editingId}
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white disabled:opacity-50 transition-all font-mono"
                                        placeholder="flex_welcome"
                                        required
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Internal Name *</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all"
                                        placeholder="Welcome Message 2.0"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Message Protocol *</label>
                                    <div className="relative">
                                        <select
                                            value={formData.object_type}
                                            onChange={(e) => setFormData({ ...formData, object_type: e.target.value })}
                                            className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 font-bold appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all cursor-pointer"
                                        >
                                            {OBJECT_TYPES.map(t => (
                                                <option key={t} value={t} className="bg-white text-slate-800">{t.toUpperCase()}</option>
                                            ))}
                                        </select>
                                        <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Grouping Category</label>
                                    <input
                                        type="text"
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all"
                                        placeholder="Marketing / Support"
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Alt Text (Mobile/Tablet accessibility)</label>
                                <input
                                    type="text"
                                    value={formData.alt_text}
                                    onChange={(e) => setFormData({ ...formData, alt_text: e.target.value })}
                                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all"
                                    placeholder="Brief description of the message"
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">JSON Payload *</label>
                                <textarea
                                    value={formData.payload}
                                    onChange={(e) => setFormData({ ...formData, payload: e.target.value })}
                                    rows={12}
                                    className="w-full px-8 py-6 bg-slate-900 border border-slate-800 rounded-[2rem] text-indigo-300 font-mono text-xs focus:outline-none focus:border-indigo-500/50 transition-all overscroll-contain"
                                    placeholder="{ ... }"
                                    required
                                />
                            </div>

                            <div className="pt-6 shrink-0">
                                <button
                                    type="submit"
                                    className="w-full py-5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-3xl font-black uppercase tracking-[0.3em] transition-all shadow-xl shadow-indigo-600/20 active:scale-[0.98]"
                                >
                                    {editingId ? 'Save Modifications' : 'Initialize Template'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
