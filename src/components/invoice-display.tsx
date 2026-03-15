'use client';

import { useEffect, useState } from 'react';
import { Bitcoin, CalendarOff, CheckCircle2, Clock, Copy, ExternalLink, Loader2, RefreshCw } from 'lucide-react';
import QRCode from 'qrcode';

import { checkPaymentStatus, refreshQuote } from '@/app/actions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { QUOTE_EXPIRY_MS } from '@/lib/constants';
import { type I18nMessages, type Locale } from '@/lib/i18n';
import { type InvoicePayload, satsToBtcString } from '@/lib/invoice';
import { mergePolledPaymentStatus, type InvoiceStatus } from '@/lib/payment-status';

const PAYMENT_POLL_INTERVAL_MS = 10_000;

type CopyItemKey = 'btcAmount' | 'address' | 'paymentLink';

function usesFiatQuote(currency: string) {
  return currency !== 'BTC';
}

function formatTime(ms: number) {
  if (ms < 0) return '00:00';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function formatExpiryDate(timestamp: number, locale: Locale) {
  const date = new Date(timestamp);
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

interface InvoiceDisplayProps {
  initialInvoice: InvoicePayload;
  accessKey: string;
  locale: Locale;
  messages: I18nMessages['invoiceDisplay'];
}

function getStatusFromInvoice(invoice: InvoicePayload): InvoiceStatus {
  if (invoice.status === 'confirmed') return 'confirmed';
  if (invoice.status === 'detected') return 'detected';
  if (invoice.status === 'expired') return 'invoice_expired';
  if (invoice.status === 'error') return 'error';
  if (Date.now() > invoice.invoiceExpiresAt) return 'invoice_expired';
  if (usesFiatQuote(invoice.currency) && Date.now() > invoice.quoteExpiresAt) return 'quote_expired';
  return 'pending';
}

export function InvoiceDisplay({ initialInvoice, accessKey, locale, messages }: InvoiceDisplayProps) {
  const [invoice, setInvoice] = useState(initialInvoice);
  const [timeLeft, setTimeLeft] = useState(
    usesFiatQuote(initialInvoice.currency) ? initialInvoice.quoteExpiresAt - Date.now() : 0,
  );
  const [paymentStatus, setPaymentStatus] = useState<InvoiceStatus>(() => getStatusFromInvoice(initialInvoice));
  const [txId, setTxId] = useState<string | null>(initialInvoice.txId);

  const { toast } = useToast();

  const bip21Link = `bitcoin:${invoice.address}?amount=${satsToBtcString(invoice.amountSats)}&label=${encodeURIComponent(invoice.description)}`;
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    QRCode.toDataURL(bip21Link, { margin: 1, width: 256 })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  }, [bip21Link]);

  useEffect(() => {
    setInvoice(initialInvoice);
    setTxId(initialInvoice.txId);
    setTimeLeft(usesFiatQuote(initialInvoice.currency) ? initialInvoice.quoteExpiresAt - Date.now() : 0);
    setPaymentStatus(getStatusFromInvoice(initialInvoice));
  }, [initialInvoice]);

  useEffect(() => {
    if (paymentStatus !== 'pending' && paymentStatus !== 'detected') return;

    const poll = async () => {
      try {
        if (Date.now() > invoice.invoiceExpiresAt) {
          setPaymentStatus((current) => (current === 'confirmed' ? current : 'invoice_expired'));
          return;
        }

        const response = await checkPaymentStatus(invoice.invoiceId, accessKey);

        if (response.status === 'invoice_expired') {
          setPaymentStatus((current) => (current === 'confirmed' ? current : 'invoice_expired'));
          return;
        }

        setPaymentStatus((current) => mergePolledPaymentStatus(current, response.status));
        if (response.txid) setTxId(response.txid);
      } catch (error) {
        console.error('Failed to poll for payment status:', error);
      }
    };

    poll();
    const paymentCheckInterval = setInterval(poll, PAYMENT_POLL_INTERVAL_MS);
    return () => clearInterval(paymentCheckInterval);
  }, [paymentStatus, invoice, accessKey]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (Date.now() > invoice.invoiceExpiresAt) {
        setPaymentStatus((current) => (current === 'confirmed' ? current : 'invoice_expired'));
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [invoice.invoiceExpiresAt]);

  useEffect(() => {
    if (paymentStatus !== 'pending' || !usesFiatQuote(invoice.currency)) return;

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
  }, [paymentStatus, invoice.currency, invoice.quoteExpiresAt, invoice.invoiceExpiresAt]);

  useEffect(() => {
    if (paymentStatus !== 'quote_expired') return;

    if (Date.now() > invoice.invoiceExpiresAt) {
      setPaymentStatus('invoice_expired');
      return;
    }

    setPaymentStatus('refreshing');

    const runRefresh = async () => {
      try {
        const result = await refreshQuote(invoice.invoiceId, accessKey);
        if ('payload' in result) {
          setInvoice(result.payload);
          setTxId(result.payload.txId);
          setTimeLeft(result.payload.quoteExpiresAt - Date.now());
          setPaymentStatus(getStatusFromInvoice(result.payload));
        } else {
          const refreshMessage =
            result.code === 'expired'
              ? messages.status.invoiceExpired
              : result.code === 'invalid'
                ? messages.toasts.refreshFailedDescription
                : messages.toasts.refreshFailedDescription;
          toast({ variant: 'destructive', title: messages.toasts.refreshFailedTitle, description: refreshMessage });
          setPaymentStatus(result.code === 'expired' ? 'invoice_expired' : 'error');
        }
      } catch {
        toast({
          variant: 'destructive',
          title: messages.toasts.refreshFailedTitle,
          description: messages.toasts.refreshFailedDescription,
        });
        setPaymentStatus('error');
      }
    };

    runRefresh();
  }, [paymentStatus, invoice, accessKey, toast, messages]);

  const handleCopy = async (text: string, itemKey: CopyItemKey) => {
    const itemLabel = messages.copyItems[itemKey];
    try {
      await navigator.clipboard.writeText(text);
      toast({ description: messages.toasts.copied.replace('{item}', itemLabel) });
    } catch {
      toast({ variant: 'destructive', description: messages.toasts.copyFailed.replace('{item}', itemLabel) });
    }
  };

  const statusInfo = {
    pending: {
      text: messages.status.pending,
      color: 'bg-amber-500/80',
      icon: <Loader2 className="h-4 w-4 animate-spin" />,
    },
    detected: {
      text: messages.status.detected,
      color: 'bg-orange-500',
      icon: <CheckCircle2 className="h-4 w-4" />,
    },
    confirmed: {
      text: messages.status.confirmed,
      color: 'bg-emerald-500',
      icon: <CheckCircle2 className="h-4 w-4" />,
    },
    quote_expired: {
      text: messages.status.quoteExpired,
      color: 'bg-rose-500',
      icon: <Clock className="h-4 w-4" />,
    },
    refreshing: {
      text: messages.status.refreshing,
      color: 'bg-orange-500',
      icon: <RefreshCw className="h-4 w-4 animate-spin" />,
    },
    invoice_expired: {
      text: messages.status.invoiceExpired,
      color: 'bg-destructive',
      icon: <CalendarOff className="h-4 w-4" />,
    },
    error: {
      text: messages.status.error,
      color: 'bg-zinc-500',
      icon: <Clock className="h-4 w-4" />,
    },
  };

  const currentStatus = statusInfo[paymentStatus];

  return (
    <Card className="w-full max-w-md border-accent/30 bg-card/75 shadow-[0_30px_80px_rgba(58,14,102,0.45),0_12px_42px_rgba(247,147,26,0.22)]">
      <CardHeader className="border-b border-accent/20 bg-secondary/30 p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle className="text-lg">{messages.title}</CardTitle>
            {invoice.description ? <CardDescription>{invoice.description}</CardDescription> : null}
          </div>
          <Badge variant="outline" className={`border-0 text-white ${currentStatus.color}`}>
            {currentStatus.icon}
            <span className="ml-2 whitespace-nowrap">{currentStatus.text}</span>
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 p-6">
        <div className="flex justify-center">
          {qrDataUrl ? (
            <div className="rounded-lg border border-accent/30 bg-white p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrDataUrl} alt="Bitcoin QR code" width={220} height={220} />
            </div>
          ) : (
            <div className="flex h-[220px] w-[220px] items-center justify-center rounded-lg bg-muted">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>

        <div className="space-y-4 text-center">
          <div className="cursor-pointer" onClick={() => handleCopy(satsToBtcString(invoice.amountSats), 'btcAmount')}>
            <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">{messages.amountLabel}</p>
            <p className="mt-1 flex items-center justify-center gap-2 font-code text-2xl font-semibold tracking-tight">
              <Bitcoin className="h-6 w-6 text-accent" /> {satsToBtcString(invoice.amountSats)}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {invoice.currency === 'BTC' ? `~ ${invoice.amountUsd.toFixed(2)} USD` : `~ ${invoice.amountFiat.toFixed(2)} ${invoice.currency}`}
            </p>
          </div>

          <div
            className="cursor-pointer break-all rounded-md border border-border/60 px-3 py-2 text-xs text-muted-foreground"
            onClick={() => handleCopy(invoice.address, 'address')}
          >
            <p className="uppercase tracking-[0.12em]">{messages.sendToLabel}</p>
            <p className="mt-1 font-code text-sm text-foreground">{invoice.address}</p>
          </div>
        </div>

        {paymentStatus === 'pending' && usesFiatQuote(invoice.currency) ? (
          <div>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="flex items-center gap-1 text-muted-foreground">
                <Clock className="h-4 w-4" /> {messages.quoteExpiresLabel}
              </span>
              <span className="font-code font-medium">{formatTime(timeLeft)}</span>
            </div>
            <Progress value={(timeLeft / QUOTE_EXPIRY_MS) * 100} className="h-2" />
          </div>
        ) : null}

        <div className="text-center text-xs text-muted-foreground">
          {messages.invoiceValidUntil} {formatExpiryDate(invoice.invoiceExpiresAt, locale)}
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-2 bg-secondary/40 p-4">
        {paymentStatus === 'pending' ? (
          <Button className="w-full" asChild>
            <a href={bip21Link}>
              <Copy className="mr-2 h-4 w-4" /> {messages.actions.openWallet}
            </a>
          </Button>
        ) : null}

        {(paymentStatus === 'detected' || paymentStatus === 'confirmed') && txId ? (
          <Button variant="secondary" className="w-full" asChild>
            <a href={`https://mempool.space/tx/${txId}`} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" /> {messages.actions.viewTransaction}
            </a>
          </Button>
        ) : null}

        {paymentStatus === 'pending' ? (
          <Button variant="ghost" className="w-full" onClick={() => handleCopy(bip21Link, 'paymentLink')}>
            <Copy className="mr-2 h-4 w-4" /> {messages.actions.copyPaymentLink}
          </Button>
        ) : null}
      </CardFooter>
    </Card>
  );
}
