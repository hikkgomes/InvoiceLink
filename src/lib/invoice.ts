import { BLOCKCHAIR_API } from "./constants";

// ---- Money helpers (integers) ----
export const sats = (btc: number) => Math.round(btc * 1e8);
export const btcFromSats = (s: number) => s / 1e8;

export type PersistedInvoiceStatus = "pending" | "detected" | "confirmed" | "expired" | "error";

// ---- Invoice payload (amounts in sats) ----
export interface InvoicePayload {
  invoiceId: string;
  amountFiat: number;
  currency: string;
  description: string;
  address: string;
  amountSats: number;
  amountUsd: number;
  invoiceCreatedAt: number;
  quoteExpiresAt: number;
  invoiceExpiresAt: number;
  status: PersistedInvoiceStatus;
  txId: string | null;
}

// Conversion
export function computeSatsForFiat(fiatAmount: number, _vs: string, price: number): number {
  const btc = fiatAmount / price;
  return sats(Number(btc.toFixed(8)));
}

// ---- Blockchair helpers for historical fiat at tx/block time ----
type BtcLike = "bitcoin";
type TxDetails = { satsToAddress: number; confirmed: boolean; time: number; blockId?: number };

const confirmedTxDetailsCache = new Map<string, TxDetails>();
const historicalRateCache = new Map<string, number>();

export function clearInvoiceCachesForTests() {
  confirmedTxDetailsCache.clear();
  historicalRateCache.clear();
}

// Recent txids touching the address
export async function listAddressTxidsBlockchair(address: string, chain: BtcLike = "bitcoin"): Promise<string[]> {
  const url = `${BLOCKCHAIR_API}/${chain}/dashboards/address/${address}?limit=50`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Blockchair address dashboard ${res.status}`);
  const json = await res.json();
  const txs: string[] = json?.data?.[address]?.transactions ?? [];
  return Array.isArray(txs) ? txs : [];
}

// Sum sats to our address + tx time + confirm status
export async function getTxDetailsBlockchair(
  txid: string,
  address: string,
  chain: BtcLike = "bitcoin",
): Promise<TxDetails> {
  const cacheKey = `${chain}:${txid}:${address.toLowerCase()}`;
  const cached = confirmedTxDetailsCache.get(cacheKey);
  if (cached) return cached;

  const url = `${BLOCKCHAIR_API}/${chain}/dashboards/transaction/${txid}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Blockchair tx dashboard ${res.status}`);
  const json = await res.json();
  const tx = json?.data?.[txid]?.transaction;
  const outputs: Array<{ recipient?: string; value?: number }> = json?.data?.[txid]?.outputs ?? [];
  if (!tx || !outputs?.length) return { satsToAddress: 0, confirmed: false, time: Date.now() };

  const satsToAddress = outputs
    .filter((o) => (o.recipient || "").toLowerCase() === address.toLowerCase())
    .reduce((a, b) => a + (b.value || 0), 0);

  const confirmed = typeof tx.block_id === "number";
  const time = confirmed && tx.time ? new Date(tx.time).getTime() : Date.now();
  const details = { satsToAddress, confirmed, time, blockId: tx.block_id };
  if (details.confirmed) confirmedTxDetailsCache.set(cacheKey, details);
  return details;
}

// Historical BTC->fiat price at a block
export async function getHistoricalRateAtBlock(
  blockId: number,
  currency: string,
  chain: BtcLike = "bitcoin",
): Promise<number> {
  const lower = currency.toLowerCase();
  const cacheKey = `${chain}:${blockId}:${lower}`;
  const cached = historicalRateCache.get(cacheKey);
  if (typeof cached === "number") return cached;

  const url = `${BLOCKCHAIR_API}/${chain}/dashboards/block/${blockId}?rates=${encodeURIComponent(currency)}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Blockchair block dashboard ${res.status}`);
  const json = await res.json();
  const ctx = (json?.context || json?.data?.[String(blockId)]?.context || json?.data?.context || {}) as Record<
    string,
    unknown
  >;
  const directKey = `market_price_${lower}`;
  if (directKey in ctx) {
    const price = Number(ctx[directKey]);
    historicalRateCache.set(cacheKey, price);
    return price;
  }
  if (lower === "usd" && "market_price_usd" in ctx) {
    const price = Number(ctx.market_price_usd);
    historicalRateCache.set(cacheKey, price);
    return price;
  }
  throw new Error("No historical market price found for requested currency");
}

// Helper for client display
export function satsToBtcString(sats: number) {
  return btcFromSats(sats).toFixed(8);
}
