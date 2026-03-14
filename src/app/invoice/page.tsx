import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';

export default function InvoiceMissingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 tech-grid opacity-20" />
      <SiteHeader />

      <main className="relative mx-auto flex min-h-[calc(100vh-172px)] w-full max-w-6xl items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-xl rounded-xl border border-border/60 bg-card/70 p-6 text-center">
          <h1 className="font-headline text-2xl font-semibold">Missing invoice ID</h1>
          <p className="mt-2 text-sm text-muted-foreground">The invoice URL is incomplete. Ask the merchant to resend the full link.</p>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
