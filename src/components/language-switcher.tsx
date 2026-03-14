'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { type Locale, SUPPORTED_LOCALES, type I18nMessages, DEFAULT_LOCALE } from '@/lib/i18n';
import { cn } from '@/lib/utils';

const LANGUAGE_FLAGS: Record<Locale, string> = {
  en: '🇬🇧',
  es: '🇪🇸',
  pt: '🇵🇹',
  fr: '🇫🇷',
  de: '🇩🇪',
  it: '🇮🇹',
};

interface LanguageSwitcherProps {
  locale: Locale;
  labels: I18nMessages['footer']['language'];
  compact?: boolean;
}

export function LanguageSwitcher({ locale, labels, compact = false }: LanguageSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const sortedLocales = [...SUPPORTED_LOCALES].sort((left, right) =>
    labels.options[left].localeCompare(labels.options[right]),
  );

  const onChange = (nextLocale: Locale) => {
    const params = new URLSearchParams(searchParams.toString());
    if (nextLocale === DEFAULT_LOCALE) {
      params.delete('lang');
    } else {
      params.set('lang', nextLocale);
    }

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    router.refresh();
  };

  return (
    <label className={cn('flex items-center gap-2 text-xs text-muted-foreground', compact ? 'gap-1' : '')}>
      {!compact ? <span>{labels.label}</span> : null}
      <select
        className={cn(
          'h-8 rounded-md border border-border/70 bg-card/70 px-2 text-xs text-foreground outline-none focus-visible:ring-1 focus-visible:ring-ring',
          compact ? 'w-[112px]' : '',
        )}
        value={locale}
        onChange={(event) => onChange(event.target.value as Locale)}
        aria-label={labels.label}
      >
        {sortedLocales.map((value) => (
          <option key={value} value={value}>
            {LANGUAGE_FLAGS[value]} {labels.options[value]}
          </option>
        ))}
      </select>
    </label>
  );
}
