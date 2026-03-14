'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { loadInvoice } from '@/app/actions';
import { InvoiceDisplay } from '@/components/invoice-display';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import type { InvoicePayload } from '@/lib/invoice';

export default function InvoicePage() {
  const params = useParams<{ invoiceId: string }>();
  const searchParams = useSearchParams();

  const [payload, setPayload] = useState<InvoicePayload | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const invoiceId = params.invoiceId;
  const accessKey = searchParams.get('k') || '';

  useEffect(() => {
    if (!invoiceId || !accessKey) {
      setPayload(null);
      setErr('Invalid invoice link');
      return;
    }

    setErr(null);
    loadInvoice(invoiceId, accessKey)
      .then((res) => {
        if ('error' in res) {
          setPayload(null);
          setErr(res.error);
        } else {
          setPayload(res.payload);
        }
      })
      .catch(() => {
        setPayload(null);
        setErr('Failed to load invoice');
      });
  }, [invoiceId, accessKey]);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 tech-grid opacity-20" />
      <SiteHeader />

      <main className="relative mx-auto flex min-h-[calc(100vh-172px)] w-full max-w-6xl flex-col items-center justify-center px-4 py-10 sm:px-6">
        {err ? (
          <div className="w-full max-w-lg rounded-xl border border-destructive/40 bg-destructive/10 p-5 text-center text-sm text-destructive">
            {err}
          </div>
        ) : !payload ? (
          <div className="w-full max-w-lg rounded-xl border border-border/60 bg-card/70 p-5 text-center text-sm text-muted-foreground">
            Loading invoice...
          </div>
        ) : (
          <InvoiceDisplay initialInvoice={payload} accessKey={accessKey} />
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
