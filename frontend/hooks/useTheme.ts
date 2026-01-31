'use client';

import { useEffect, useState, useCallback } from 'react';

type Theme = 'light' | 'dark';

export const useTheme = () => {
    const [theme, setTheme] = useState<Theme>('light');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const stored = localStorage.getItem('jsk-admin-theme') as Theme;
        if (stored && (stored === 'light' || stored === 'dark')) {
            setTheme(stored);
            document.documentElement.classList.toggle('dark', stored === 'dark');
        }
    }, []);

    const toggleTheme = useCallback(() => {
        const newTheme: Theme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        localStorage.setItem('jsk-admin-theme', newTheme);
        document.documentElement.classList.toggle('dark', newTheme === 'dark');
    }, [theme]);

    return { theme, toggleTheme, mounted };
};
