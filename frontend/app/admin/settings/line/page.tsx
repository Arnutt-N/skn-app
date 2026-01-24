"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/ui/Modal';

export default function LineSettingsPage() {
    const router = useRouter();
    const [settings, setSettings] = useState({
        LINE_CHANNEL_ACCESS_TOKEN: '',
        LINE_CHANNEL_SECRET: '',
    });
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<string | null>(null); // 'CONNECT' | 'SAVE'
    const [validationResult, setValidationResult] = useState<any>(null); // { success: boolean, botInfo, error }
    const [canSave, setCanSave] = useState(false);

    // Modals
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [showSaveSuccessModal, setShowSaveSuccessModal] = useState(false);
    const [showUnsavedModal, setShowUnsavedModal] = useState(false);
    const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);

    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

    const fetchSettings = async () => {
        try {
            const res = await fetch(`${API_BASE}/admin/settings`);
            if (res.ok) {
                const data = await res.json();
                const mapped = {
                    LINE_CHANNEL_ACCESS_TOKEN: data.find((s: any) => s.key === 'LINE_CHANNEL_ACCESS_TOKEN')?.value || '',
                    LINE_CHANNEL_SECRET: data.find((s: any) => s.key === 'LINE_CHANNEL_SECRET')?.value || '',
                };
                setSettings(mapped);
                if (!mapped.LINE_CHANNEL_ACCESS_TOKEN || !mapped.LINE_CHANNEL_SECRET) {
                    setIsEditing(true);
                }
            }
        } catch (error) {
            console.error("Failed to fetch settings", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    // Warn on browser refresh/close
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isEditing) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isEditing]);

    const handleNavigationAttempt = (href: string) => {
        if (isEditing) {
            setPendingNavigation(href);
            setShowUnsavedModal(true);
        } else {
            router.push(href);
        }
    };

    const confirmNavigation = () => {
        if (pendingNavigation) {
            router.push(pendingNavigation);
        }
    };

    const handleConnect = async () => {
        setProcessing('CONNECT');
        setValidationResult(null);
        setCanSave(false);

        try {
            const res = await fetch(`${API_BASE}/admin/settings/line/validate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ channel_access_token: settings.LINE_CHANNEL_ACCESS_TOKEN })
            });
            const data = await res.json();

            if (res.ok) {
                setValidationResult({ success: true, botInfo: data.data });
                setCanSave(true);
            } else {
                setValidationResult({ success: false, error: data.detail || 'Validation failed' });
                setCanSave(false);
            }
            setShowStatusModal(true);
        } catch (error: any) {
            setValidationResult({ success: false, error: error.message || 'Network error' });
            setShowStatusModal(true);
            setCanSave(false);
        } finally {
            setProcessing(null);
        }
    };

    const handleSave = async () => {
        setProcessing('SAVE');
        try {
            await fetch(`${API_BASE}/admin/settings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: 'LINE_CHANNEL_ACCESS_TOKEN', value: settings.LINE_CHANNEL_ACCESS_TOKEN, description: 'LINE API Access Token' })
            });

            await fetch(`${API_BASE}/admin/settings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: 'LINE_CHANNEL_SECRET', value: settings.LINE_CHANNEL_SECRET, description: 'LINE API Channel Secret' })
            });

            await fetchSettings();
            setIsEditing(false);
            setCanSave(false);
            setShowSaveSuccessModal(true);
        } catch (error) {
            alert('เกิดข้อผิดพลาดในการบันทึก');
        } finally {
            setProcessing(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-24">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-5 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-bold text-slate-700">LINE Messaging Settings</h1>
                    <p className="text-sm text-slate-500 mt-1">ตั้งค่า Credentials สำหรับ LINE Official Account</p>
                </div>
                <button
                    onClick={() => handleNavigationAttempt('/admin/settings')}
                    className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium cursor-pointer"
                >
                    ← กลับ
                </button>
            </div>

            {/* Warning Banner */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                <svg className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                    <p className="font-bold text-amber-800 text-sm">ข้อมูลสำคัญ</p>
                    <p className="text-amber-700 text-sm">Credentials เหล่านี้ให้สิทธิ์เข้าถึง LINE Official Account ของคุณอย่างเต็มรูปแบบ กรุณาเก็บรักษาเป็นความลับ</p>
                </div>
            </div>

            {/* Settings Card */}
            <div className={`bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden`}>
                <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
                    <h2 className="font-bold text-slate-800">Connection Settings</h2>
                    {!isEditing && (
                        <button
                            onClick={() => { setIsEditing(true); setValidationResult(null); setCanSave(false); }}
                            className="text-indigo-600 hover:text-indigo-800 text-sm font-bold flex items-center gap-1.5 cursor-pointer"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                            Edit
                        </button>
                    )}
                </div>

                <div className={`p-6 space-y-6 ${!isEditing ? 'opacity-75 pointer-events-none' : ''}`}>
                    {/* Channel Access Token */}
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700">
                            Channel Access Token (Long-lived)
                        </label>
                        <input
                            type="password"
                            disabled={!isEditing}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all disabled:opacity-75 disabled:cursor-not-allowed"
                            value={settings.LINE_CHANNEL_ACCESS_TOKEN}
                            onChange={(e) => { setSettings({ ...settings, LINE_CHANNEL_ACCESS_TOKEN: e.target.value }); setCanSave(false); }}
                            placeholder="Enter your Channel Access Token"
                        />
                    </div>

                    {/* Channel Secret */}
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700">
                            Channel Secret
                        </label>
                        <input
                            type="password"
                            disabled={!isEditing}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all disabled:opacity-75 disabled:cursor-not-allowed"
                            value={settings.LINE_CHANNEL_SECRET}
                            onChange={(e) => { setSettings({ ...settings, LINE_CHANNEL_SECRET: e.target.value }); setCanSave(false); }}
                            placeholder="Enter your Channel Secret"
                        />
                    </div>
                </div>

                {/* Footer Actions */}
                {isEditing && (
                    <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                        {/* Connect Button - Soft Primary Style */}
                        <button
                            onClick={handleConnect}
                            disabled={processing === 'CONNECT'}
                            className="px-6 py-2.5 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-all text-sm font-bold cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
                        >
                            {processing === 'CONNECT' ? (
                                <>
                                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-indigo-500 border-t-transparent"></span>
                                    Connecting...
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                    Connect
                                </>
                            )}
                        </button>

                        {/* Save Button */}
                        <button
                            onClick={handleSave}
                            disabled={!canSave || processing === 'SAVE'}
                            className={`px-6 py-2.5 rounded-lg transition-all text-sm font-bold cursor-pointer flex items-center gap-2 shadow-sm ${canSave
                                ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200'
                                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                }`}
                        >
                            {processing === 'SAVE' ? (
                                <>
                                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                    Save
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>

            {/* Connection Status Modal */}
            <Modal
                isOpen={showStatusModal}
                onClose={() => setShowStatusModal(false)}
                title={validationResult?.success ? "Connection Successful" : "Connection Failed"}
                maxWidth="sm"
            >
                <div className="flex flex-col items-center text-center p-4 pt-2">
                    {validationResult?.success ? (
                        <>
                            <div className="w-14 h-14 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mb-4">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            </div>
                            <div className="w-full bg-slate-50 border border-slate-100 rounded-lg p-4 text-left mb-6">
                                <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Authenticated As</p>
                                <p className="font-bold text-slate-700 text-lg">{validationResult.botInfo?.displayName}</p>
                                <p className="text-xs text-slate-400 font-mono truncate">{validationResult.botInfo?.userId}</p>
                            </div>
                            <button
                                onClick={() => setShowStatusModal(false)}
                                className="w-full py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold transition-all shadow-lg shadow-indigo-200 cursor-pointer active:scale-95"
                            >
                                Close
                            </button>
                        </>
                    ) : (
                        <>
                            <div className="w-12 h-12 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-3">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </div>
                            <h4 className="text-lg font-bold text-slate-800 mb-1">Connection Failed</h4>
                            <p className="text-sm text-slate-500 mb-4 px-2 break-all">
                                {validationResult?.error}
                            </p>
                            <button
                                onClick={() => setShowStatusModal(false)}
                                className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-bold transition-colors cursor-pointer active:scale-95"
                            >
                                Close
                            </button>
                        </>
                    )}
                </div>
            </Modal>

            {/* Unsaved Changes Modal */}
            <Modal
                isOpen={showUnsavedModal}
                onClose={() => setShowUnsavedModal(false)}
                title="Unsaved Changes"
                maxWidth="sm"
            >
                <div className="text-center p-2">
                    <p className="text-slate-600 mb-6 text-sm">
                        You have unsaved changes. Are you sure you want to leave?
                    </p>
                    <div className="flex gap-3 justify-center">
                        <button
                            onClick={() => setShowUnsavedModal(false)}
                            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 text-sm font-medium cursor-pointer active:scale-95"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={confirmNavigation}
                            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm font-medium cursor-pointer active:scale-95 transition-all"
                        >
                            Discard
                        </button>
                    </div>
                </div>
            </Modal>
            {/* Save Success Modal */}
            <Modal
                isOpen={showSaveSuccessModal}
                onClose={() => setShowSaveSuccessModal(false)}
                title="Saved Successfully"
                maxWidth="sm"
            >
                <div className="flex flex-col items-center text-center p-4 pt-2">
                    <div className="w-14 h-14 bg-indigo-100 text-indigo-500 rounded-full flex items-center justify-center mb-4">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <p className="text-slate-600 mb-6">
                        บันทึกข้อมูลการเชื่อมต่อเรียบร้อยแล้ว
                    </p>
                    <button
                        onClick={() => setShowSaveSuccessModal(false)}
                        className="w-full py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold shadow-lg shadow-indigo-200 cursor-pointer active:scale-95 transition-all"
                    >
                        OK
                    </button>
                </div>
            </Modal>
        </div>
    );
}
