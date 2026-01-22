'use client';

import * as React from 'react';

interface TabsContextType {
    activeTab: string;
    setActiveTab: (value: string) => void;
}

const TabsContext = React.createContext<TabsContextType | undefined>(undefined);

export function Tabs({
    defaultValue,
    children,
    className
}: {
    defaultValue: string;
    children: React.ReactNode;
    className?: string;
}) {
    const [activeTab, setActiveTab] = React.useState(defaultValue);

    return (
        <TabsContext.Provider value={{ activeTab, setActiveTab }}>
            <div className={className}>{children}</div>
        </TabsContext.Provider>
    );
}

export function TabsList({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={`flex items-center border-b border-slate-200 mb-6 overflow-x-auto ${className || ''}`}>
            {children}
        </div>
    );
}

export function TabsTrigger({
    value,
    children,
    className
}: {
    value: string;
    children: React.ReactNode;
    className?: string;
}) {
    const context = React.useContext(TabsContext);
    if (!context) throw new Error('TabsTrigger must be used within Tabs');

    const isActive = context.activeTab === value;

    return (
        <button
            className={`
        px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-[2px] whitespace-nowrap
        ${isActive
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}
        ${className || ''}
      `}
            onClick={() => context.setActiveTab(value)}
        >
            {children}
        </button>
    );
}

export function TabsContent({
    value,
    children,
    className
}: {
    value: string;
    children: React.ReactNode;
    className?: string;
}) {
    const context = React.useContext(TabsContext);
    if (!context) throw new Error('TabsContent must be used within Tabs');

    if (context.activeTab !== value) return null;

    return (
        <div className={`animate-in fade-in-0 duration-200 ${className || ''}`}>
            {children}
        </div>
    );
}
