'use client';

import dynamic from 'next/dynamic';

// Dynamic import for Charts (Client Component) with SSR disabled
const DashboardCharts = dynamic(
    () => import('./DashboardCharts'),
    {
        ssr: false,
        loading: () => <div className="h-[300px] w-full bg-slate-50 animate-pulse rounded-xl" />
    }
);

interface ChartsWrapperProps {
    statusData: any[];
    monthlyData: any[];
}

export default function ChartsWrapper(props: ChartsWrapperProps) {
    return <DashboardCharts {...props} />;
}
