'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
    Users,
    Zap,
    Clock,
    ArrowUpRight,
    Target,
    Activity,
    UserCheck,
    Briefcase
} from 'lucide-react';

interface Workload {
    agent_name: string;
    pending_count: number;
    in_progress_count: number;
}

interface Performance {
    avg_cycle_time_days: number;
    on_time_percentage: number;
}

export default function ReportsPage() {
    const [workload, setWorkload] = useState<Workload[]>([]);
    const [perf, setPerf] = useState<Performance | null>(null);
    const [loading, setLoading] = useState(true);

    const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [workloadRes, perfRes] = await Promise.all([
                    fetch(`${API_BASE}/admin/requests/stats/workload`),
                    fetch(`${API_BASE}/admin/requests/stats/performance`)
                ]);
                if (workloadRes.ok) setWorkload(await workloadRes.json());
                if (perfRes.ok) setPerf(await perfRes.json());
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <div className="p-8 text-center text-slate-400">Loading Analytics...</div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-2xl font-bold text-slate-800 tracking-tight">รายงานวิเคราะห์ประสิทธิภาพ</h1>
                <p className="text-sm text-slate-500 text-balance">ติดตามภาระงานรายบุคคลและประสิทธิภาพการให้บริการเฉลี่ยของทีม</p>
            </div>

            {/* Performance Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="border-none shadow-sm bg-primary text-white overflow-hidden relative group">
                    <CardContent className="p-6">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                            <Zap className="w-24 h-24" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs font-bold text-white/70 uppercase tracking-widest">On-Time Completion</p>
                            <h2 className="text-4xl font-black">{perf?.on_time_percentage || 0}%</h2>
                        </div>
                        <div className="mt-4 flex items-center gap-2 text-[11px] font-bold text-white/80">
                            <Target className="w-3.5 h-3.5" /> สูงกว่าเป้าหมาย 5%
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-white overflow-hidden group">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2 bg-blue-50 text-blue-500 rounded-lg">
                                <Clock className="w-5 h-5" />
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Average</span>
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-none mb-1">Cycle Time</p>
                            <h2 className="text-3xl font-black text-slate-800">{perf?.avg_cycle_time_days || 0} วัน</h2>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-white overflow-hidden group">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2 bg-amber-50 text-amber-500 rounded-lg">
                                <Activity className="w-5 h-5" />
                            </div>
                            <Badge variant="warning" className="text-[9px]">High Activity</Badge>
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-none mb-1">Total Active Tasks</p>
                            <h2 className="text-3xl font-black text-slate-800">
                                {workload.reduce((acc, curr) => acc + curr.pending_count + curr.in_progress_count, 0)} งาน
                            </h2>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Workload Distribution */}
                <Card glass className="border-none shadow-sm">
                    <CardHeader className="border-b border-slate-50 py-4 px-6 flex flex-row items-center gap-2">
                        <Users className="w-5 h-5 text-primary" />
                        <CardTitle className="text-base font-bold text-slate-700">ภาระงานรายบุคคล (Workload)</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                        {workload.map((item, idx) => (
                            <div key={idx} className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">
                                            {item.agent_name?.[0] || '?'}
                                        </div>
                                        <span className="text-sm font-bold text-slate-700">{item.agent_name}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <Badge variant="warning" className="text-[9px] py-0">{item.pending_count} รอรับเรื่อง</Badge>
                                        <Badge variant="info" className="text-[9px] py-0">{item.in_progress_count} ดำเนินการ</Badge>
                                    </div>
                                </div>
                                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
                                    <div
                                        className="bg-amber-400 h-full"
                                        style={{ width: `${(item.pending_count / 10) * 100}%` }}
                                    />
                                    <div
                                        className="bg-blue-400 h-full"
                                        style={{ width: `${(item.in_progress_count / 10) * 100}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* Team Efficiency Score (Mocked visualization) */}
                <Card glass className="border-none shadow-sm bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 text-white">
                    <CardHeader className="py-4 px-6 border-b border-white/10">
                        <CardTitle className="text-base font-bold flex items-center gap-2">
                            <ArrowUpRight className="w-5 h-5 text-green-400" /> สรุปผลทีมงาน
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8 flex flex-col items-center justify-center text-center space-y-4 h-full min-h-[300px]">
                        <div className="relative">
                            <div className="w-32 h-32 rounded-full border-8 border-white/5 flex items-center justify-center border-t-green-400 border-r-green-400 animate-in spin-in duration-1000">
                                <span className="text-4xl font-black">A+</span>
                            </div>
                            <div className="absolute -bottom-2 -right-2 bg-green-500 text-white p-1.5 rounded-lg shadow-lg">
                                <UserCheck className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="max-w-[240px]">
                            <h3 className="text-lg font-bold">Excellent Team Work</h3>
                            <p className="text-xs text-white/50">การตอบสนองและปิดงานทำได้ดีเยี่ยมในรอบ 30 วันที่ผ่านมา</p>
                        </div>
                        <Button className="bg-white/10 hover:bg-white/20 text-white border-none gap-2 text-xs font-bold px-6">
                            ดูรายละเอียดรายทีม <Briefcase className="w-4 h-4" />
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
