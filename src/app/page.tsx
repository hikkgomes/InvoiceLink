import { ArrowRight, CircleCheckBig, Link2, Shield, Sparkles, Wallet } from 'lucide-react';

import { InvoiceForm } from '@/components/invoice-form';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { getMessages, resolveLocale, withLocaleQuery } from '@/lib/i18n';
import { getCurrencyCatalog } from '@/lib/pricing';

interface HomePageProps {
  searchParams?: Promise<{ lang?: string | string[] }>;
}

export default async function Home({ searchParams }: HomePageProps) {
  const params = (await searchParams) ?? {};
  const locale = resolveLocale(params.lang);
  const messages = getMessages(locale);
  const currencyCatalog = await getCurrencyCatalog();

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 tech-grid opacity-20" />
      <SiteHeader locale={locale} languageLabels={messages.footer.language} />

      <main className="relative mx-auto w-full max-w-6xl px-4 pb-16 pt-10 sm:px-6 sm:pt-14">
        <section className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
          <div className="space-y-6">
            <p className="inline-flex items-center gap-2 rounded-full border border-accent/55 bg-accent/12 px-3 py-1 text-xs uppercase tracking-[0.18em] text-accent">
              <Sparkles className="h-3.5 w-3.5" /> {messages.home.badge}
            </p>
            <h1 className="font-headline text-4xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl">
              {messages.home.heroTitle}
            </h1>
            <p className="max-w-2xl text-base text-muted-foreground sm:text-lg">
              {messages.home.heroDescription}
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="glass-panel rounded-xl border border-border/60 border-t-2 border-t-accent/80 p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">{messages.home.cardNonCustodialTitle}</p>
                <p className="mt-2 text-sm text-foreground">{messages.home.cardNonCustodialBody}</p>
              </div>
              <div className="glass-panel rounded-xl border border-border/60 border-t-2 border-t-accent/80 p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">{messages.home.cardFastSharingTitle}</p>
                <p className="mt-2 text-sm text-foreground">{messages.home.cardFastSharingBody}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-accent/35 bg-card/70 p-1 shadow-[0_28px_85px_rgba(76,29,149,0.34),0_12px_45px_rgba(247,147,26,0.24)]">
            <InvoiceForm locale={locale} messages={messages.form} currencyCatalog={currencyCatalog} />
          </div>
        </section>

        <section id="how-it-works" className="mt-16 space-y-5">
          <h2 className="font-headline text-2xl font-semibold tracking-tight">{messages.home.howItWorksTitle}</h2>
          <div className="grid gap-3 md:grid-cols-3">
            <article className="glass-panel rounded-xl border border-border/60 border-t-2 border-t-accent/80 p-5">
              <Wallet className="mb-3 h-5 w-5 text-accent" />
              <h3 className="text-base font-semibold">{messages.home.step1Title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{messages.home.step1Body}</p>
            </article>
            <article className="glass-panel rounded-xl border border-border/60 border-t-2 border-t-accent/80 p-5">
              <Link2 className="mb-3 h-5 w-5 text-accent" />
              <h3 className="text-base font-semibold">{messages.home.step2Title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{messages.home.step2Body}</p>
            </article>
            <article className="glass-panel rounded-xl border border-border/60 border-t-2 border-t-accent/80 p-5">
              <CircleCheckBig className="mb-3 h-5 w-5 text-accent" />
              <h3 className="text-base font-semibold">{messages.home.step3Title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{messages.home.step3Body}</p>
            </article>
          </div>
        </section>

        <section id="risk-notes" className="mt-16 rounded-2xl border border-accent/35 bg-card/70 p-6">
          <div className="flex items-start gap-3">
            <Shield className="mt-0.5 h-5 w-5 text-accent" />
            <div>
              <h2 className="font-headline text-xl font-semibold">{messages.home.riskTitle}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{messages.home.riskBody}</p>
              <a
                href={withLocaleQuery('/legal', locale)}
                className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline"
              >
                {messages.home.riskLink} <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter locale={locale} messages={messages.footer} />
    </div>
  );
}
