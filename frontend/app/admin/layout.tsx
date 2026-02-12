'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { SessionTimeoutWarning } from '@/components/admin/SessionTimeoutWarning';
import { useTheme } from '@/components/providers';
import { cn } from '@/lib/utils';
import {
  Sun, Moon, Bell, Menu, Search, LogOut, ChevronLeft,
  LayoutDashboard, FileText, Bot, MessageCircle,
  Reply, MessageSquareReply, PanelTop, History,
  Users, Megaphone, FolderOpen, UserCog, BarChart3,
  Settings, Palette,
} from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Tooltip } from '@/components/ui/Tooltip';

interface MenuItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  external?: boolean;
  openInNewTab?: boolean;
}

function AdminAuthGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = '/login';
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return <>{children}</>;
}

// Theme Toggle Button Component
function ThemeToggle() {
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <Tooltip content={isDark ? 'Switch to light mode' : 'Switch to dark mode'}>
      <button
        onClick={toggleTheme}
        className={cn(
          'p-2 rounded-xl transition-all duration-200',
          'text-gray-500 hover:text-brand-500 hover:bg-brand-50',
          'dark:text-gray-400 dark:hover:text-brand-400 dark:hover:bg-gray-800',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50'
        )}
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>
    </Tooltip>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

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
        { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
        { name: 'Manage Requests', href: '/admin/requests', icon: FileText },
      ]
    },
    {
      title: 'Chatbot Management',
      items: [
        { name: 'Chatbot Overview', href: '/admin/chatbot', icon: Bot },
        { name: 'Live Chat', href: '/admin/live-chat', icon: MessageCircle, openInNewTab: true },
        { name: 'Auto-Replies', href: '/admin/auto-replies', icon: Reply },
        { name: 'Reply Objects', href: '/admin/reply-objects', icon: MessageSquareReply },
        { name: 'Rich Menus', href: '/admin/rich-menus', icon: PanelTop },
        { name: 'Chat Histories', href: '/admin/chat-histories', icon: History },
        { name: 'Friend Histories', href: '/admin/friend-histories', icon: Users },
        { name: 'Broadcast', href: '/admin/broadcast', icon: Megaphone },
      ]
    },
    {
      title: 'System Management',
      items: [
        { name: 'File Management', href: '/admin/file-management', icon: FolderOpen },
        { name: 'User Management', href: '/admin/users', icon: UserCog },
        { name: 'Reports', href: '/admin/reports', icon: BarChart3 },
        { name: 'Settings', href: '/admin/settings', icon: Settings },
        { name: 'Design System', href: '/admin/design-system', icon: Palette },
      ]
    }
  ];

  const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);
  const isLiveChat = pathname.includes('/admin/live-chat');

  if (isLiveChat) {
    return (
      <AuthProvider>
        <AdminAuthGate>{children}</AdminAuthGate>
      </AuthProvider>
    );
  }

  const allItems = menuGroups.flatMap(g => g.items);
  const activeItem = allItems
    .filter(item => !item.external && (pathname === item.href || pathname.startsWith(item.href + '/')))
    .sort((a, b) => b.href.length - a.href.length)[0];

  return (
    <AuthProvider>
      <AdminAuthGate>
        <div className="flex h-screen bg-bg text-gray-600 dark:bg-gray-900 dark:text-gray-400 font-sans">
          {/* Skip to main content link for accessibility */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-brand-500 focus:text-white focus:rounded-lg"
          >
            Skip to main content
          </a>

          {/* Sidebar */}
          <aside
            className={cn(
              'fixed left-0 top-0 z-50 h-full',
              'bg-gradient-to-b from-gray-900 to-gray-950',
              'flex flex-col',
              'transition-all duration-300 ease-in-out',
              'border-r border-gray-800',
              isSidebarCollapsed ? 'w-20' : 'w-64',
              isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
            )}
          >
            {/* Sidebar Logo */}
            <div className="h-16 flex items-center justify-center px-4 border-b border-gray-800">
              {isSidebarCollapsed ? (
                <button
                  onClick={toggleSidebar}
                  className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white font-bold text-sm shadow-glow-sm hover:shadow-glow transition-shadow cursor-pointer"
                  aria-label="Expand sidebar"
                >
                  JS
                </button>
              ) : (
                <div className="flex items-center justify-between w-full">
                  <Link href="/admin" className="flex-1 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white font-bold text-sm shadow-glow-sm flex-shrink-0">
                      JS
                    </div>
                    <div className="flex-1 text-center">
                      <span className="text-white font-bold text-lg">JSK</span>
                      <span className="text-gray-400 text-sm ml-1">Admin</span>
                    </div>
                  </Link>
                  <button
                    onClick={toggleSidebar}
                    className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-gray-800 transition-colors cursor-pointer"
                    aria-label="Collapse sidebar"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6 scrollbar-thin">
              {menuGroups.map((group) => (
                <div key={group.title}>
                  {!isSidebarCollapsed && (
                    <h3 className="px-3 mb-2 text-[10px] font-semibold text-gray-500 uppercase tracking-widest">
                      {group.title}
                    </h3>
                  )}
                  <ul className="space-y-1">
                    {group.items.map((item) => {
                      const isActive = activeItem ? item.href === activeItem.href : pathname === item.href;
                      return (
                        <li key={item.name}>
                          <div className="w-full">
                            <Tooltip content={isSidebarCollapsed ? item.name : ''} side="right">
                              <Link
                                href={item.href}
                                target={item.external || item.openInNewTab ? '_blank' : undefined}
                                className={cn(
                                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group min-h-[40px]',
                                  isActive
                                    ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20'
                                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                )}
                                aria-current={isActive ? 'page' : undefined}
                              >
                                <item.icon
                                  className={cn(
                                    'flex-shrink-0 transition-colors',
                                    isSidebarCollapsed ? 'w-5 h-5 mx-auto' : 'w-5 h-5'
                                  )}
                                  aria-hidden="true"
                                />
                                {!isSidebarCollapsed && <span className="font-medium text-sm">{item.name}</span>}
                              </Link>
                            </Tooltip>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </nav>

            {/* User Section */}
            <div className="p-3 border-t border-gray-800">
              <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-800 transition-colors cursor-pointer group">
                <Avatar size="sm" fallback="AD" />
                {!isSidebarCollapsed && (
                  <>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">Administrator</p>
                      <p className="text-xs text-gray-500 truncate">admin@jsk.go.th</p>
                    </div>
                    <LogOut className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
                  </>
                )}
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className={cn(
            'flex flex-col flex-1 transition-all duration-300',
            isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'
          )}>
            {/* Header */}
            <header className="sticky top-0 z-40 px-4 sm:px-6 py-4">
              <div className={cn(
                'flex items-center justify-between',
                'bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl',
                'rounded-2xl shadow-sm',
                'px-4 sm:px-6 py-3',
                'border border-gray-100 dark:border-gray-700'
              )}>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setIsMobileMenuOpen(true)}
                    className="lg:hidden p-2 text-gray-500 hover:text-brand-500 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    aria-label="Open menu"
                  >
                    <Menu className="w-5 h-5" />
                  </button>

                  <div className="hidden md:flex items-center relative">
                    <Search className="absolute left-3 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search..."
                      className={cn(
                        'pl-9 pr-4 py-2 w-64 rounded-xl text-sm',
                        'bg-gray-50 dark:bg-gray-700 border-transparent',
                        'focus:bg-white dark:focus:bg-gray-600 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20',
                        'transition-all duration-200'
                      )}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <ThemeToggle />

                  <Tooltip content="Notifications">
                    <button
                      className="p-2 rounded-xl text-gray-500 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-gray-700 transition-all relative"
                      aria-label="Notifications"
                    >
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                      <Bell className="w-5 h-5" />
                    </button>
                  </Tooltip>

                  <div className="w-px h-8 bg-gray-200 dark:bg-gray-700 mx-1" />

                  <Avatar size="sm" fallback="AD" status="online" />
                </div>
              </div>
            </header>

            {/* Page content */}
            <main id="main-content" className="flex-1 overflow-y-auto px-4 sm:px-6 pb-6 scrollbar-thin">
              <div className="animate-fade-in-up">
                {children}
              </div>
            </main>
          </div>

          {/* Mobile Overlay */}
          {isMobileMenuOpen && (
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-hidden="true"
            />
          )}

          <SessionTimeoutWarning />
        </div>
      </AdminAuthGate>
    </AuthProvider>
  );
}
