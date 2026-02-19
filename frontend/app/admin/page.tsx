import { FileText, Clock, Zap, CheckCircle2 } from 'lucide-react';
import StatsCard from './components/StatsCard';
import ChartsWrapper from './components/ChartsWrapper';

export const dynamic = 'force-dynamic';

async function fetchWithTimeout(url: string, timeout = 15000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
        const res = await fetch(url, {
            cache: 'no-store',
            signal: controller.signal,
            headers: { 'Accept': 'application/json' }
        });
        clearTimeout(timeoutId);
        return res;
    } catch (error) {
        clearTimeout(timeoutId);
        throw error;
    }
}

async function getRequestData() {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

    // Use Promise.allSettled to handle partial failures gracefully
    const [statsResult, monthlyResult] = await Promise.allSettled([
        fetchWithTimeout(`${API_BASE}/admin/requests/stats`),
        fetchWithTimeout(`${API_BASE}/admin/requests/stats/monthly`)
    ]);

    // Process stats result
    let requestStats = null;
    if (statsResult.status === 'fulfilled' && statsResult.value.ok) {
        try {
            requestStats = await statsResult.value.json();
        } catch (e) {
            console.error('Failed to parse stats response:', e);
        }
    } else if (statsResult.status === 'rejected') {
        console.error('Stats fetch failed:', statsResult.reason);
    }

    // Process monthly data result
    let monthlyData: Array<{ month: string; count: number }> = [];
    if (monthlyResult.status === 'fulfilled' && monthlyResult.value.ok) {
        try {
            monthlyData = await monthlyResult.value.json();
        } catch (e) {
            console.error('Failed to parse monthly response:', e);
        }
    } else if (monthlyResult.status === 'rejected') {
        console.error('Monthly fetch failed:', monthlyResult.reason);
    }

    // Only show error if both requests failed
    const bothFailed = statsResult.status === 'rejected' && monthlyResult.status === 'rejected';
    const error = bothFailed
        ? 'Failed to load service data. Please check if the backend is running.'
        : null;

    return { requestStats, monthlyData, error };
}

export default async function ServiceDashboard() {
    const { requestStats, monthlyData, error } = await getRequestData();

    if (error) {
        return (
            <div className="p-8 text-center bg-red-50 text-red-600 rounded-2xl border border-red-100 animate-fade-in-up dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400">
                <h2 className="text-lg font-bold mb-2 text-red-800 dark:text-red-300">Connection Error</h2>
                <p className="text-sm text-red-600 dark:text-red-400">Could not connect to the backend server. Please check your connection.</p>
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
        <div className="space-y-6 animate-fade-in-up thai-text">
            <div className="ds-panel ds-panel-body flex justify-between items-center hover:shadow-md transition-shadow duration-300">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight thai-no-break dark:text-gray-100">Service Requests</h1>
                    <p className="text-gray-500 text-sm mt-0.5 dark:text-gray-400">Citizen service management and analytics</p>
                </div>
                <div className="text-sm text-gray-500 font-medium dark:text-gray-400">
                    {new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
                </div>
            </div>

            {/* Stats Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="animate-fade-in-up" style={{ animationDelay: '0ms' }}>
                    <StatsCard
                        title="Total Requests"
                        value={requestStats?.total || 0}
                        icon={<FileText className="w-6 h-6" />}
                        color="primary"
                        link="/admin/requests"
                    />
                </div>
                <div className="animate-fade-in-up" style={{ animationDelay: '100ms' }}>

                    <StatsCard
                        title="Pending Approval"
                        value={requestStats?.pending || 0}
                        icon={<Clock className="w-6 h-6" />}
                        color="warning"
                        link="/admin/requests?status=PENDING"
                        description="Requires Attention"
                    />
                </div>
                <div className="animate-fade-in-up" style={{ animationDelay: '200ms' }}>

                    <StatsCard
                        title="In Progress"
                        value={requestStats?.in_progress || 0}
                        icon={<Zap className="w-6 h-6" />}
                        color="info"
                        link="/admin/requests?status=IN_PROGRESS"
                        description="Currently Active"
                    />
                </div>
                <div className="animate-fade-in-up" style={{ animationDelay: '300ms' }}>

                    <StatsCard
                        title="Completed"
                        value={requestStats?.completed || 0}
                        icon={<CheckCircle2 className="w-6 h-6" />}
                        color="success"
                        link="/admin/requests?status=COMPLETED"
                        description="Successfully Resolved"
                    />
                </div>
            </div>

            {/* Analytics Charts */}
            <ChartsWrapper statusData={statusData} monthlyData={monthlyData} />

        </div>
    );
}
