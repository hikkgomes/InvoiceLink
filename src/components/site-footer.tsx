import Link from 'next/link';

import { LanguageSwitcher } from '@/components/language-switcher';
import { ThemeToggle } from '@/components/theme-toggle';
import { LEGAL_CONTACT_EMAIL } from '@/lib/constants';
import { type Locale, type I18nMessages, withLocaleQuery } from '@/lib/i18n';

interface SiteFooterProps {
  locale: Locale;
  messages: I18nMessages['footer'];
}

export function SiteFooter({ locale, messages }: SiteFooterProps) {
  const legalHref = withLocaleQuery('/legal', locale);
  const privacyHref = withLocaleQuery('/privacy', locale);
  const termsHref = withLocaleQuery('/terms', locale);
  const line2Prefix = messages.disclaimerLine2.split(LEGAL_CONTACT_EMAIL)[0] ?? messages.disclaimerLine2;

  return (
    <footer className="border-t border-border/50 bg-background/80">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-6 sm:px-6">
        <div className="max-w-2xl space-y-2 text-xs text-muted-foreground">
          <p>{messages.disclaimerLine1}</p>
          <p>
            {line2Prefix}
            <a className="text-accent hover:underline" href={`mailto:${LEGAL_CONTACT_EMAIL}`}>
              {LEGAL_CONTACT_EMAIL}
            </a>
          </p>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-4">
          <nav className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <Link className="hover:text-foreground" href={legalHref}>
              {messages.links.legal}
            </Link>
            <Link className="hover:text-foreground" href={privacyHref}>
              {messages.links.privacy}
            </Link>
            <Link className="hover:text-foreground" href={termsHref}>
              {messages.links.terms}
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <LanguageSwitcher locale={locale} labels={messages.language} />
            <ThemeToggle
              compact
              labels={{
                light: messages.theme.light,
                dark: messages.theme.dark,
                aria: messages.theme.toggleAria,
              }}
            />
          </div>
        </div>
      </div>
    </footer>
  );
}
