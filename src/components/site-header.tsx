import Image from 'next/image';
import Link from 'next/link';

import { LanguageSwitcher } from '@/components/language-switcher';
import { APP_NAME } from '@/lib/constants';
import { type I18nMessages, type Locale, withLocaleQuery } from '@/lib/i18n';

interface SiteHeaderProps {
  locale: Locale;
  languageLabels: I18nMessages['footer']['language'];
}

export function SiteHeader({ locale, languageLabels }: SiteHeaderProps) {
  const homeHref = withLocaleQuery('/', locale);

  return (
    <header className="sticky top-0 z-30 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href={homeHref} className="inline-flex items-center gap-2 text-lg font-semibold tracking-tight">
          <Image
            src="/icon.svg"
            alt=""
            width={22}
            height={22}
            className="rounded-md shadow-[0_0_0_1px_rgba(247,147,26,0.45)]"
            priority
          />
          <span className="text-foreground">{APP_NAME}</span>
        </Link>

        <LanguageSwitcher locale={locale} labels={languageLabels} compact />
      </div>
    </header>
  );
}
