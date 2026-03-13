'use client';

import { useState, useEffect } from 'react';
import QRCode from "qrcode";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { type InvoicePayload, satsToBtcString } from '@/lib/invoice';
import { mergePolledPaymentStatus, type InvoiceStatus } from '@/lib/payment-status';
import { refreshQuoteForToken, checkPaymentStatusFiatMatch } from '@/app/actions';
import { QUOTE_EXPIRY_MS } from '@/lib/constants';
import { Bitcoin, Clock, Copy, ExternalLink, Loader2, RefreshCw, CheckCircle2, CalendarOff } from 'lucide-react';
import { Badge } from './ui/badge';

const PAYMENT_POLL_INTERVAL_MS = 10_000;

function formatTime(ms: number) {
  if (ms < 0) return "00:00";
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

interface InvoiceDisplayProps {
    initialInvoice: InvoicePayload;
    initialToken: string;
    onInvoiceUpdate: (newToken: string, newPayload: InvoicePayload) => void;
}

function getStatusFromInvoice(invoice: InvoicePayload): InvoiceStatus {
  if (Date.now() > invoice.invoiceExpiresAt) return 'invoice_expired';
  if (Date.now() > invoice.quoteExpiresAt) return 'quote_expired';
  return 'pending';
}

export function InvoiceDisplay({ initialInvoice, initialToken, onInvoiceUpdate }: InvoiceDisplayProps) {
  const [invoice, setInvoice] = useState(initialInvoice);
  const [token, setToken] = useState(initialToken);
  const [timeLeft, setTimeLeft] = useState(invoice.quoteExpiresAt - Date.now());
  const [paymentStatus, setPaymentStatus] = useState<InvoiceStatus>(() => getStatusFromInvoice(initialInvoice));
  const [txId, setTxId] = useState<string | null>(null);

  const { toast } = useToast();
  
  const bip21Link = `bitcoin:${invoice.address}?amount=${satsToBtcString(invoice.amountSats)}&label=${encodeURIComponent(invoice.description)}`;
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  // Update QR code when invoice changes
  useEffect(() => {
    QRCode.toDataURL(bip21Link, { margin: 1, width: 256 }).then(setQrDataUrl).catch(() => setQrDataUrl(null));
  }, [bip21Link]);
  
  // Reset component state when initial props change
  useEffect(() => {
    setInvoice(initialInvoice);
    setToken(initialToken);
    setTxId(null);
    setTimeLeft(initialInvoice.quoteExpiresAt - Date.now());
    setPaymentStatus(getStatusFromInvoice(initialInvoice));
  }, [initialInvoice, initialToken]);


  // 1) Poll Blockchair fiat-match FIRST (so paid invoices never refresh)
  useEffect(() => {
    if (paymentStatus !== 'pending' && paymentStatus !== 'detected') return;

    const poll = async () => {
      try {
        if (Date.now() > invoice.invoiceExpiresAt) {
          setPaymentStatus((current) => (current === 'confirmed' ? current : 'invoice_expired'));
          return;
        }

        const res = await checkPaymentStatusFiatMatch({
          address: invoice.address,
          expectedSats: invoice.amountSats,
          usdAmount: invoice.amountUsd,
          createdAt: invoice.invoiceCreatedAt,
          invoiceExpiresAt: invoice.invoiceExpiresAt,
        });

        setPaymentStatus((current) => mergePolledPaymentStatus(current, res.status));
        if (res.txid) setTxId(res.txid);
      } catch (e) {
        console.error("Failed to poll for payment status:", e);
      }
    };

    poll();
    const paymentCheckInterval = setInterval(poll, PAYMENT_POLL_INTERVAL_MS);
    return () => clearInterval(paymentCheckInterval);
  }, [paymentStatus, invoice]);

  // 2) Hard invoice expiry (reactive)
  useEffect(() => {
    const timer = setInterval(() => {
      if (Date.now() > invoice.invoiceExpiresAt) {
        setPaymentStatus((current) => (current === 'confirmed' ? current : 'invoice_expired'));
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [invoice.invoiceExpiresAt]);

  // 3) Quote expiry timer and auto-refresh logic
  useEffect(() => {
    // Only run the timer if the status is pending.
    if (paymentStatus !== 'pending') {
      // If status changes to something else, like 'refreshing', the timer should stop.
      return;
    }
    
    const timer = setInterval(() => {
      if (Date.now() > invoice.invoiceExpiresAt) {
        setPaymentStatus('invoice_expired');
        setTimeLeft(0);
        clearInterval(timer);
        return;
      }

      const remaining = invoice.quoteExpiresAt - Date.now();
      if (remaining <= 0) {
        setTimeLeft(0);
        setPaymentStatus('quote_expired');
        clearInterval(timer);
      } else {
        setTimeLeft(remaining);
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [paymentStatus, invoice.quoteExpiresAt, invoice.invoiceExpiresAt]);

  // 4) Trigger auto-refresh when quote expires
  useEffect(() => {
      if (paymentStatus === 'quote_expired') {
          if (Date.now() > invoice.invoiceExpiresAt) {
            setPaymentStatus('invoice_expired');
            return;
          }
          setPaymentStatus('refreshing');
          refreshQuoteForToken(token).then(result => {
              if ('token' in result) {
                  onInvoiceUpdate(result.token, result.payload);
              } else {
                  toast({ variant: 'destructive', title: 'Refresh Failed', description: result.error });
                  setPaymentStatus(result.code === 'expired' ? 'invoice_expired' : 'error');
              }
          });
      }
  }, [paymentStatus, token, invoice.invoiceExpiresAt, onInvoiceUpdate, toast]);

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
