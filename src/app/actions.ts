'use server';

import { z } from 'zod';
import { QUOTE_EXPIRY_MS, FIAT_TOLERANCE_BPS } from '@/lib/constants';
import {
  getBtcPrice,
  signInvoice,
  verifyInvoice,
  computeSatsForFiat,
  listAddressTxidsBlockchair,
  getTxDetailsBlockchair,
  getHistoricalRateAtBlock,
  btcFromSats,
  type InvoicePayload,
} from '@/lib/invoice';
import { validate as validateBtcAddress } from 'bitcoin-address-validation';

type InvoiceField = 'amount' | 'currency' | 'address' | 'description' | 'expiresIn';
type InvoiceFieldErrors = Partial<Record<InvoiceField, string[]>>;

export type CreateInvoiceState = {
  error: string | null;
  details: InvoiceFieldErrors;
  token: string | null;
};

export const initialCreateInvoiceState: CreateInvoiceState = {
  error: null,
  details: {},
  token: null,
};

export type ParseInvoiceTokenResult =
  | { payload: InvoicePayload }
  | { error: "Invoice expired" | "Invalid or tampered token" };

export type RefreshQuoteResult =
  | { token: string; payload: InvoicePayload }
  | { error: string; code: "expired" | "invalid" | "refresh_failed" };

const invoiceSchema = z.object({
  amount: z.coerce.number().positive(),
  currency: z.string().min(1),
  address: z.string().min(26).refine(v => validateBtcAddress(v), { message: "Invalid Bitcoin address" }),
  description: z.string().max(100).optional(),
  expiresIn: z.coerce.number().int().positive().optional(),
});

export async function parseInvoiceToken(token: string): Promise<ParseInvoiceTokenResult> {
  const result = await verifyInvoice(token);
  if (result.status === "expired") return { error: "Invoice expired" as const };
  if (result.status === "invalid") return { error: "Invalid or tampered token" as const };
  return { payload: result.payload };
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
    expiresIn: formData.get('expiresIn') || undefined, // Treat empty string as undefined
  });

  if (!parsed.success) {
    return {
      error: "Invalid form data",
      details: parsed.error.flatten().fieldErrors as InvoiceFieldErrors,
      token: null,
    };
  }

  const { amount, currency, address, description, expiresIn } = parsed.data;

  try {
    const nowMs = Date.now();
    const [price, usdPrice] = await Promise.all([
        getBtcPrice(currency),
        getBtcPrice("USD"),
    ]);

    const amountSats = computeSatsForFiat(amount, currency, price);
    const amountUsd = btcFromSats(amountSats) * usdPrice;

    const quoteExpiresAt = nowMs + QUOTE_EXPIRY_MS;
    const invoiceExpiresAt = nowMs + (expiresIn ?? 7) * 24 * 60 * 60 * 1000;
    const payload: InvoicePayload = {
      amountFiat: amount,
      currency,
      description: description || "",
      address,
      amountSats,
      amountUsd,
      invoiceCreatedAt: nowMs,
      quoteExpiresAt,
      invoiceExpiresAt,
      iat: Math.floor(nowMs / 1000),
      exp: Math.floor(invoiceExpiresAt / 1000),
    };

    const token = await signInvoice(payload);
    return { token, error: null, details: {} };
  } catch (e) {
    console.error("createInvoice failed:", e);
    return { error: "Failed to create invoice. Please try again.", details: {}, token: null };
  }
}

export async function refreshQuoteForToken(token: string): Promise<RefreshQuoteResult> {
  const verified = await verifyInvoice(token);
  if (verified.status === "expired") return { error: "Invoice expired", code: "expired" as const };
  if (verified.status === "invalid") return { error: "Invalid token", code: "invalid" as const };

  const old = verified.payload;
  const nowMs = Date.now();
  if (nowMs > old.invoiceExpiresAt) {
    return { error: "Invoice expired", code: "expired" as const };
  }

  try {
    const [price, usdPrice] = await Promise.all([
        getBtcPrice(old.currency),
        getBtcPrice("USD"),
    ]);
    const amountSats = computeSatsForFiat(old.amountFiat, old.currency, price);
    const amountUsd = btcFromSats(amountSats) * usdPrice;
    const quoteExpiresAt = nowMs + QUOTE_EXPIRY_MS;

    const freshPayload: InvoicePayload = {
      ...old,
      amountSats,
      amountUsd,
      quoteExpiresAt,
      iat: Math.floor(nowMs / 1000),
      exp: Math.floor(old.invoiceExpiresAt / 1000),
    };
    const newToken = await signInvoice(freshPayload);
    return { token: newToken, payload: freshPayload };
  } catch(e) {
    console.error("refreshQuoteForToken failed:", e);
    return { error: "Failed to refresh quote. Please try again.", code: "refresh_failed" as const };
  }
}

/**
 * Fiat-matching payment checker (Blockchair):
 * - scans recent txs to the invoice address
 * - for each confirmed tx within [createdAt, invoiceExpiresAt]:
 *   - sum sats paid to the address
 *   - fetch historical BTC→USD at that block
 *   - accept if |usdPaid - invoiceUsd| <= tolerance
 * - unconfirmed hits => "detected"
 */
export async function checkPaymentStatusFiatMatch(params: {
  address: string;
  expectedSats: number;
  usdAmount: number;
  createdAt: number;        // ms epoch
  invoiceExpiresAt: number; // ms epoch
}) {
  const { address, expectedSats, usdAmount, createdAt, invoiceExpiresAt } = params;

  try {
    const txids = await listAddressTxidsBlockchair(address);
    if (!txids?.length) return { status: "pending" as const };

    const satsAllowed = Math.max(1, Math.round((FIAT_TOLERANCE_BPS / 10_000) * expectedSats));

    for (const txid of txids) {
      const d = await getTxDetailsBlockchair(txid, address);
      if (!d.satsToAddress) continue;

      const t = d.time;
      if (t < createdAt || t > invoiceExpiresAt) continue;

      if (!d.confirmed) {
        if (Math.abs(d.satsToAddress - expectedSats) <= satsAllowed) {
          return { status: "detected" as const, txid };
        }
        continue;
      }

      const price = d.blockId ? await getHistoricalRateAtBlock(d.blockId, "USD") : null;
      if (!price) continue;

      const btcPaid = d.satsToAddress / 1e8;
      const usdPaid = btcPaid * price;
      const allowed = (FIAT_TOLERANCE_BPS / 10_000) * usdAmount;

      if (Math.abs(usdPaid - usdAmount) <= allowed) {
        return { status: "confirmed" as const, txid };
      }
    }

    return { status: "pending" as const };
  } catch (e) {
    console.error("checkPaymentStatusFiatMatch failed:", e);
    // On transient errors (network, etc), return pending to allow polling to continue
    return { status: "pending" as const };
  }
}
