import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { type I18nMessages, type Locale } from '@/lib/i18n';

type LegalSection = {
  heading: string;
  paragraphs: string[];
};

interface LegalPageProps {
  locale: Locale;
  footerMessages: I18nMessages['footer'];
  updatedPrefix: string;
  title: string;
  intro: string;
  updatedOn: string;
  sections: LegalSection[];
}

export function LegalPage({ locale, footerMessages, updatedPrefix, title, intro, updatedOn, sections }: LegalPageProps) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 tech-grid opacity-20" />
      <SiteHeader locale={locale} languageLabels={footerMessages.language} />

      <main className="relative mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
        <article className="glass-panel rounded-2xl border border-border/60 p-6 sm:p-8">
          <p className="text-xs uppercase tracking-[0.14em] text-primary">
            {updatedPrefix} {updatedOn}
          </p>
          <h1 className="mt-2 font-headline text-3xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-4 text-sm text-muted-foreground sm:text-base">{intro}</p>

          <div className="mt-8 space-y-8">
            {sections.map((section) => (
              <section key={section.heading}>
                <h2 className="font-headline text-xl font-semibold tracking-tight">{section.heading}</h2>
                <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </article>
      </main>

      <SiteFooter locale={locale} messages={footerMessages} />
    </div>
  );
}
