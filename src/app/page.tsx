import { ArrowRight, CircleCheckBig, Link2, Shield, Sparkles, Wallet } from 'lucide-react';

import { InvoiceForm } from '@/components/invoice-form';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { APP_NAME } from '@/lib/constants';

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 tech-grid opacity-20" />
      <SiteHeader />

      <main className="relative mx-auto w-full max-w-6xl px-4 pb-16 pt-10 sm:px-6 sm:pt-14">
        <section className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
          <div className="space-y-6">
            <p className="inline-flex items-center gap-2 rounded-full border border-accent/55 bg-accent/12 px-3 py-1 text-xs uppercase tracking-[0.18em] text-accent">
              <Sparkles className="h-3.5 w-3.5" /> Built for direct Bitcoin payments
            </p>
            <h1 className="font-headline text-4xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl">
              Invoicing for Bitcoin businesses without custody or complexity.
            </h1>
            <p className="max-w-2xl text-base text-muted-foreground sm:text-lg">
              {APP_NAME} lets you generate branded payment requests in seconds. Send one link to your client and receive funds
              directly in your own wallet.
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="glass-panel rounded-xl border border-border/60 border-t-2 border-t-accent/80 p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Non-custodial</p>
                <p className="mt-2 text-sm text-foreground">You control keys and wallet access. We never hold funds.</p>
              </div>
              <div className="glass-panel rounded-xl border border-border/60 border-t-2 border-t-accent/80 p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Fast link sharing</p>
                <p className="mt-2 text-sm text-foreground">Share a payment page your client can open instantly.</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-accent/35 bg-card/70 p-1 shadow-[0_28px_85px_rgba(76,29,149,0.34),0_12px_45px_rgba(247,147,26,0.24)]">
            <InvoiceForm />
          </div>
        </section>

        <section id="how-it-works" className="mt-16 space-y-5">
          <h2 className="font-headline text-2xl font-semibold tracking-tight">How it works</h2>
          <div className="grid gap-3 md:grid-cols-3">
            <article className="glass-panel rounded-xl border border-border/60 border-t-2 border-t-accent/80 p-5">
              <Wallet className="mb-3 h-5 w-5 text-accent" />
              <h3 className="text-base font-semibold">1. Create an invoice</h3>
              <p className="mt-2 text-sm text-muted-foreground">Set amount, currency, wallet address, and optional description.</p>
            </article>
            <article className="glass-panel rounded-xl border border-border/60 border-t-2 border-t-accent/80 p-5">
              <Link2 className="mb-3 h-5 w-5 text-accent" />
              <h3 className="text-base font-semibold">2. Send the link</h3>
              <p className="mt-2 text-sm text-muted-foreground">Share a payment page with QR code, amount, and quote validity timer.</p>
            </article>
            <article className="glass-panel rounded-xl border border-border/60 border-t-2 border-t-accent/80 p-5">
              <CircleCheckBig className="mb-3 h-5 w-5 text-accent" />
              <h3 className="text-base font-semibold">3. Track status live</h3>
              <p className="mt-2 text-sm text-muted-foreground">See payment progress live from detection through confirmation.</p>
            </article>
          </div>
        </section>

        <section id="risk-notes" className="mt-16 rounded-2xl border border-accent/35 bg-card/70 p-6">
          <div className="flex items-start gap-3">
            <Shield className="mt-0.5 h-5 w-5 text-accent" />
            <div>
              <h2 className="font-headline text-xl font-semibold">Operational notes</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Prices and chain data come from external providers and can fail or drift. Final payment settlement depends on
                Bitcoin network conditions and confirmations.
              </p>
              <a href="/legal" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline">
                Read legal and risk disclosures <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
