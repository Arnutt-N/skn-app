'use client';

import Link from 'next/link';
import { Sun, Moon, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/components/providers';
import { LandingLanguageToggle } from './LandingLanguageToggle';
import { LandingBrandMark } from './LandingBrandMark';
import { t, type Locale } from '@/lib/i18n/landing';

interface LandingNavbarProps {
  locale: Locale;
  onToggleLocale: () => void;
}

const NAV_LINKS = [
  { href: '#overview', key: 'nav_overview' },
  { href: '#capabilities', key: 'nav_capabilities' },
  { href: '#line', key: 'nav_line' },
  { href: '#contact', key: 'nav_contact' },
] as const;

export function LandingNavbar({ locale, onToggleLocale }: LandingNavbarProps) {
  const { resolvedTheme, toggleTheme } = useTheme();

  return (
    <nav className="sticky top-0 z-50 px-4 pt-4 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="landing-nav-shell flex h-[72px] items-center gap-3 rounded-full px-4 sm:px-6">
          <Link href="/" className="min-w-0 shrink-0">
            <LandingBrandMark compact />
          </Link>

          <div className="hidden xl:flex items-center gap-7 pl-8 text-sm text-slate-600 dark:text-slate-300">
            {NAV_LINKS.map((link) => (
              <a
                key={link.key}
                href={link.href}
                className="thai-no-break transition-colors hover:text-slate-950 dark:hover:text-white"
              >
                {t(locale, link.key)}
              </a>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={toggleTheme}
              aria-label={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="hidden rounded-full border border-slate-200/70 bg-white/75 text-slate-600 shadow-sm hover:bg-white hover:text-slate-950 sm:inline-flex dark:border-white/10 dark:bg-white/5 dark:text-white/70 dark:hover:bg-white/10 dark:hover:text-white"
            >
              {resolvedTheme === 'dark' ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </Button>

            <LandingLanguageToggle locale={locale} onToggle={onToggleLocale} />

            <Button
              variant="ghost"
              size="sm"
              asChild
              className="hidden rounded-full px-4 text-slate-600 hover:bg-white/80 hover:text-slate-950 sm:inline-flex dark:text-white/70 dark:hover:bg-white/10 dark:hover:text-white"
            >
              <Link href="/login">
                {t(locale, 'nav_login')}
              </Link>
            </Button>

            <Button
              size="sm"
              variant="secondary"
              asChild
              className="thai-no-break rounded-full border-0 bg-[var(--color-line-green)] px-4 text-white shadow-[0_14px_30px_hsl(141_73%_42%_/_0.28)] hover:bg-[var(--color-line-green-dark)] hover:text-white"
            >
              <Link href="/liff/service-request">
                {t(locale, 'nav_request')}
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
