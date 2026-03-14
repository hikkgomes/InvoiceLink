'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { type Locale, SUPPORTED_LOCALES, type I18nMessages, DEFAULT_LOCALE } from '@/lib/i18n';

interface LanguageSwitcherProps {
  locale: Locale;
  labels: I18nMessages['footer']['language'];
}

export function LanguageSwitcher({ locale, labels }: LanguageSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

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
    <label className="flex items-center gap-2 text-xs text-muted-foreground">
      <span>{labels.label}</span>
      <select
        className="h-8 rounded-md border border-border/70 bg-card/70 px-2 text-xs text-foreground outline-none focus-visible:ring-1 focus-visible:ring-ring"
        value={locale}
        onChange={(event) => onChange(event.target.value as Locale)}
      >
        {SUPPORTED_LOCALES.map((value) => (
          <option key={value} value={value}>
            {labels.options[value]}
          </option>
        ))}
      </select>
    </label>
  );
}
