
import dynamic from 'next/dynamic';
import Link from 'next/link';
import StatsCard from './components/StatsCard';
import ChartsWrapper from './components/ChartsWrapper';

async function getRequestData() {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

    try {
        const timeout = 5000; // 5 seconds timeout
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);

        const [statsRes, monthlyRes] = await Promise.all([
            fetch(`${API_BASE}/admin/requests/stats`, { cache: 'no-store', signal: controller.signal }),
            fetch(`${API_BASE}/admin/requests/stats/monthly`, { cache: 'no-store', signal: controller.signal })
        ]);
        clearTimeout(id);

        return {
            requestStats: statsRes.ok ? await statsRes.json() : null,
            monthlyData: monthlyRes.ok ? await monthlyRes.json() : [],
            error: null
        };
    } catch (error) {
        console.error('Service Dashboard Fetch Error:', error);
        return {
            requestStats: null,
            monthlyData: [],
            error: 'Failed to load service data'
        };
    }
}

export default async function ServiceDashboard() {
    const { requestStats, monthlyData, error } = await getRequestData();

    if (error) {
        return (
            <div className="p-8 text-center bg-red-50 text-red-600 rounded-xl border border-red-100">
                <h2 className="text-lg font-bold mb-2">Connection Error</h2>
                <p>Could not connect to the backend server. Please check your connection.</p>
            </div>
        );
    }

    const statusData = requestStats ? [
        { name: 'Pending', value: requestStats.pending },
        { name: 'Active', value: requestStats.in_progress },
        { name: 'Completed', value: requestStats.completed },
        { name: 'Rejected', value: requestStats.rejected }
    ] : [];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Service Requests</h1>
                    <p className="text-slate-500 text-sm">Citizen service management and analytics</p>
                </div>
                <div className="text-sm text-slate-400">
                    {new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
                </div>
            </div>

            {/* Stats Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                <StatsCard
                    title="Total Requests"
                    value={requestStats?.total || 0}
                    icon={
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    }
                    color="primary"
                    link="/admin/requests"
                />

                <StatsCard
                    title="Pending Approval"
                    value={requestStats?.pending || 0}
                    icon={
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    }
                    color="warning"
                    link="/admin/requests?status=PENDING"
                    description="Requires Attention"
                />

                <StatsCard
                    title="In Progress"
                    value={requestStats?.in_progress || 0}
                    icon={
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    }
                    color="info"
                    link="/admin/requests?status=IN_PROGRESS"
                    description="Currently Active"
                />

                <StatsCard
                    title="Completed"
                    value={requestStats?.completed || 0}
                    icon={
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    }
                    color="success"
                    link="/admin/requests?status=COMPLETED"
                    description="Successfully Resolved"
                />
            </div>

            {/* Analytics Charts */}
            <ChartsWrapper statusData={statusData} monthlyData={monthlyData} />

        </div>
    );
}
