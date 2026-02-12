'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import PageHeader from '@/app/admin/components/PageHeader';
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
    }, [API_BASE]);

    if (loading) return <LoadingSpinner label="Loading Analytics..." />;

    return (
        <div className="thai-text space-y-6 animate-in fade-in duration-500">
            <PageHeader
                title="รายงานวิเคราะห์ประสิทธิภาพ"
                subtitle="ติดตามภาระงานรายบุคคลและประสิทธิภาพการให้บริการเฉลี่ยของทีม"
            />

            {/* Performance Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="border-none shadow-sm bg-gradient-to-br from-brand-500 to-brand-600 text-white overflow-hidden relative group">
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

                <Card className="border-none shadow-sm bg-white overflow-hidden group dark:bg-gray-800">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2 bg-blue-50 text-blue-500 rounded-lg dark:bg-blue-500/10">
                                <Clock className="w-5 h-5" />
                            </div>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter dark:text-gray-500">Average</span>
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest leading-none mb-1 dark:text-gray-400">Cycle Time</p>
                            <h2 className="text-3xl font-black text-gray-800 dark:text-gray-100">{perf?.avg_cycle_time_days || 0} วัน</h2>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-white overflow-hidden group dark:bg-gray-800">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2 bg-amber-50 text-amber-500 rounded-lg dark:bg-amber-500/10">
                                <Activity className="w-5 h-5" />
                            </div>
                            <Badge variant="warning" className="text-[9px]">High Activity</Badge>
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest leading-none mb-1 dark:text-gray-400">Total Active Tasks</p>
                            <h2 className="text-3xl font-black text-gray-800 dark:text-gray-100">
                                {workload.reduce((acc, curr) => acc + curr.pending_count + curr.in_progress_count, 0)} งาน
                            </h2>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Workload Distribution */}
                <Card className="border-none shadow-sm dark:bg-gray-800">
                    <CardHeader className="border-b border-gray-50 py-4 px-6 flex flex-row items-center gap-2 dark:border-gray-700">
                        <Users className="w-5 h-5 text-brand-500" />
                        <CardTitle className="thai-no-break text-base font-bold text-gray-700 dark:text-gray-200">ภาระงานรายบุคคล (Workload)</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                        {workload.map((item, idx) => (
                            <div key={idx} className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                                            {item.agent_name?.[0] || '?'}
                                        </div>
                                        <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{item.agent_name}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <Badge variant="warning" className="text-[9px] py-0">{item.pending_count} รอรับเรื่อง</Badge>
                                        <Badge variant="info" className="text-[9px] py-0">{item.in_progress_count} ดำเนินการ</Badge>
                                    </div>
                                </div>
                                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden flex dark:bg-gray-700">
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

                {/* Team Efficiency Score */}
                <Card className="border-none shadow-sm bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 text-white dark:from-gray-900 dark:to-black">
                    <CardHeader className="py-4 px-6 border-b border-white/10">
                        <CardTitle className="thai-no-break text-base font-bold flex items-center gap-2 text-white">
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
                            <p className="thai-no-break text-xs text-white/50">การตอบสนองและปิดงานทำได้ดีเยี่ยมในรอบ 30 วันที่ผ่านมา</p>
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
