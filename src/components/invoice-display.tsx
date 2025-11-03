'use client';

import { useState, useEffect } from 'react';
import QRCode from "qrcode";
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { type InvoicePayload } from '@/lib/invoice';
import { refreshQuoteForToken, checkPaymentStatusFiatMatch, satsToBtcString } from '@/app/actions';
import { Bitcoin, Clock, Copy, ExternalLink, Loader2, RefreshCw, CheckCircle2, CalendarOff } from 'lucide-react';
import { Badge } from './ui/badge';

type InvoiceStatus = 'pending' | 'detected' | 'confirmed' | 'quote_expired' | 'invoice_expired' | 'error' | 'refreshing';

function formatTime(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function formatExpiryDate(timestamp: number) {
    const date = new Date(timestamp);
    return date.toLocaleDateString(undefined, {
        year: 'numeric', month: 'long', day: 'numeric'
    });
}

export function InvoiceDisplay({ invoice, token, isQuoteInitiallyExpired }: { invoice: InvoicePayload, token: string, isQuoteInitiallyExpired: boolean }) {
  const [timeLeft, setTimeLeft] = useState(invoice.exp - Date.now());
  const router = useRouter();
  
  const isInvoiceExpired = invoice.invoiceExpiresAt ? Date.now() > invoice.invoiceExpiresAt : false;
  
  const getInitialStatus = (): InvoiceStatus => {
    if (isInvoiceExpired) return 'invoice_expired';
    if (isQuoteInitiallyExpired) return 'quote_expired';
    return 'pending';
  };

  const [paymentStatus, setPaymentStatus] = useState<InvoiceStatus>(getInitialStatus());
  const [txId, setTxId] = useState<string | null>(null);

  const { toast } = useToast();
  
  const bip21Link = `bitcoin:${invoice.address}?amount=${satsToBtcString(invoice.amountSats)}&label=${encodeURIComponent(invoice.description)}`;
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    QRCode.toDataURL(bip21Link, { margin: 1, width: 256 }).then(setQrDataUrl).catch(() => setQrDataUrl(null));
  }, [bip21Link]);

  // 1) Poll Blockchair fiat-match FIRST (so paid invoices never refresh)
  useEffect(() => {
    if (paymentStatus !== 'pending') return;
    const paymentCheckInterval = setInterval(async () => {
      const res = await checkPaymentStatusFiatMatch({
        address: invoice.address,
        fiatAmount: invoice.amountFiat,
        currency: invoice.currency,
        createdAt: invoice.iat,
        invoiceExpiresAt: invoice.invoiceExpiresAt ?? (Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
      if (res.status === 'detected' || res.status === 'confirmed') {
        setPaymentStatus(res.status);
        setTxId((res as any).txid || null);
        clearInterval(paymentCheckInterval);
      } else if (res.status === 'error') {
        setPaymentStatus('error');
        clearInterval(paymentCheckInterval);
      }
    }, 5000);
    return () => clearInterval(paymentCheckInterval);
  }, [paymentStatus, invoice]);

  // 2) Auto-refresh ONLY if still pending when quote expires
  useEffect(() => {
    if (paymentStatus !== 'pending') return;
    const timer = setInterval(() => {
      const remaining = invoice.exp - Date.now();
      if (remaining <= 0) {
        clearInterval(timer);
        setPaymentStatus('refreshing');
        refreshQuoteForToken(token).then(result => {
          if (result?.token) {
            const url = new URL(window.location.href);
            url.hash = "#" + result.token;
            window.history.replaceState({}, "", url.toString());
            router.refresh(); // This re-runs the page component with the new token
          } else if (result?.error) {
            toast({ variant: 'destructive', title: 'Refresh Failed', description: result.error });
            setPaymentStatus('error');
          }
        });
      } else {
        setTimeLeft(remaining);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [paymentStatus, invoice.exp, token, router, toast]);

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast({
      description: `${type} copied to clipboard.`,
    });
  };

  const statusInfo = {
    pending: { text: 'Waiting for payment', color: 'bg-yellow-500/80', icon: <Loader2 className="h-4 w-4 animate-spin" /> },
    detected: { text: 'Payment detected', color: 'bg-blue-500', icon: <CheckCircle2 className="h-4 w-4" /> },
    confirmed: { text: 'Payment confirmed', color: 'bg-green-500', icon: <CheckCircle2 className="h-4 w-4" /> },
    quote_expired: { text: 'Quote expired', color: 'bg-red-500', icon: <Clock className="h-4 w-4" /> },
    refreshing: { text: 'Refreshing quote...', color: 'bg-blue-500', icon: <RefreshCw className="h-4 w-4 animate-spin" /> },
    invoice_expired: { text: 'Invoice expired', color: 'bg-destructive', icon: <CalendarOff className="h-4 w-4" /> },
    error: { text: 'Status check error', color: 'bg-gray-500', icon: <Clock className="h-4 w-4" /> },
  };
  
  const currentStatus = statusInfo[paymentStatus];

  return (
    <Card className="w-full max-w-sm overflow-hidden shadow-2xl shadow-primary/20">
      <CardHeader className="p-4 bg-card-foreground/5">
         <div className="flex items-center justify-between">
           <CardTitle className="text-lg">Bitcoin Invoice</CardTitle>
           <Badge variant="outline" className={`border-0 text-white ${currentStatus.color}`}>
             {currentStatus.icon}
             <span className="ml-2">{currentStatus.text}</span>
           </Badge>
         </div>
         {invoice.description && <CardDescription>{invoice.description}</CardDescription>}
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="flex flex-col items-center justify-center">
            {qrDataUrl ? (
              <div className="bg-white p-2 rounded-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrDataUrl} alt="Bitcoin QR Code" width={200} height={200} />
              </div>
            ) : (
              <div className="w-[200px] h-[200px] flex items-center justify-center bg-muted rounded-lg">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}
        </div>

        <div className="space-y-4 text-center">
            <div className="cursor-pointer" onClick={() => handleCopy(satsToBtcString(invoice.amountSats), 'BTC amount')}>
                <p className="text-sm text-muted-foreground">Amount</p>
                <p className="text-2xl font-bold font-mono tracking-tighter flex items-center justify-center gap-2">
                    <Bitcoin className="h-6 w-6 text-accent" /> {satsToBtcString(invoice.amountSats)}
                </p>
                <p className="text-sm text-muted-foreground">≈ {invoice.amountFiat.toFixed(2)} {invoice.currency}</p>
            </div>

            <div className="text-xs text-muted-foreground break-all cursor-pointer" onClick={() => handleCopy(invoice.address, 'Address')}>
                <p>Send to:</p>
                <p className="font-mono">{invoice.address}</p>
            </div>
        </div>
        
        {paymentStatus === 'pending' && (
          <div>
            <div className="flex justify-between items-center text-sm mb-1">
              <span className="text-muted-foreground flex items-center gap-1"><Clock className="h-4 w-4" /> Quote expires in</span>
              <span className="font-mono font-medium">{formatTime(timeLeft)}</span>
            </div>
            <Progress value={(timeLeft / QUOTE_EXPIRY_MS) * 100} className="h-2" />
          </div>
        )}

        {invoice.invoiceExpiresAt && (
            <div className="text-center text-xs text-muted-foreground pt-2">
                Invoice valid until {formatExpiryDate(invoice.invoiceExpiresAt)}
            </div>
        )}

      </CardContent>
      <CardFooter className="flex flex-col gap-2 bg-card-foreground/5 p-4">
        {paymentStatus === 'pending' && (
          <Button className="w-full" asChild>
            <a href={bip21Link}>
              <Copy className="mr-2 h-4 w-4" /> Open in Wallet
            </a>
          </Button>
        )}
        {(paymentStatus === 'detected' || paymentStatus === 'confirmed') && txId && (
            <Button variant="secondary" className="w-full" asChild>
                <a href={`https://mempool.space/tx/${txId}`} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" /> View Transaction
                </a>
            </Button>
        )}
        {paymentStatus === 'pending' && (
          <Button variant="ghost" className="w-full" onClick={() => handleCopy(bip21Link, 'Payment link')}>
            <Copy className="mr-2 h-4 w-4" /> Copy Payment Link
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
