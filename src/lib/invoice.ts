import { JWTPayload, SignJWT, errors, jwtVerify } from "jose";
import { JWT_SECRET, BLOCKCHAIR_API } from "./constants";

// ---- Money helpers (integers) ----
export const sats = (btc: number) => Math.round(btc * 1e8);
export const btcFromSats = (s: number) => s / 1e8;

// ---- Invoice payload (amounts in sats) ----
export interface InvoicePayload {
  amountFiat: number;         // original fiat amount
  currency: string;           // e.g. USD/EUR/CAD
  description: string;        // optional
  address: string;            // destination BTC address
  amountSats: number;         // expected sats
  amountUsd: number;          // converted to USD at invoice creation
  invoiceCreatedAt: number;   // immutable invoice creation time (ms epoch)
  quoteExpiresAt: number;     // quote expiry used by client refresh logic (ms epoch)
  invoiceExpiresAt: number;   // hard invoice expiry (ms epoch)
  iat: number;                // JWT issued at (seconds epoch)
  exp: number;                // JWT expiry (seconds epoch)
}

// ---- JWT utils ----
const encKey = async () => new TextEncoder().encode(JWT_SECRET);
const MIN_REASONABLE_JWT_SECONDS = 1_000_000_000;
const MAX_REASONABLE_JWT_SECONDS = 10_000_000_000; // keeps ms-based legacy tokens out

export type VerifyInvoiceResult =
  | { status: "valid"; payload: InvoicePayload }
  | { status: "expired" }
  | { status: "invalid" };

function isPositiveFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function isReasonableJwtSeconds(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= MIN_REASONABLE_JWT_SECONDS &&
    value <= MAX_REASONABLE_JWT_SECONDS
  );
}

function isInvoicePayload(value: unknown): value is InvoicePayload {
  if (!value || typeof value !== "object") return false;
  const payload = value as Record<string, unknown>;

  if (!isPositiveFiniteNumber(payload.amountFiat)) return false;
  if (!isPositiveFiniteNumber(payload.amountSats)) return false;
  if (!isPositiveFiniteNumber(payload.amountUsd)) return false;
  if (!isPositiveFiniteNumber(payload.invoiceCreatedAt)) return false;
  if (!isPositiveFiniteNumber(payload.quoteExpiresAt)) return false;
  if (!isPositiveFiniteNumber(payload.invoiceExpiresAt)) return false;
  if (!isReasonableJwtSeconds(payload.iat)) return false;
  if (!isReasonableJwtSeconds(payload.exp)) return false;
  if (typeof payload.currency !== "string" || payload.currency.length < 1) return false;
  if (typeof payload.description !== "string") return false;
  if (typeof payload.address !== "string" || payload.address.length < 26) return false;
  if ((payload.exp as number) !== Math.floor((payload.invoiceExpiresAt as number) / 1000)) return false;
  if ((payload.invoiceCreatedAt as number) > (payload.quoteExpiresAt as number)) return false;

  return true;
}

export async function signInvoice(payload: InvoicePayload): Promise<string> {
  const key = await encKey();
  return await new SignJWT(payload as unknown as JWTPayload)
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .sign(key);
}

export async function verifyInvoice(token: string): Promise<VerifyInvoiceResult> {
  try {
    const key = await encKey();
    const { payload, protectedHeader } = await jwtVerify(token, key, { algorithms: ["HS256"] });
    if (protectedHeader.alg !== "HS256") return { status: "invalid" };
    if (!isInvoicePayload(payload)) return { status: "invalid" };
    return { status: "valid", payload };
  } catch (error) {
    if (error instanceof errors.JWTExpired) return { status: "expired" };
    return { status: "invalid" };
  }
}

// ---- Live price (for quoting/refreshing): CoinGecko → Bitstamp ----
async function fetchJson(url: string) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

async function priceFromCoinGecko(vs: string) {
  const data = await fetchJson(
    `https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=${vs.toLowerCase()}`
  );
  const p = data?.bitcoin?.[vs.toLowerCase()];
  if (typeof p !== "number") throw new Error("CG price missing");
  return p as number;
}

async function priceFromBitstamp(vs: string) {
  const pair = vs.toUpperCase() === "EUR" ? "btceur" : "btcusd";
  const data = await fetchJson(`https://www.bitstamp.net/api/v2/ticker/${pair}`);
  const p = Number(data?.last);
  if (!Number.isFinite(p)) throw new Error("Bitstamp price missing");
  return p;
}

export async function getBtcPrice(vs: string): Promise<number> {
  try {
    return await priceFromCoinGecko(vs);
  } catch (error) {
    const upper = vs.toUpperCase();
    if (upper !== "USD" && upper !== "EUR") {
      throw new Error(
        `Price unavailable for ${upper}: primary source failed and fallback is only supported for USD/EUR.`,
      );
    }
    try {
      return await priceFromBitstamp(upper);
    } catch {
      const reason = error instanceof Error ? error.message : "unknown";
      throw new Error(`Price unavailable for ${upper}: ${reason}`);
    }
  }
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
    .filter(o => (o.recipient || "").toLowerCase() === address.toLowerCase())
    .reduce((a, b) => a + (b.value || 0), 0);

  const confirmed = typeof tx.block_id === "number";
  const time = confirmed && tx.time ? new Date(tx.time).getTime() : Date.now();
  const details = { satsToAddress, confirmed, time, blockId: tx.block_id };
  if (details.confirmed) confirmedTxDetailsCache.set(cacheKey, details);
  return details;
}

// Historical BTC→fiat price at a block
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
    const price = Number(ctx["market_price_usd"]);
    historicalRateCache.set(cacheKey, price);
    return price;
  }
  throw new Error("No historical market price found for requested currency");
}

// Helper for client display
export function satsToBtcString(sats: number) {
  return btcFromSats(sats).toFixed(8);
}
