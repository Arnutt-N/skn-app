'use client';

import Link from 'next/link';
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  FileText,
  Headphones,
  MessageCircle,
  Send,
  Settings,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { t, type Locale } from '@/lib/i18n/landing';

interface LandingHeroProps {
  locale: Locale;
}

const HERO_STEPS = [
  { icon: MessageCircle, titleKey: 'hero_panel_step_1_title', descKey: 'hero_panel_step_1_desc', line: true },
  { icon: Headphones, titleKey: 'hero_panel_step_2_title', descKey: 'hero_panel_step_2_desc', line: false },
  { icon: BarChart3, titleKey: 'hero_panel_step_3_title', descKey: 'hero_panel_step_3_desc', line: false },
] as const;

const HERO_METRICS = [
  { labelKey: 'hero_panel_metric_1_label', valueKey: 'hero_panel_metric_1_value' },
  { labelKey: 'hero_panel_metric_2_label', valueKey: 'hero_panel_metric_2_value' },
  { labelKey: 'hero_panel_metric_3_label', valueKey: 'hero_panel_metric_3_value' },
] as const;

export function LandingHero({ locale }: LandingHeroProps) {
  return (
    <section className="relative px-6 pb-20 pt-6 sm:pb-24 sm:pt-8">
      <div className="mx-auto grid max-w-7xl gap-12 lg:min-h-[calc(100svh-7rem)] lg:grid-cols-[minmax(0,0.88fr)_minmax(26rem,1.12fr)] lg:items-center">
        <div className="max-w-2xl pt-8 lg:pt-14">
          <Badge
            variant="outline"
            className="animate-fade-in rounded-full border-slate-200/80 bg-white/75 px-4 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-white/65"
          >
            {t(locale, 'hero_badge')}
          </Badge>

          <h1 className="animate-fade-in-up mt-6 text-balance text-[clamp(3.15rem,8vw,5.8rem)] font-semibold tracking-[-0.055em] text-slate-950 dark:text-white">
            <span className="block thai-no-break">{t(locale, 'hero_title')}</span>
          </h1>

          <p className="animate-fade-in-up mt-6 max-w-2xl text-balance text-lg leading-8 text-slate-700 dark:text-slate-200 sm:text-xl">
            {t(locale, 'hero_subtitle_prefix')}{' '}
            <span className="line-accent md:whitespace-nowrap font-semibold">
              {t(locale, 'hero_subtitle_line')}
            </span>
          </p>

          <p className="animate-fade-in-up mt-4 max-w-xl text-base leading-7 text-slate-600 dark:text-slate-300">
            {t(locale, 'hero_desc')}
          </p>

          <div className="animate-fade-in-up mt-8 flex flex-wrap gap-3 text-sm text-slate-600 dark:text-slate-300">
            <span className="thai-no-break rounded-full border border-slate-200/70 bg-white/80 px-3 py-1.5 dark:border-white/10 dark:bg-white/5">
              {t(locale, 'hero_highlight_1')}
            </span>
            <span className="thai-no-break line-chip rounded-full px-3 py-1.5">
              {t(locale, 'hero_highlight_2')}
            </span>
            <span className="thai-no-break rounded-full border border-slate-200/70 bg-white/80 px-3 py-1.5 dark:border-white/10 dark:bg-white/5">
              {t(locale, 'hero_highlight_3')}
            </span>
          </div>

          <div className="animate-fade-in-up mt-10 flex flex-col gap-4 sm:flex-row">
            <Button
              size="lg"
              variant="secondary"
              className="thai-no-break rounded-full border-slate-950 bg-slate-950 px-6 text-white shadow-[0_18px_34px_hsl(219_42%_12%_/_0.18)] hover:border-slate-800 hover:bg-slate-800 hover:text-white dark:border-white dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
              asChild
            >
              <Link href="/admin">
                <Settings className="w-4 h-4 mr-1" />
                {t(locale, 'hero_cta_admin')}
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>

            <Button
              size="lg"
              variant="secondary"
              className="thai-no-break rounded-full border-0 bg-[var(--color-line-green)] px-6 text-white shadow-[0_18px_34px_hsl(141_73%_42%_/_0.26)] hover:bg-[var(--color-line-green-dark)] hover:text-white"
              asChild
            >
              <Link href="/liff/service-request">
                <Send className="w-4 h-4 mr-1" />
                {t(locale, 'hero_cta_request')}
              </Link>
            </Button>
          </div>
        </div>

        <div className="relative animate-fade-in-up lg:justify-self-end">
          <div className="absolute -inset-4 rounded-[2rem] bg-[radial-gradient(circle_at_top_right,hsl(141_73%_42%_/_0.15),transparent_42%),radial-gradient(circle_at_bottom_left,hsl(217_91%_60%_/_0.18),transparent_48%)] blur-2xl" />

          <div className="landing-hero-panel relative overflow-hidden rounded-[2rem]">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-5 sm:px-8">
              <div>
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-white/55">
                  {t(locale, 'hero_panel_eyebrow')}
                </p>
                <h2 className="mt-2 text-xl font-semibold tracking-tight text-white">
                  {t(locale, 'hero_panel_title')}
                </h2>
              </div>

              <span className="line-chip inline-flex items-center gap-2 rounded-full px-3 py-1 text-[0.72rem] font-semibold">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {t(locale, 'hero_panel_status')}
              </span>
            </div>

            <div className="px-6 py-6 sm:px-8 sm:py-8">
              <p className="max-w-2xl text-sm leading-7 text-white/72 sm:text-[0.95rem]">
                {t(locale, 'hero_panel_desc')}
              </p>

              <div className="mt-6 space-y-4">
                {HERO_STEPS.map((step, index) => {
                  const Icon = step.icon;

                  return (
                    <div
                      key={step.titleKey}
                      className="rounded-[1.5rem] border border-white/10 bg-white/6 p-4 backdrop-blur-sm transition-transform duration-300 hover:-translate-y-0.5 hover:bg-white/9"
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border text-sm font-semibold ${
                            step.line
                              ? 'border-[hsl(141_73%_42%_/_0.25)] bg-[hsl(141_73%_42%_/_0.14)] text-[hsl(141_80%_78%)]'
                              : 'border-white/12 bg-white/10 text-white'
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                        </div>

                        <div className="min-w-0">
                          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-white/45">
                            0{index + 1}
                          </p>
                          <h3 className="mt-1 text-base font-semibold text-white">
                            {t(locale, step.titleKey)}
                          </h3>
                          <p className="mt-1 text-sm leading-6 text-white/65">
                            {t(locale, step.descKey)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-8 grid gap-4 border-t border-white/10 pt-6 sm:grid-cols-3">
                {HERO_METRICS.map((metric) => (
                  <div key={metric.labelKey}>
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-white/40">
                      {t(locale, metric.labelKey)}
                    </p>
                    <div className="mt-2 flex items-center gap-2 text-sm font-medium text-white/85">
                      <FileText className="h-4 w-4 text-[hsl(141_80%_72%)]" />
                      <span className="thai-no-break">{t(locale, metric.valueKey)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
