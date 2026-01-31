'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface MenuItem {
    name: string;
    href: string;
    icon: string;
    external?: boolean;
    openInNewTab?: boolean;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const pathname = usePathname();

    // Responsive sidebar handling
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 1024) {
                setIsSidebarCollapsed(true);
            } else {
                setIsSidebarCollapsed(false);
            }
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const menuGroups: { title: string; items: MenuItem[] }[] = [
        {
            title: 'Service Requests',
            items: [
                { name: 'Dashboard', href: '/admin', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
                { name: 'Manage Requests', href: '/admin/requests', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
                // { name: 'Kanban View', href: '/admin/requests/kanban', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2' },
            ]
        },
        {
            title: 'Chatbot Management',
            items: [
                { name: 'Chatbot Overview', href: '/admin/chatbot', icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z' },
                { name: 'Live Chat', href: '/admin/live-chat', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z', openInNewTab: true },
                { name: 'Auto-Replies', href: '/admin/auto-replies', icon: 'M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z' },
                { name: 'Reply Objects', href: '/admin/reply-objects', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
                { name: 'Rich Menus', href: '/admin/rich-menus', icon: 'M4 6h16M4 10h16M4 14h16M4 18h16' },
                { name: 'Chat Histories', href: '/admin/chatbot/history', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
                { name: 'Friend Histories', href: '/admin/chatbot/friends', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
                { name: 'Broadcast', href: '/admin/chatbot/broadcast', icon: 'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z' },
            ]
        },
        {
            title: 'System Management',
            items: [
                { name: 'File Management', href: '/admin/files', icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z' },
                { name: 'User Management', href: '/admin/users', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
                { name: 'Reports', href: '/admin/reports', icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
                { name: 'System Logs', href: '/admin/logs', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
                { name: 'LINE Credentials', href: '/admin/settings/line', icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' },
                { name: 'API Docs', href: `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/docs`, icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253', external: true },
                { name: 'Settings', href: '/admin/settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
            ]
        }
    ];

    const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);

    const isLiveChat = pathname.includes('/admin/live-chat');

    // Standalone mode for live-chat - skip admin sidebar entirely
    if (isLiveChat) {
        return <>{children}</>;
    }

    return (
        <div className="flex h-screen bg-[#f8f7fa] text-slate-600 font-sans">
            {/* Sidebar */}
            <aside
                className={`admin-sidebar fixed left-0 top-0 z-50 h-full bg-[#2f3349] text-white shadow-xl transition-all duration-300 ease-in-out flex flex-col overflow-x-hidden ${isSidebarCollapsed ? 'w-20' : 'w-64'
                    } ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
            >
                {/* Sidebar Logo & Toggle */}
                <div className="flex h-16 items-center flex-shrink-0 px-6 relative">
                    <div className={`flex items-center w-full transition-all duration-300 ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
                        {isSidebarCollapsed ? (
                            <button
                                onClick={toggleSidebar}
                                className="flex items-center justify-center w-9 h-9 rounded-md bg-indigo-500 text-white font-bold text-xs cursor-pointer ring-4 ring-indigo-500/10 hover:ring-indigo-500/30 hover:scale-110 active:scale-95 transition-all duration-300 shadow-lg shadow-indigo-500/20"
                                title="Expand Sidebar"
                            >
                                JS
                            </button>
                        ) : (
                            <div className="flex items-center w-full relative">
                                <Link href="/admin" className="flex items-center justify-center w-8 h-8 rounded-md bg-indigo-500 text-white font-bold text-xs ring-2 ring-indigo-500/30 hover:ring-indigo-500/50 transition-all duration-300 shadow-lg shadow-indigo-500/20 flex-shrink-0 z-10">
                                    JS
                                </Link>

                                <span className="absolute inset-0 flex items-center justify-center font-bold text-lg tracking-tight text-white/90 pointer-events-none">
                                    JSK Admin
                                </span>

                                <button
                                    onClick={toggleSidebar}
                                    className="p-1.5 rounded-md hover:bg-[#3a3f5b] text-slate-400 hover:text-white cursor-pointer transition-all duration-300 flex-shrink-0 ml-auto z-10"
                                    title="Collapse Sidebar"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar Nav - Scrollable */}
                <nav className="flex-1 px-3 space-y-4 overflow-y-auto overflow-x-hidden custom-scrollbar pt-2 pb-10">
                    {(() => {
                        const allItems = menuGroups.flatMap(g => g.items);
                        const activeItem = allItems
                            .filter(item => !item.external && (pathname === item.href || pathname.startsWith(item.href + '/')))
                            .sort((a, b) => b.href.length - a.href.length)[0];

                        return menuGroups.map((group) => (
                            <div key={group.title} className="space-y-1">
                                {!isSidebarCollapsed && (
                                    <h3 className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500/80 border-t border-slate-700/30 pt-4 mt-2 first:border-0 first:pt-0 first:mt-0">
                                        {group.title}
                                    </h3>
                                )}
                                {isSidebarCollapsed && <div className="border-t border-slate-700/30 my-2 first:hidden" />}
                                <div className="space-y-1">
                                    {group.items.map((item) => {
                                        const isActive = activeItem ? item.href === activeItem.href : pathname === item.href;
                                        return (
                                            <Link
                                                key={item.name}
                                                href={item.href}
                                                target={item.external || item.openInNewTab ? "_blank" : "_self"}
                                                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group relative ${isActive
                                                    ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/40'
                                                    : 'text-slate-300 hover:bg-[#3a3f5b] hover:text-white'
                                                    }`}
                                            >
                                                <svg
                                                    className={`flex-shrink-0 transition-colors ${isSidebarCollapsed ? 'w-6 h-6 mx-auto' : 'w-4 h-4'} ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`}
                                                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                                >
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                                                </svg>
                                                {!isSidebarCollapsed && <span className="font-medium text-sm whitespace-nowrap">{item.name}</span>}

                                                {isSidebarCollapsed && (
                                                    <div className="absolute left-full ml-2 px-2 py-1 bg-[#3a3f5b] text-white text-xs rounded shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                                                        {item.name}
                                                    </div>
                                                )}
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        ));
                    })()}
                </nav>
            </aside>

            {/* Main Content Area */}
            <div className={`admin-content flex flex-col flex-1 transition-all duration-300 ${isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>

                {/* Navbar (Floating Style) */}
                <header className="sticky top-0 z-40 px-6 pt-4 pb-2">
                    <div className="bg-white/80 backdrop-blur-md rounded-xl shadow-sm border border-slate-200/50 px-6 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="lg:hidden p-1 text-slate-500 hover:text-indigo-500"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            </button>

                            {/* Search */}
                            <div className="hidden md:flex items-center gap-2 text-slate-400 hover:text-indigo-500 transition-colors cursor-text">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <span className="text-sm">Search (Ctrl+/)</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            {/* Theme Toggle Placeholder */}
                            <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                            </button>

                            {/* Notifications */}
                            <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors relative">
                                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                </svg>
                            </button>

                            {/* User Profile */}
                            <div className="relative">
                                <div className="w-9 h-9 rounded-full bg-slate-200 border-2 border-white shadow-sm overflow-hidden cursor-pointer hover:ring-2 hover:ring-indigo-500/50 transition-all">
                                    <img src="https://ui-avatars.com/api/?name=John+Doe&background=7367f0&color=fff" alt="User" />
                                </div>
                                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></span>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <main className={`flex-1 ${isLiveChat ? 'overflow-hidden' : 'overflow-x-hidden overflow-y-auto px-6 pb-6'}`}>
                    {children}
                </main>
            </div>


            {/* Mobile Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}
        </div>
    );
}
