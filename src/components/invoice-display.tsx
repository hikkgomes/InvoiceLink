'use client';

import { useState, useEffect, useTransition } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { type InvoicePayload } from '@/lib/invoice';
import { refreshQuote, checkPaymentStatus } from '@/app/actions';
import { Bitcoin, Clock, Copy, ExternalLink, Loader2, RefreshCw, CheckCircle2, CalendarOff } from 'lucide-react';
import { Badge } from './ui/badge';

type InvoiceStatus = 'pending' | 'detected' | 'confirmed' | 'quote_expired' | 'invoice_expired' | 'error';

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
  const [isPending, startTransition] = useTransition();
  
  const isInvoiceExpired = invoice.invoiceExpiresAt ? Date.now() > invoice.invoiceExpiresAt : false;
  const isQuoteExpired = timeLeft <= 0;

  const getInitialStatus = (): InvoiceStatus => {
    if (isInvoiceExpired) return 'invoice_expired';
    if (isQuoteInitiallyExpired) return 'quote_expired';
    return 'pending';
  };

  const [paymentStatus, setPaymentStatus] = useState<InvoiceStatus>(getInitialStatus);
  const [txId, setTxId] = useState<string | null>(null);

  const { toast } = useToast();
  
  const bip21Link = `bitcoin:${invoice.address}?amount=${invoice.btcAmount}&label=${encodeURIComponent(invoice.description)}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(bip21Link)}`;

  useEffect(() => {
    if (paymentStatus !== 'pending') return;

    const timer = setInterval(() => {
      const remaining = invoice.exp - Date.now();
      if (remaining <= 0) {
        setTimeLeft(0);
        setPaymentStatus('quote_expired');
        clearInterval(timer);
      } else {
        setTimeLeft(remaining);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [invoice.exp, paymentStatus]);

  useEffect(() => {
    if (paymentStatus !== 'pending') return;

    const paymentCheckInterval = setInterval(async () => {
      const statusResult = await checkPaymentStatus(invoice.address, invoice.btcAmount);
      if (statusResult.status === 'detected' || statusResult.status === 'confirmed') {
        setPaymentStatus(statusResult.status);
        setTxId(statusResult.txid || null);
        clearInterval(paymentCheckInterval);
      } else if (statusResult.status === 'error') {
        setPaymentStatus('error');
        clearInterval(paymentCheckInterval);
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(paymentCheckInterval);
  }, [invoice.btcAmount, invoice.address, paymentStatus]);


  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast({
      description: `${type} copied to clipboard.`,
    });
  };

  const handleRefresh = () => {
    startTransition(async () => {
      try {
        await refreshQuote(token);
        // On success, Next.js redirect will handle the navigation
      } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Refresh Failed',
            description: error instanceof Error ? error.message : 'An unknown error occurred.',
        });
      }
    });
  };

  const statusInfo = {
    pending: { text: 'Waiting for payment', color: 'bg-yellow-500/80', icon: <Loader2 className="h-4 w-4 animate-spin" /> },
    detected: { text: 'Payment detected', color: 'bg-blue-500', icon: <CheckCircle2 className="h-4 w-4" /> },
    confirmed: { text: 'Payment confirmed', color: 'bg-green-500', icon: <CheckCircle2 className="h-4 w-4" /> },
    quote_expired: { text: 'Quote expired', color: 'bg-red-500', icon: <Clock className="h-4 w-4" /> },
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
            <div className="bg-white p-2 rounded-lg">
                <Image src={qrCodeUrl} alt="Bitcoin QR Code" width={200} height={200} unoptimized />
            </div>
        </div>

        <div className="space-y-4 text-center">
            <div className="cursor-pointer" onClick={() => handleCopy(String(invoice.btcAmount), 'BTC amount')}>
                <p className="text-sm text-muted-foreground">Amount</p>
                <p className="text-2xl font-bold font-mono tracking-tighter flex items-center justify-center gap-2">
                    <Bitcoin className="h-6 w-6 text-accent" /> {invoice.btcAmount.toFixed(8)}
                </p>
                <p className="text-sm text-muted-foreground">≈ {invoice.amount.toFixed(2)} {invoice.currency}</p>
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
            <Progress value={(timeLeft / (invoice.exp - invoice.iat))} className="h-2" />
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
        {paymentStatus === 'quote_expired' && !isInvoiceExpired && (
           <Button className="w-full" onClick={handleRefresh} disabled={isPending}>
             {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
             Refresh Quote
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
