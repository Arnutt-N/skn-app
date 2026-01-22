import Link from 'next/link';

interface StatsCardProps {
    title: string;
    value: number | string;
    icon: React.ReactNode;
    color: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'purple';
    link?: string;
    description?: string;
}

const colorMap = {
    primary: { bg: 'bg-indigo-50', text: 'text-indigo-500', hoverConfig: 'group-hover:text-indigo-600' },
    success: { bg: 'bg-green-50', text: 'text-green-500', hoverConfig: 'group-hover:text-green-600' },
    warning: { bg: 'bg-orange-50', text: 'text-orange-500', hoverConfig: 'group-hover:text-orange-600' },
    danger: { bg: 'bg-red-50', text: 'text-red-500', hoverConfig: 'group-hover:text-red-600' },
    info: { bg: 'bg-cyan-50', text: 'text-cyan-500', hoverConfig: 'group-hover:text-cyan-600' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-500', hoverConfig: 'group-hover:text-purple-600' },
};

export default function StatsCard({ title, value, icon, color, link, description }: StatsCardProps) {
    const colors = colorMap[color];

    const Content = (
        <div className="flex items-center gap-4">
            <div className={`w-12 h-12 ${colors.bg} ${colors.text} rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-300`}>
                {icon}
            </div>
            <div>
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">{title}</p>
                <p className="text-3xl font-bold text-slate-700 mt-0.5 tracking-tight">{value}</p>
                {description && <p className="text-slate-400 text-xs mt-0.5">{description}</p>}
            </div>
        </div>
    );

    const containerClasses = "bg-white rounded-xl p-5 hover:shadow-lg transition-all duration-300 group shadow-sm border border-slate-100 block h-full";

    if (link) {
        return (
            <Link href={link} className={containerClasses}>
                {Content}
            </Link>
        );
    }

    return (
        <div className={containerClasses}>
            {Content}
        </div>
    );
}
