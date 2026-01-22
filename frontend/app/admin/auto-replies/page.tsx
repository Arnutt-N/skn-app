'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface IntentCategory {
    id: number;
    name: string;
    description?: string;
    is_active: boolean;
    keyword_count: number;
    response_count: number;
    keywords_preview: string[];
}

export default function IntentsPage() {
    const [categories, setCategories] = useState<IntentCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [formData, setFormData] = useState({ name: '', description: '', is_active: true });
    const router = useRouter();

    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/admin/intents/categories`);
            if (res.ok) setCategories(await res.json());
        } catch (error) {
            console.error('Error fetching categories:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await fetch(`${API_BASE}/admin/intents/categories`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        if (res.ok) {
            await fetchCategories();
            setShowAddForm(false);
            setFormData({ name: '', description: '', is_active: true });
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('ต้องการลบ Category นี้?')) return;

        const res = await fetch(`${API_BASE}/admin/intents/categories/${id}`, {
            method: 'DELETE'
        });

        if (res.ok) {
            fetchCategories();
        }
    };

    const handleToggleStatus = async (id: number, isActive: boolean) => {
        const res = await fetch(`${API_BASE}/admin/intents/categories/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_active: isActive })
        });

        if (res.ok) {
            fetchCategories();
        }
    };
    return (
        <div className="space-y-5 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-700">Intent Categories</h1>
                    <p className="text-sm text-slate-500 mt-1">จัดการหมวดหมู่การตอบกลับอัตโนมัติ</p>
                </div>
                <button
                    onClick={() => setShowAddForm(true)}
                    className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors text-sm font-medium"
                >
                    + New Category
                </button>
            </div>

            {/* Add Form Modal */}
            {showAddForm && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl">
                        <h2 className="text-lg font-semibold text-slate-700 mb-4">เพิ่ม Category ใหม่</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">ชื่อ Category</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">คำอธิบาย</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    rows={3}
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={formData.is_active}
                                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                    className="w-4 h-4 text-indigo-500 rounded"
                                />
                                <label className="text-sm text-slate-600">เปิดใช้งาน</label>
                            </div>
                            <div className="flex gap-2 pt-2">
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors text-sm font-medium"
                                >
                                    บันทึก
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowAddForm(false)}
                                    className="flex-1 px-4 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium"
                                >
                                    ยกเลิก
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm">
                <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                            <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Category</th>
                            <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Keywords</th>
                            <th className="px-5 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">สถานะ</th>
                            <th className="px-5 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">จัดการ</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {loading ? (
                            // Skeleton Loading
                            [...Array(5)].map((_, i) => (
                                <tr key={i} className="animate-pulse">
                                    <td className="px-5 py-4">
                                        <div className="h-4 bg-slate-200 rounded w-32 mb-2"></div>
                                        <div className="h-3 bg-slate-100 rounded w-48"></div>
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="h-3 bg-slate-100 rounded w-40"></div>
                                    </td>
                                    <td className="px-5 py-4 text-center">
                                        <div className="mx-auto h-4 w-7 bg-slate-200 rounded-full"></div>
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center justify-center gap-1">
                                            <div className="h-8 w-8 bg-slate-100 rounded-lg"></div>
                                            <div className="h-8 w-8 bg-slate-100 rounded-lg"></div>
                                            <div className="h-8 w-8 bg-slate-100 rounded-lg"></div>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : categories.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-5 py-8 text-center text-slate-400 text-sm">
                                    ยังไม่มี Category
                                </td>
                            </tr>
                        ) : (
                            categories.map((category) => (
                                <tr key={category.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-5 py-4">
                                        <div className="font-medium text-slate-700">{category.name}</div>
                                    </td>
                                    <td className="px-5 py-4">
                                        {category.keywords_preview && category.keywords_preview.length > 0 ? (
                                            <div className="text-sm text-slate-600">
                                                {category.keywords_preview.slice(0, 3).join(', ')}
                                                {category.keyword_count > 3 && (
                                                    <span className="text-slate-400"> ...</span>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-sm text-slate-400">-</span>
                                        )}
                                    </td>
                                    <td className="px-5 py-4 text-center">
                                        <button
                                            onClick={() => handleToggleStatus(category.id, !category.is_active)}
                                            className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${category.is_active ? 'bg-indigo-500' : 'bg-slate-200'
                                                }`}
                                        >
                                            <span
                                                className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform shadow-sm ${category.is_active ? 'translate-x-3.5' : 'translate-x-0.5'
                                                    }`}
                                            />
                                        </button>
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center justify-center gap-1">
                                            <Link
                                                href={`/admin/auto-replies/${category.id}`}
                                                className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                title="เรียกดู"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                            </Link>
                                            <Link
                                                href={`/admin/auto-replies/${category.id}?mode=edit`}
                                                className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                                title="แก้ไข"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(category.id)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="ลบ"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
