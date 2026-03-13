'use server';

import { z } from 'zod';
import { validate as validateBtcAddress } from 'bitcoin-address-validation';

import { QUOTE_EXPIRY_MS, FIAT_TOLERANCE_BPS } from '@/lib/constants';
import {
  btcFromSats,
  computeSatsForFiat,
  getBtcPrice,
  getHistoricalRateAtBlock,
  getTxDetailsBlockchair,
  listAddressTxidsBlockchair,
  type InvoicePayload,
} from '@/lib/invoice';
import {
  buildInvoiceUrl,
  createStoredInvoice,
  getStoredInvoiceByAccessKey,
  setStoredInvoiceStatus,
  updateStoredInvoiceQuote,
} from '@/lib/invoice-store';

type InvoiceField = 'amount' | 'currency' | 'address' | 'description' | 'expiresIn';
type InvoiceFieldErrors = Partial<Record<InvoiceField, string[]>>;

export type CreateInvoiceState = {
  error: string | null;
  details: InvoiceFieldErrors;
  invoiceUrl: string | null;
};

export type LoadInvoiceResult =
  | { payload: InvoicePayload }
  | { error: 'Invoice expired' | 'Invalid invoice link' };

export type RefreshQuoteResult =
  | { payload: InvoicePayload }
  | { error: string; code: 'expired' | 'invalid' | 'refresh_failed' };

const invoiceSchema = z.object({
  amount: z.coerce.number().positive(),
  currency: z.string().min(1),
  address: z.string().min(26).refine((v) => validateBtcAddress(v), { message: 'Invalid Bitcoin address' }),
  description: z.string().max(100).optional(),
  expiresIn: z.coerce.number().int().positive().optional(),
});

function parseInvoiceId(rawInvoiceId: number | string): string | null {
  const parsed = String(rawInvoiceId).trim();
  if (!/^[A-Za-z0-9_-]{8,64}$/.test(parsed)) return null;
  return parsed;
}

function normalizeAccessKey(rawAccessKey: string): string | null {
  const key = rawAccessKey.trim();
  if (!key) return null;
  return key;
}

async function loadAuthorizedInvoice(rawInvoiceId: number | string, rawAccessKey: string) {
  const invoiceId = parseInvoiceId(rawInvoiceId);
  const accessKey = normalizeAccessKey(rawAccessKey);
  if (!invoiceId || !accessKey) return null;

  const invoice = await getStoredInvoiceByAccessKey(invoiceId, accessKey);
  if (!invoice) return null;

  return { invoiceId, invoice };
}

async function markInvoiceExpired(invoiceId: string, invoice: InvoicePayload) {
  if (invoice.status === 'confirmed' || invoice.status === 'expired') {
    return invoice;
  }
  return setStoredInvoiceStatus(invoiceId, 'expired', invoice.txId);
}

export async function loadInvoice(rawInvoiceId: number | string, rawAccessKey: string): Promise<LoadInvoiceResult> {
  try {
    const authorized = await loadAuthorizedInvoice(rawInvoiceId, rawAccessKey);
    if (!authorized) return { error: 'Invalid invoice link' };

    const { invoiceId, invoice } = authorized;
    if (invoice.status === 'expired') return { error: 'Invoice expired' };

    if (Date.now() > invoice.invoiceExpiresAt && invoice.status !== 'confirmed') {
      await markInvoiceExpired(invoiceId, invoice);
      return { error: 'Invoice expired' };
    }

    return { payload: invoice };
  } catch (error) {
    console.error('loadInvoice failed:', error);
    return { error: 'Invalid invoice link' };
  }
}

export async function createInvoice(
  _prevState: CreateInvoiceState,
  formData: FormData,
): Promise<CreateInvoiceState> {
  const parsed = invoiceSchema.safeParse({
    amount: formData.get('amount'),
    currency: formData.get('currency'),
    address: formData.get('address'),
    description: formData.get('description'),
    expiresIn: formData.get('expiresIn') || undefined,
  });

  if (!parsed.success) {
    return {
      error: 'Invalid form data',
      details: parsed.error.flatten().fieldErrors as InvoiceFieldErrors,
      invoiceUrl: null,
    };
  }

  const { amount, currency, address, description, expiresIn } = parsed.data;

  try {
    const nowMs = Date.now();
    const [price, usdPrice] = await Promise.all([getBtcPrice(currency), getBtcPrice('USD')]);

    const amountSats = computeSatsForFiat(amount, currency, price);
    const amountUsd = btcFromSats(amountSats) * usdPrice;

    const quoteExpiresAt = nowMs + QUOTE_EXPIRY_MS;
    const invoiceExpiresAt = nowMs + (expiresIn ?? 7) * 24 * 60 * 60 * 1000;

    const { invoice, accessKey } = await createStoredInvoice({
      amountFiat: amount,
      currency,
      description: description || '',
      address,
      amountSats,
      amountUsd,
      invoiceCreatedAt: nowMs,
      quoteExpiresAt,
      invoiceExpiresAt,
    });

    return {
      error: null,
      details: {},
      invoiceUrl: buildInvoiceUrl(invoice.invoiceId, accessKey),
    };
  } catch (error) {
    console.error('createInvoice failed:', error);
    return {
      error: 'Failed to create invoice. Please try again.',
      details: {},
      invoiceUrl: null,
    };
  }
}

export async function refreshQuote(rawInvoiceId: number | string, rawAccessKey: string): Promise<RefreshQuoteResult> {
  try {
    const authorized = await loadAuthorizedInvoice(rawInvoiceId, rawAccessKey);
    if (!authorized) return { error: 'Invalid invoice link', code: 'invalid' as const };

    const { invoiceId, invoice } = authorized;
    if (invoice.status === 'expired') return { error: 'Invoice expired', code: 'expired' as const };

    if (Date.now() > invoice.invoiceExpiresAt && invoice.status !== 'confirmed') {
      await markInvoiceExpired(invoiceId, invoice);
      return { error: 'Invoice expired', code: 'expired' as const };
    }

    if (invoice.status === 'confirmed') {
      return { payload: invoice };
    }

    const [price, usdPrice] = await Promise.all([getBtcPrice(invoice.currency), getBtcPrice('USD')]);
    const amountSats = computeSatsForFiat(invoice.amountFiat, invoice.currency, price);
    const amountUsd = btcFromSats(amountSats) * usdPrice;
    const quoteExpiresAt = Date.now() + QUOTE_EXPIRY_MS;

    const updated = await updateStoredInvoiceQuote(invoiceId, { amountSats, amountUsd, quoteExpiresAt });
    return { payload: updated };
  } catch (error) {
    console.error('refreshQuote failed:', error);
    return { error: 'Failed to refresh quote. Please try again.', code: 'refresh_failed' as const };
  }
}

export async function checkPaymentStatus(rawInvoiceId: number | string, rawAccessKey: string) {
  try {
    const authorized = await loadAuthorizedInvoice(rawInvoiceId, rawAccessKey);
    if (!authorized) return { status: 'pending' as const };

    const { invoiceId, invoice } = authorized;

    if (invoice.status === 'confirmed') {
      return { status: 'confirmed' as const, txid: invoice.txId ?? undefined };
    }

    if (invoice.status === 'expired' || Date.now() > invoice.invoiceExpiresAt) {
      if (invoice.status !== 'expired') {
        await markInvoiceExpired(invoiceId, invoice);
      }
      return { status: 'invoice_expired' as const };
    }

    const txids = await listAddressTxidsBlockchair(invoice.address);
    if (!txids.length) {
      if (invoice.status === 'detected') {
        return { status: 'detected' as const, txid: invoice.txId ?? undefined };
      }
      return { status: 'pending' as const };
    }

    const satsAllowed = Math.max(1, Math.round((FIAT_TOLERANCE_BPS / 10_000) * invoice.amountSats));

    for (const txid of txids) {
      const details = await getTxDetailsBlockchair(txid, invoice.address);
      if (!details.satsToAddress) continue;

      if (details.time < invoice.invoiceCreatedAt || details.time > invoice.invoiceExpiresAt) continue;

      if (!details.confirmed) {
        if (Math.abs(details.satsToAddress - invoice.amountSats) <= satsAllowed) {
          await setStoredInvoiceStatus(invoiceId, 'detected', txid);
          return { status: 'detected' as const, txid };
        }
        continue;
      }

      const usdRate = details.blockId ? await getHistoricalRateAtBlock(details.blockId, 'USD') : null;
      if (!usdRate) continue;

      const usdPaid = btcFromSats(details.satsToAddress) * usdRate;
      const allowedUsdDiff = (FIAT_TOLERANCE_BPS / 10_000) * invoice.amountUsd;
      if (Math.abs(usdPaid - invoice.amountUsd) <= allowedUsdDiff) {
        await setStoredInvoiceStatus(invoiceId, 'confirmed', txid);
        return { status: 'confirmed' as const, txid };
      }
    }

    if (invoice.status === 'detected') {
      return { status: 'detected' as const, txid: invoice.txId ?? undefined };
    }

    return { status: 'pending' as const };
  } catch (error) {
    console.error('checkPaymentStatus failed:', error);
    return { status: 'pending' as const };
  }
}
