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
} from '@/lib/invoice';
import { validate as validateBtcAddress } from 'bitcoin-address-validation';

const invoiceSchema = z.object({
  amount: z.coerce.number().positive(),
  currency: z.string().min(1),
  address: z.string().min(26).refine(v => validateBtcAddress(v), { message: "Invalid Bitcoin address" }),
  description: z.string().max(100).optional(),
  expiresIn: z.coerce.number().int().positive().optional(),
});

export async function parseInvoiceToken(token: string) {
  const payload = await verifyInvoice(token);
  if (!payload) return { error: "Invalid or tampered token" };
  return { payload };
}

export async function createInvoice(prevState: any, formData: FormData) {
  const parsed = invoiceSchema.safeParse({
    amount: formData.get('amount'),
    currency: formData.get('currency'),
    address: formData.get('address'),
    description: formData.get('description'),
    expiresIn: formData.get('expiresIn') || undefined, // Treat empty string as undefined
  });

  if (!parsed.success) {
    return { error: "Invalid form data", details: parsed.error.flatten().fieldErrors };
  }

  const { amount, currency, address, description, expiresIn } = parsed.data;

  try {
    const now = Date.now();
    const [price, usdPrice] = await Promise.all([
        getBtcPrice(currency),
        getBtcPrice("USD"),
    ]);

    const amountSats = computeSatsForFiat(amount, currency, price);
    const amountUsd = btcFromSats(amountSats) * usdPrice;
    
    const exp = now + QUOTE_EXPIRY_MS;
    const invoiceExpiresAt = now + (expiresIn ?? 7) * 24 * 60 * 60 * 1000;

    const payload = {
      amountFiat: amount,
      currency,
      description: description || "",
      address,
      amountSats,
      amountUsd,
      iat: now,
      exp,
      invoiceExpiresAt,
    };

    const token = await signInvoice(payload);
    return { token };
  } catch (e) {
    const message = e instanceof Error ? e.message : 'An unknown error occurred.';
    return { error: `Failed to create invoice: ${message}` };
  }
}

export async function refreshQuoteForToken(token: string) {
  const old = await verifyInvoice(token);
  if (!old) return { error: "Invalid token" };
  const now = Date.now();
  if (old.invoiceExpiresAt && now > old.invoiceExpiresAt) {
    return { error: "Invoice expired" };
  }
  try {
    const [price, usdPrice] = await Promise.all([
        getBtcPrice(old.currency),
        getBtcPrice("USD"),
    ]);
    const amountSats = computeSatsForFiat(old.amountFiat, old.currency, price);
    const amountUsd = btcFromSats(amountSats) * usdPrice;

    const freshPayload = { ...old, amountSats, amountUsd, iat: now, exp: now + QUOTE_EXPIRY_MS };
    const newToken = await signInvoice(freshPayload);
    return { token: newToken, payload: freshPayload };
  } catch(e) {
    const message = e instanceof Error ? e.message : 'An unknown error occurred.';
    return { error: `Failed to refresh quote: ${message}` };
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
  usdAmount: number;
  createdAt: number;        // ms epoch
  invoiceExpiresAt: number; // ms epoch
}) {
  const { address, usdAmount, createdAt, invoiceExpiresAt } = params;

  try {
    const txids = await listAddressTxidsBlockchair(address);
    if (!txids?.length) return { status: "pending" as const };

    let hasUnconfirmed = false;

    for (const txid of txids) {
      const d = await getTxDetailsBlockchair(txid, address);
      if (!d.satsToAddress) continue;

      const t = d.time;
      if (t < createdAt || t > invoiceExpiresAt) continue;

      if (!d.confirmed) {
        hasUnconfirmed = true;
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

    if (hasUnconfirmed) return { status: "detected" as const };
    return { status: "pending" as const };
  } catch (e) {
    console.error("checkPaymentStatusFiatMatch failed:", e);
    // On transient errors (network, etc), return pending to allow polling to continue
    return { status: "pending" as const };
  }
}
