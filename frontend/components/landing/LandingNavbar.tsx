'use client';

import Link from 'next/link';
import { Sun, Moon, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/components/providers';
import { LandingLanguageToggle } from './LandingLanguageToggle';
import { t, type Locale } from '@/lib/i18n/landing';

interface LandingNavbarProps {
  locale: Locale;
  onToggleLocale: () => void;
}

export function LandingNavbar({ locale, onToggleLocale }: LandingNavbarProps) {
  const { resolvedTheme, toggleTheme } = useTheme();

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-xl bg-bg/80 border-b border-border-subtle">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl gradient-logo flex items-center justify-center text-white font-bold text-sm shadow-md shadow-brand-500/20">
            JS
          </div>
          <span className="font-semibold text-text-primary tracking-tight hidden sm:inline">
            JSK Platform
          </span>
        </div>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-8 text-sm text-text-secondary">
          <a href="#features" className="hover:text-text-primary transition-colors">
            {t(locale, 'nav_features')}
          </a>
          <a href="#stats" className="hover:text-text-primary transition-colors">
            {t(locale, 'nav_stats')}
          </a>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={toggleTheme}
            aria-label={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {resolvedTheme === 'dark' ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </Button>

          {/* Language toggle */}
          <LandingLanguageToggle locale={locale} onToggle={onToggleLocale} />

          {/* Login */}
          <Button variant="ghost" size="sm" asChild>
            <Link href="/login">
              {t(locale, 'nav_login')}
            </Link>
          </Button>

          {/* Dashboard CTA */}
          <Button
            size="sm"
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            asChild
            className="hidden sm:inline-flex"
          >
            <Link href="/admin">
              {t(locale, 'nav_dashboard')}
            </Link>
          </Button>
        </div>
      </div>
    </nav>
  );
}
