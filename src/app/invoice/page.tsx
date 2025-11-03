"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { APP_NAME } from "@/lib/constants";
import { InvoiceDisplay } from "@/components/invoice-display";
import { parseInvoiceToken } from "@/app/actions";

export default function InvoicePage() {
  const [payload, setPayload] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const t = window.location.hash.slice(1);
    if (!t) {
      setErr("No invoice token found.");
      return;
    }
    setToken(t);
    parseInvoiceToken(t)
      .then((res) => {
        if (res?.error) setErr(res.error);
        else setPayload(res.payload);
      })
      .catch(() => setErr("Failed to verify token."));
  }, []);

  const isQuoteExpired = payload ? Date.now() > payload.exp : false;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
      <div className="absolute top-8 left-8 text-2xl font-bold text-foreground">
        <Link href="/">{APP_NAME}</Link>
      </div>

      {err ? (
        <p className="text-sm text-red-500">{err}</p>
      ) : !payload ? (
        <p className="text-sm text-muted-foreground">Verifying invoice…</p>
      ) : (
        <InvoiceDisplay
          invoice={payload}
          token={token!}
          isQuoteInitiallyExpired={isQuoteExpired}
        />
      )}
    </main>
  );
}
