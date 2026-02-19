'use client';

import { ThemeProvider } from './ThemeProvider';
import { ToastProvider } from '@/components/ui/Toast';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider>
      <ToastProvider>{children}</ToastProvider>
    </ThemeProvider>
  );
}

export { useTheme } from './ThemeProvider';
