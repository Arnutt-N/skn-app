"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

interface RichMenu {
    id: number;
    name: string;
    chat_bar_text: string;
    line_rich_menu_id: string | null;
    status: string;
    image_path: string | null;
    created_at: string;
}

export default function RichMenuListPage() {
    const [menus, setMenus] = useState<RichMenu[]>([]);
    const [loading, setLoading] = useState(true);
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

    const fetchMenus = async () => {
        try {
            const res = await fetch(`${API_BASE}/admin/rich-menus`);
            if (res.ok) {
                const data = await res.json();
                setMenus(data);
            }
        } catch (error) {
            console.error("Failed to fetch rich menus", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMenus();
    }, []);

    const handleDelete = async (id: number) => {
        if (!confirm("ต้องการลบ Rich Menu นี้?")) return;

        try {
            const res = await fetch(`${API_BASE}/admin/rich-menus/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setMenus(menus.filter(m => m.id !== id));
            }
        } catch (error) {
            alert("Failed to delete rich menu");
        }
    };

    const handleSync = async (id: number) => {
        try {
            const res = await fetch(`${API_BASE}/admin/rich-menus/${id}/sync`, { method: 'POST' });
            if (res.ok) {
                alert("Sync ไปยัง LINE สำเร็จ!");
                fetchMenus();
            } else {
                const err = await res.json();
                alert(`Sync failed: ${err.detail}`);
            }
        } catch (error) {
            alert("Error syncing to LINE");
        }
    };

    const handlePublish = async (id: number) => {
        try {
            const res = await fetch(`${API_BASE}/admin/rich-menus/${id}/publish`, { method: 'POST' });
            if (res.ok) {
                alert("ตั้งเป็นเมนูหลักสำเร็จ!");
                fetchMenus();
            } else {
                const err = await res.json();
                alert(`Publish failed: ${err.detail}`);
            }
        } catch (error) {
            alert("Error publishing rich menu");
        }
    };

    const getImageUrl = (path: string | null) => {
        if (!path) return null;
        const baseHost = API_BASE.split('/api/')[0]; // Gets http://localhost:8000
        return `${baseHost}/${path}`;
    };

    return (
        <div className="space-y-5 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-bold text-slate-700">Rich Menus</h1>
                    <p className="text-sm text-slate-500 mt-1">จัดการเมนู LINE Official Account</p>
                </div>
                <Link
                    href="/admin/rich-menus/new"
                    className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors text-sm font-medium flex items-center gap-2 shadow-sm cursor-pointer active:scale-95"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    + New Menu
                </Link>
            </div>

            {loading ? (
                <div className="bg-white rounded-xl border border-slate-100 p-12 text-center shadow-sm">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                    <p className="mt-2 text-slate-400 text-sm">กำลังโหลดข้อมูล...</p>
                </div>
            ) : menus.length === 0 ? (
                <div className="bg-white rounded-xl border border-dashed border-slate-200 p-12 text-center">
                    <p className="text-slate-400 text-sm">ไม่พบข้อมูลเมนูในระบบ</p>
                    <Link href="/admin/rich-menus/new" className="text-indigo-500 text-sm mt-2 block hover:underline cursor-pointer">สร้างเมนูแรกของคุณ &rarr;</Link>
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                <th className="px-5 py-3 w-40 text-center">Preview</th>
                                <th className="px-5 py-3">รายละเอียดเมนู</th>
                                <th className="px-5 py-3 text-center">สถานะ</th>
                                <th className="px-5 py-3 text-center">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {menus.map((menu) => (
                                <tr key={menu.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-5 py-4">
                                        <div className="w-32 aspect-[250/168.6] bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                                            {menu.image_path ? (
                                                <img
                                                    src={getImageUrl(menu.image_path) || ''}
                                                    alt={menu.name}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        const target = e.target as HTMLImageElement;
                                                        if (!target.src.includes('placehold.co')) {
                                                            target.src = 'https://placehold.co/250x168?text=Image+Load+Error';
                                                        }
                                                    }}
                                                />
                                            ) : (
                                                <div className="flex items-center justify-center h-full text-[10px] text-slate-400 text-center bg-slate-50 px-2 uppercase">
                                                    No Image
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="font-semibold text-slate-700">{menu.name}</div>
                                        <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                                            <span className="font-medium">Bar Text:</span>
                                            <span className="italic">"{menu.chat_bar_text}"</span>
                                        </div>
                                        <div className="text-[10px] text-slate-400 mt-1 font-mono">{menu.line_rich_menu_id || 'LOCAL_ONLY'}</div>
                                    </td>
                                    <td className="px-5 py-4 text-center">
                                        <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full border ${menu.status === 'PUBLISHED'
                                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                : menu.line_rich_menu_id
                                                    ? 'bg-blue-50 text-blue-600 border-blue-100'
                                                    : 'bg-amber-50 text-amber-600 border-amber-100'
                                            }`}>
                                            {menu.status === 'PUBLISHED' ? 'ACTIVE' : menu.line_rich_menu_id ? 'SYNCED' : 'DRAFT'}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center justify-center gap-4">
                                            {/* Primary Action Button */}
                                            {!menu.line_rich_menu_id ? (
                                                <button
                                                    onClick={() => handleSync(menu.id)}
                                                    className="px-4 py-2 bg-indigo-500 text-white hover:bg-indigo-600 rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer whitespace-nowrap active:scale-95"
                                                >
                                                    Sync to LINE
                                                </button>
                                            ) : menu.status !== 'PUBLISHED' ? (
                                                <button
                                                    onClick={() => handlePublish(menu.id)}
                                                    className="px-4 py-2 bg-emerald-500 text-white hover:bg-emerald-600 rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer whitespace-nowrap active:scale-95"
                                                >
                                                    Set Active
                                                </button>
                                            ) : (
                                                <div className="text-[10px] font-black text-emerald-600 px-3 py-1 bg-emerald-50 rounded-full border border-emerald-100 uppercase tracking-widest leading-none">Live Now</div>
                                            )}

                                            {/* Icons Actions: Edit then Delete */}
                                            <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
                                                <Link
                                                    href={`/admin/rich-menus/${menu.id}/edit`}
                                                    className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all cursor-pointer group/icon"
                                                    title="แก้ไข"
                                                >
                                                    <svg className="w-5 h-5 transition-transform group-hover/icon:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </Link>

                                                <button
                                                    onClick={() => handleDelete(menu.id)}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer group/icon"
                                                    title="ลบ"
                                                >
                                                    <svg className="w-5 h-5 transition-transform group-hover/icon:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
