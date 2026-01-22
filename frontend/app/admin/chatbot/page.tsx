
import Link from 'next/link';
import StatsCard from '../components/StatsCard';

async function getChatbotData() {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

    try {
        const [objRes, intentRes] = await Promise.all([
            fetch(`${API_BASE}/admin/reply-objects`, { cache: 'no-store' }),
            fetch(`${API_BASE}/admin/intents/categories`, { cache: 'no-store' })
        ]);

        return {
            replyObjects: objRes.ok ? await objRes.json() : [],
            intentCategories: intentRes.ok ? await intentRes.json() : [],
            error: null
        };
    } catch (error) {
        console.error('Chatbot Dashboard Fetch Error:', error);
        return {
            replyObjects: [],
            intentCategories: [],
            error: 'Failed to load chatbot data'
        };
    }
}

export default async function ChatbotDashboard() {
    const { replyObjects, intentCategories, error } = await getChatbotData();

    if (error) {
        return (
            <div className="p-8 text-center bg-red-50 text-red-600 rounded-xl border border-red-100">
                <h2 className="text-lg font-bold mb-2">Connection Error</h2>
                <p>Could not connect to the chatbot services. Please check backend connection.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Chatbot Overview</h1>
                    <p className="text-slate-500 text-sm">Manage LINE OA auto-replies and rich messages</p>
                </div>
                <div className="text-sm text-slate-400">
                    SKN Chatbot System
                </div>
            </div>

            {/* Stats Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                <StatsCard
                    title="Reply Objects"
                    value={replyObjects.length}
                    icon={
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                    }
                    color="info"
                    link="/admin/reply-objects"
                    description="Flex Messages & Images"
                />

                <StatsCard
                    title="Intent Categories"
                    value={intentCategories.length}
                    icon={
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                    }
                    color="purple"
                    link="/admin/auto-replies"
                    description={`${intentCategories.filter((c: any) => c.is_active).length} Active Categories`}
                />

                <StatsCard
                    title="Active Responses"
                    value={intentCategories.reduce((acc: number, curr: any) => acc + curr.response_count, 0)}
                    icon={
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                    }
                    color="success"
                    description="Total Keywords Configured"
                />
            </div>

            {/* Recent Activity/Quick Actions Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Recent Reply Objects */}
                <div className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm">
                    <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center">
                        <h2 className="text-base font-semibold text-slate-700 flex items-center gap-2">
                            <span className="w-1 h-5 bg-indigo-500 rounded-full" />
                            Recent Templates
                        </h2>
                        <Link href="/admin/reply-objects" className="text-xs font-medium text-indigo-500 hover:text-indigo-600 uppercase tracking-wide px-2 py-1 rounded hover:bg-indigo-50 transition-colors">View All</Link>
                    </div>
                    <div className="divide-y divide-slate-50">
                        {replyObjects.slice(0, 5).map((obj: any) => (
                            <div key={obj.id} className="px-5 py-3.5 hover:bg-slate-50/50 transition-all group">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-indigo-50 text-indigo-500 rounded-lg flex items-center justify-center text-sm font-semibold">
                                            $
                                        </div>
                                        <div>
                                            <p className="text-slate-600 font-medium text-sm group-hover:text-indigo-600 transition-colors">{obj.name}</p>
                                            <span className="text-slate-400 font-mono text-xs">${obj.object_id}</span>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-medium uppercase tracking-wide bg-slate-100 px-2 py-0.5 rounded text-slate-500">
                                        {obj.object_type}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Auto-Replies */}
                <div className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm">
                    <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center">
                        <h2 className="text-base font-semibold text-slate-700 flex items-center gap-2">
                            <span className="w-1 h-5 bg-purple-500 rounded-full" />
                            Active Intents
                        </h2>
                        <Link href="/admin/auto-replies" className="text-xs font-medium text-purple-500 hover:text-purple-600 uppercase tracking-wide px-2 py-1 rounded hover:bg-purple-50 transition-colors">Manage</Link>
                    </div>
                    <div className="divide-y divide-slate-50">
                        {intentCategories.slice(0, 5).map((category: any) => (
                            <Link
                                key={category.id}
                                href={`/admin/auto-replies/${category.id}`}
                                className="px-5 py-3.5 hover:bg-slate-50/50 transition-all group cursor-pointer block"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-purple-50 text-purple-500 rounded-lg flex items-center justify-center text-sm font-semibold">
                                            #
                                        </div>
                                        <div>
                                            <p className="text-slate-600 font-medium text-sm group-hover:text-purple-600 transition-colors">{category.name}</p>
                                            <p className="text-slate-400 text-xs">
                                                {category.keyword_count} keywords · {category.response_count} responses
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`w-2 h-2 rounded-full ${category.is_active ? 'bg-green-500' : 'bg-slate-300'}`} />
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
