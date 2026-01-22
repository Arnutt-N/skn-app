'use client';

import { Rocket, ArrowLeft, Bell, Sparkles } from 'lucide-react';

export default function ComingSoonPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-6 animate-in fade-in zoom-in duration-700">
            {/* Ambient Background Glows */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute top-1/4 left-1/3 w-[300px] h-[300px] bg-purple-500/5 rounded-full blur-[100px] pointer-events-none" />

            <div className="relative group">
                {/* Icon Container with Glassmorphism */}
                <div className="w-24 h-24 bg-white/40 backdrop-blur-xl border border-white/60 shadow-2xl shadow-indigo-500/10 rounded-[2.5rem] flex items-center justify-center mb-8 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 cursor-default">
                    <Rocket className="w-10 h-10 text-indigo-500 animate-bounce" />
                    <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-amber-400 animate-pulse" />
                </div>
            </div>

            <div className="space-y-4 max-w-lg relative">
                <div className="space-y-2">
                    <span className="px-4 py-1.5 bg-indigo-50 text-indigo-500 text-[10px] font-black uppercase tracking-[0.3em] rounded-full border border-indigo-100 shadow-sm">
                        In Development
                    </span>
                    <h1 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tighter leading-none pt-2">
                        Coming Soon
                    </h1>
                    <h2 className="text-xl md:text-2xl font-bold text-slate-400 mt-[-4px]">
                        ฟีเจอร์นี้กำลังอยู่ระหว่างการพัฒนา
                    </h2>
                </div>

                <p className="text-slate-500 text-sm md:text-base leading-relaxed max-w-sm mx-auto font-medium">
                    เรากำลังดำเนินการเพิ่มฟีเจอร์นี้เพื่อให้ระบบ SKN Admin ทำงานได้ครบวงจรยิ่งขึ้น คอยพบกับการอัปเดตในเวอร์ชั่นถัดไป
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
                    <button
                        onClick={() => window.history.back()}
                        className="w-full sm:w-auto px-8 py-3.5 bg-white border border-slate-200 text-slate-700 rounded-2xl hover:bg-slate-50 hover:border-slate-300 transition-all font-bold text-sm flex items-center justify-center gap-2 shadow-sm active:scale-95"
                    >
                        <ArrowLeft className="w-4 h-4" /> ย้อนกลับ (Go Back)
                    </button>
                    <button
                        className="w-full sm:w-auto px-8 py-3.5 bg-indigo-500 text-white rounded-2xl hover:bg-indigo-600 transition-all font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 border border-indigo-400 active:scale-95"
                    >
                        <Bell className="w-4 h-4" /> แจ้งเตือนเมื่อเปิดใช้
                    </button>
                </div>
            </div>

            {/* Bottom Status Info */}
            <div className="mt-20 flex items-center gap-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-t border-slate-100 pt-8 w-full max-w-xs justify-center">
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    Version 1.2
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                    Priority: High
                </div>
            </div>
        </div>
    );
}
