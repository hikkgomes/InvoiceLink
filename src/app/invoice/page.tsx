"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { APP_NAME } from "@/lib/constants";
import { verifyInvoice, type InvoicePayload } from "@/lib/invoice";
import { InvoiceDisplay } from "@/components/invoice-display";
import { Loader2 } from "lucide-react";

export default function InvoicePage() {
  const [token, setToken] = useState<string | null>(null);
  const [payload, setPayload] = useState<InvoicePayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = window.location.hash?.slice(1) || "";
    setToken(t || null);
    if (!t) {
        setError("No invoice token found in the URL.");
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    let isActive = true;
    (async () => {
        const p = await verifyInvoice(token);
        if (isActive) {
            if (p) {
                setPayload(p);
            } else {
                setError("This invoice is invalid or has been tampered with.");
            }
        }
    })();
    return () => { isActive = false };
  }, [token]);

  const renderContent = () => {
    if (error) {
        return <p className="text-sm text-destructive">{error}</p>;
    }
    if (!payload) {
      return (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
            <p className="text-sm text-muted-foreground">Verifying invoice…</p>
        </div>
      );
    }
    const isQuoteExpired = Date.now() > payload.exp;
    return <InvoiceDisplay invoice={payload} token={token!} isQuoteInitiallyExpired={isQuoteExpired} />;
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
      <div className="absolute top-8 left-8 text-2xl font-bold text-foreground">
        <Link href="/">{APP_NAME}</Link>
      </div>
      {renderContent()}
    </main>
  );
}
