'use client';

import { useEffect, useState, useCallback } from 'react';

type Theme = 'light' | 'dark';

export const useTheme = () => {
    const [theme, setTheme] = useState<Theme>(() => {
        if (typeof window === 'undefined') return 'light';
        const stored = localStorage.getItem('jsk-admin-theme');
        return stored === 'dark' ? 'dark' : 'light';
    });
    const mounted = true;

    useEffect(() => {
        document.documentElement.classList.toggle('dark', theme === 'dark');
    }, [theme]);

    const toggleTheme = useCallback(() => {
        const newTheme: Theme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        localStorage.setItem('jsk-admin-theme', newTheme);
        document.documentElement.classList.toggle('dark', newTheme === 'dark');
    }, [theme]);

    return { theme, toggleTheme, mounted };
};
