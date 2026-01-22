'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface IntentKeyword {
    id: number;
    keyword: string;
    match_type: string;
}

interface IntentResponse {
    id: number;
    reply_type: string;
    text_content?: string;
    payload?: any;
    is_active: boolean;
    order: number;
}

interface IntentCategory {
    id: number;
    name: string;
    description?: string;
    is_active: boolean;
    keywords: IntentKeyword[];
    responses: IntentResponse[];
}

const MATCH_TYPES = ['exact', 'contains', 'starts_with', 'regex'];
const REPLY_TYPES = ['text', 'flex', 'image', 'sticker', 'video'];

export default function CategoryDetailPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const mode = searchParams.get('mode'); // 'edit' or undefined (view)

    const [category, setCategory] = useState<IntentCategory | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(mode === 'edit');
    const [payloadError, setPayloadError] = useState<string | null>(null);

    // Forms
    const [showKeywordForm, setShowKeywordForm] = useState(false);
    const [showResponseForm, setShowResponseForm] = useState(false);
    const [keywordFormData, setKeywordFormData] = useState({ id: null as number | null, keyword: '', match_type: 'contains' });
    const [responseFormData, setResponseFormData] = useState({
        id: null as number | null,
        reply_type: 'text',
        text_content: '',
        payload: '{}', // Stringifed JSON for editing
        is_active: true
    });
    const [categoryFormData, setCategoryFormData] = useState({ name: '', description: '', is_active: true });

    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

    useEffect(() => {
        fetchCategoryDetail();
    }, [params.id]);

    useEffect(() => {
        if (category) {
            setCategoryFormData({
                name: category.name,
                description: category.description || '',
                is_active: category.is_active
            });
        }
    }, [category]);

    const fetchCategoryDetail = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/admin/intents/categories/${params.id}`);
            if (res.ok) setCategory(await res.json());
        } catch (error) {
            console.error('Error fetching category:', error);
        } finally {
            setLoading(false);
        }
    };

    // Category Update
    const handleCategoryUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await fetch(`${API_BASE}/admin/intents/categories/${params.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(categoryFormData)
        });
        if (res.ok) {
            await fetchCategoryDetail();
            setIsEditing(false);
        }
    };

    // Keyword Management
    const handleKeywordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const url = keywordFormData.id
            ? `${API_BASE}/admin/intents/keywords/${keywordFormData.id}`
            : `${API_BASE}/admin/intents/keywords`;
        const res = await fetch(url, {
            method: keywordFormData.id ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...keywordFormData, category_id: params.id })
        });
        if (res.ok) {
            await fetchCategoryDetail();
            setShowKeywordForm(false);
            setKeywordFormData({ id: null, keyword: '', match_type: 'contains' });
        }
    };

    const handleDeleteKeyword = async (id: number) => {
        if (!confirm('ลบ Keyword นี้?')) return;
        const res = await fetch(`${API_BASE}/admin/intents/keywords/${id}`, { method: 'DELETE' });
        if (res.ok) fetchCategoryDetail();
    };

    // Response Management
    const handleResponseSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        let payload = null;
        if (responseFormData.reply_type === 'flex' || responseFormData.reply_type === 'template') {
            try {
                payload = JSON.parse(responseFormData.payload);
                setPayloadError(null);
            } catch (err) {
                setPayloadError('Invalid JSON format');
                return;
            }
        }

        const url = responseFormData.id
            ? `${API_BASE}/admin/intents/responses/${responseFormData.id}`
            : `${API_BASE}/admin/intents/responses`;

        const body = {
            ...responseFormData,
            payload: payload,
            category_id: params.id
        };

        const res = await fetch(url, {
            method: responseFormData.id ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (res.ok) {
            await fetchCategoryDetail();
            setShowResponseForm(false);
            resetResponseForm();
        }
    };

    const resetResponseForm = () => {
        setResponseFormData({ id: null, reply_type: 'text', text_content: '', payload: '{}', is_active: true });
        setPayloadError(null);
    };

    const handleEditResponse = (resp: IntentResponse) => {
        setResponseFormData({
            id: resp.id,
            reply_type: resp.reply_type,
            text_content: resp.text_content || '',
            payload: resp.payload ? JSON.stringify(resp.payload, null, 2) : '{}',
            is_active: resp.is_active
        });
        setShowResponseForm(true);
    };

    const handleDeleteResponse = async (id: number) => {
        if (!confirm('ลบ Response นี้?')) return;
        const res = await fetch(`${API_BASE}/admin/intents/responses/${id}`, { method: 'DELETE' });
        if (res.ok) fetchCategoryDetail();
    };

    if (loading) return <div className="p-8 text-center text-slate-400">กำลังโหลด...</div>;
    if (!category) return <div className="p-8 text-center text-slate-400">ไม่พบข้อมูล</div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link
                        href="/admin/auto-replies"
                        className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </Link>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-slate-800">{category.name}</h1>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${category.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                                {category.is_active ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                            <span>{category.keywords.length} keywords</span>
                            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                            <span>{category.responses.length} responses</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsEditing(!isEditing)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${isEditing
                                ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                            }`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        {isEditing ? 'Cancel Edit' : 'Edit Details'}
                    </button>
                    {isEditing && (
                        <button
                            onClick={handleCategoryUpdate}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all text-sm font-medium shadow-sm shadow-indigo-200"
                        >
                            Save Changes
                        </button>
                    )}
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column: Details & Keywords */}
                <div className="space-y-6 lg:col-span-2">

                    {/* Description Card */}
                    {(category.description || isEditing) && (
                        <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-6">
                            <h3 className="text-sm font-semibold text-slate-800 mb-3 uppercase tracking-wider">Description</h3>
                            {isEditing ? (
                                <textarea
                                    value={categoryFormData.description}
                                    onChange={(e) => setCategoryFormData({ ...categoryFormData, description: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all"
                                    rows={3}
                                    placeholder="Add a description..."
                                />
                            ) : (
                                <p className="text-slate-600 text-sm leading-relaxed">{category.description || 'No description provided.'}</p>
                            )}

                            {isEditing && (
                                <div className="mt-4 pt-4 border-t border-slate-100">
                                    <div className="flex items-center gap-3">
                                        <label className="text-sm font-medium text-slate-700">Category Name</label>
                                        <input
                                            type="text"
                                            value={categoryFormData.name}
                                            onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                                            className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2 mt-3">
                                        <input
                                            type="checkbox"
                                            checked={categoryFormData.is_active}
                                            onChange={(e) => setCategoryFormData({ ...categoryFormData, is_active: e.target.checked })}
                                            className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                                            id="isActive"
                                        />
                                        <label htmlFor="isActive" className="text-sm text-slate-600 cursor-pointer select-none">Active Status</label>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Keywords Card */}
                    <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
                            <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">Keywords</h3>
                            <button
                                onClick={() => setShowKeywordForm(true)}
                                className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                title="Add Keyword"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                            </button>
                        </div>
                        <div className="p-6">
                            {category.keywords.length === 0 ? (
                                <div className="text-center py-8">
                                    <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-300">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                                        </svg>
                                    </div>
                                    <p className="text-slate-500 text-sm">No keywords defined yet</p>
                                    <button onClick={() => setShowKeywordForm(true)} className="text-indigo-600 text-sm font-medium mt-2 hover:underline">Add one now</button>
                                </div>
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    {category.keywords.map((kw) => (
                                        <div key={kw.id} className="group flex items-center bg-slate-50 border border-slate-100 rounded-full pl-3 pr-2 py-1.5 transition-all hover:border-indigo-200 hover:bg-indigo-50/30">
                                            <span className="text-sm text-slate-700 font-medium">{kw.keyword}</span>
                                            <span className="mx-2 text-[10px] text-slate-400 uppercase tracking-wide bg-white px-1.5 py-0.5 rounded border border-slate-100">
                                                {kw.match_type === 'exact' ? '=' : kw.match_type === 'contains' ? 'abc' : '*'}
                                            </span>
                                            <button
                                                onClick={() => handleDeleteKeyword(kw.id)}
                                                className="w-5 h-5 flex items-center justify-center rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                                            >
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                </div>

                {/* Right Column: Responses */}
                <div className="space-y-6">
                    <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden h-full">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
                            <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">Responses</h3>
                            <button
                                onClick={() => { resetResponseForm(); setShowResponseForm(true); }}
                                className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                title="Add Response"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                            </button>
                        </div>
                        <div className="p-4 space-y-3">
                            {category.responses.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-300">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                        </svg>
                                    </div>
                                    <p className="text-slate-500 text-sm">No responses configured</p>
                                </div>
                            ) : (
                                category.responses.map((resp, index) => (
                                    <div key={resp.id} className="group relative bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md transition-all hover:border-indigo-200">
                                        <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleEditResponse(resp)}
                                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => handleDeleteResponse(resp.id)}
                                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>

                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="w-6 h-6 flex items-center justify-center bg-slate-100 rounded-full text-xs font-bold text-slate-500">
                                                {index + 1}
                                            </span>
                                            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide ${resp.reply_type === 'text' ? 'bg-blue-50 text-blue-600' :
                                                    resp.reply_type === 'flex' ? 'bg-purple-50 text-purple-600' :
                                                        resp.reply_type === 'image' ? 'bg-pink-50 text-pink-600' :
                                                            'bg-slate-100 text-slate-600'
                                                }`}>
                                                {resp.reply_type}
                                            </span>
                                            {!resp.is_active && (
                                                <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-400 rounded">Inactive</span>
                                            )}
                                        </div>

                                        <div className="text-sm text-slate-700">
                                            {resp.reply_type === 'text' ? (
                                                <p className="line-clamp-3 whitespace-pre-wrap">{resp.text_content}</p>
                                            ) : resp.payload ? (
                                                <div className="bg-slate-50 rounded p-2 border border-slate-100 font-mono text-xs text-slate-600 overflow-hidden">
                                                    <div className="flex items-center gap-2 text-slate-400 mb-1">
                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>
                                                        JSON Payload
                                                    </div>
                                                    <pre className="line-clamp-3">{JSON.stringify(resp.payload, null, 2)}</pre>
                                                </div>
                                            ) : (
                                                <p className="text-slate-400 italic">No content</p>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Keyword Form Modal */}
            {showKeywordForm && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-0 max-w-sm w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                            <h2 className="text-lg font-semibold text-slate-800">Add Keyword</h2>
                        </div>
                        <form onSubmit={handleKeywordSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Keyword Phrase</label>
                                <input
                                    type="text"
                                    value={keywordFormData.keyword}
                                    onChange={(e) => setKeywordFormData({ ...keywordFormData, keyword: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 text-sm transition-all"
                                    placeholder="e.g. hello, pricing, contact"
                                    required
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Match Logic</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {MATCH_TYPES.map(type => (
                                        <label key={type} className={`cursor-pointer border rounded-lg p-3 flex items-center gap-2 transition-all ${keywordFormData.match_type === type
                                                ? 'border-indigo-500 bg-indigo-50/50 text-indigo-700'
                                                : 'border-slate-200 hover:border-slate-300 text-slate-600'
                                            }`}>
                                            <input
                                                type="radio"
                                                name="match_type"
                                                value={type}
                                                checked={keywordFormData.match_type === type}
                                                onChange={(e) => setKeywordFormData({ ...keywordFormData, match_type: e.target.value })}
                                                className="hidden"
                                            />
                                            <span className="text-sm font-medium capitalize">{type.replace('_', ' ')}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowKeywordForm(false)} className="flex-1 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors text-sm font-medium">
                                    Cancel
                                </button>
                                <button type="submit" className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors text-sm font-medium shadow-lg shadow-indigo-200">
                                    Add Keyword
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Response Form Modal */}
            {showResponseForm && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-0 max-w-lg w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                            <h2 className="text-lg font-semibold text-slate-800">{responseFormData.id ? 'Edit Response' : 'Add Response'}</h2>
                            <button onClick={() => setShowResponseForm(false)} className="text-slate-400 hover:text-slate-600">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <form onSubmit={handleResponseSubmit} className="p-6 space-y-5">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Message Type</label>
                                <div className="flex flex-wrap gap-2">
                                    {REPLY_TYPES.map(type => (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() => setResponseFormData({ ...responseFormData, reply_type: type })}
                                            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${responseFormData.reply_type === type
                                                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                                }`}
                                        >
                                            {type.charAt(0).toUpperCase() + type.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Dynamic Fields based on Reply Type */}
                            {responseFormData.reply_type === 'text' && (
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Text Content</label>
                                    <textarea
                                        value={responseFormData.text_content}
                                        onChange={(e) => setResponseFormData({ ...responseFormData, text_content: e.target.value })}
                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 text-sm transition-all"
                                        rows={4}
                                        placeholder="Enter the reply message..."
                                        required
                                        autoFocus
                                    />
                                </div>
                            )}

                            {(responseFormData.reply_type === 'flex' || responseFormData.reply_type === 'template') && (
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                                        JSON Payload
                                        <span className="ml-2 text-[10px] normal-case bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">Required for Flex/Template</span>
                                    </label>
                                    <div className="relative">
                                        <textarea
                                            value={responseFormData.payload}
                                            onChange={(e) => {
                                                setResponseFormData({ ...responseFormData, payload: e.target.value });
                                                setPayloadError(null);
                                            }}
                                            className={`w-full px-4 py-3 border rounded-xl focus:ring-4 text-sm font-mono transition-all ${payloadError
                                                    ? 'border-red-300 focus:ring-red-100 focus:border-red-500'
                                                    : 'border-slate-200 focus:ring-indigo-500/10 focus:border-indigo-500'
                                                }`}
                                            rows={8}
                                            placeholder='{\n  "type": "flex",\n  "altText": "Start",\n  "contents": { ... }\n}'
                                        />
                                        {payloadError && (
                                            <div className="absolute bottom-3 right-3 text-xs text-red-500 font-medium bg-red-50 px-2 py-1 rounded">
                                                {payloadError}
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-400 mt-2">
                                        Tip: You can use <a href="https://developers.line.biz/flex-simulator/" target="_blank" className="text-indigo-500 hover:underline">LINE Flex Simulator</a> to generate JSON.
                                    </p>
                                </div>
                            )}

                            <div className="flex items-center gap-2 pt-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={responseFormData.is_active}
                                        onChange={(e) => setResponseFormData({ ...responseFormData, is_active: e.target.checked })}
                                        className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                                    />
                                    <span className="text-sm font-medium text-slate-700">Set as Active</span>
                                </label>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowResponseForm(false)} className="flex-1 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors text-sm font-medium">
                                    Cancel
                                </button>
                                <button type="submit" className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors text-sm font-medium shadow-lg shadow-indigo-200">
                                    {responseFormData.id ? 'Save Changes' : 'Create Response'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
