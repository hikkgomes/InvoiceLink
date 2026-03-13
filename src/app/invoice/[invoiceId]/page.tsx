'use client';

import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { loadInvoice } from '@/app/actions';
import { InvoiceDisplay } from '@/components/invoice-display';
import { APP_NAME } from '@/lib/constants';
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
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="absolute left-8 top-8 text-2xl font-bold text-foreground">
        <Link href="/">{APP_NAME}</Link>
      </div>

      {err ? (
        <p className="text-sm text-red-500">{err}</p>
      ) : !payload ? (
        <p className="text-sm text-muted-foreground">Loading invoice...</p>
      ) : (
        <InvoiceDisplay initialInvoice={payload} accessKey={accessKey} />
      )}
    </main>
  );
}
