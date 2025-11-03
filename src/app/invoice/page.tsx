"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { APP_NAME } from "@/lib/constants";
import { InvoiceDisplay } from "@/components/invoice-display";
import { parseInvoiceToken } from "@/app/actions";
import { InvoicePayload } from "@/lib/invoice";

export default function InvoicePage() {
  const [payload, setPayload] = useState<InvoicePayload | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const handleHashChange = () => {
      const t = window.location.hash.slice(1);
      if (!t) {
        setPayload(null);
        setToken(null);
        setErr("No invoice token found.");
        return;
      }
      setErr(null);
      setToken(t);
      parseInvoiceToken(t)
        .then((res) => {
          if (res?.error) {
            setErr(res.error);
            setPayload(null);
          } else {
            setPayload(res.payload);
          }
        })
        .catch(() => setErr("Failed to verify token."));
    };
    
    // Initial load
    handleHashChange();

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleInvoiceUpdate = (newToken: string, newPayload: InvoicePayload) => {
    // This function will be passed down to InvoiceDisplay to allow it to update the parent state
    const url = new URL(window.location.href);
    url.hash = '#' + newToken;
    window.history.replaceState({}, '', url.toString());

    setToken(newToken);
    setPayload(newPayload);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
      <div className="absolute top-8 left-8 text-2xl font-bold text-foreground">
        <Link href="/">{APP_NAME}</Link>
      </div>

      {err ? (
        <p className="text-sm text-red-500">{err}</p>
      ) : !payload || !token ? (
        <p className="text-sm text-muted-foreground">Verifying invoice…</p>
      ) : (
        <InvoiceDisplay
          initialInvoice={payload}
          initialToken={token}
          onInvoiceUpdate={handleInvoiceUpdate}
        />
      )}
    </main>
  );
}
