import { JWTPayload, SignJWT, jwtVerify } from "jose";
import { JWT_SECRET, BLOCKCHAIR_API } from "./constants";

// ---- Money helpers (integers) ----
export const sats = (btc: number) => Math.round(btc * 1e8);
export const btcFromSats = (s: number) => s / 1e8;

// ---- Invoice payload (amounts in sats) ----
export interface InvoicePayload {
  amountFiat: number;         // original fiat amount
  currency: string;           // e.g. USD/EUR/BRL
  description: string;        // optional
  address: string;            // destination BTC address
  amountSats: number;         // expected sats (with small cushion)
  iat: number;                // issued at (ms epoch)
  exp: number;                // quote expiry (ms epoch)
  invoiceExpiresAt?: number;  // hard invoice expiry (ms epoch)
}

// ---- JWT utils ----
const encKey = async () => new TextEncoder().encode(JWT_SECRET);

export async function signInvoice(payload: InvoicePayload): Promise<string> {
  const key = await encKey();
  return await new SignJWT(payload as unknown as JWTPayload)
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .sign(key);
}

export async function verifyInvoice(token: string): Promise<InvoicePayload | null> {
  try {
    const key = await encKey();
    const { payload, protectedHeader } = await jwtVerify(token, key, { algorithms: ["HS256"] });
    if (protectedHeader.alg !== "HS256") return null;
    return payload as unknown as InvoicePayload;
  } catch {
    return null;
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
  try { return await priceFromCoinGecko(vs); }
  catch { return await priceFromBitstamp(vs); }
}

// Cushion and conversion (default +0.99%)
export function computeSatsForFiat(fiatAmount: number, _vs: string, price: number, cushionPct = 0.99): number {
  const cushioned = fiatAmount * (1 + cushionPct / 100);
  const btc = cushioned / price;
  return sats(Number(btc.toFixed(8)));
}

// ---- Blockchair helpers for historical fiat at tx/block time ----
type BtcLike = "bitcoin";

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
  currency: string,
  chain: BtcLike = "bitcoin",
): Promise<{ satsToAddress: number; confirmed: boolean; time: number; blockId?: number }> {
  const url = `${BLOCKCHAIR_API}/${chain}/dashboards/transaction/${txid}?rates=${encodeURIComponent(currency)}`;
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

  return { satsToAddress, confirmed, time, blockId: tx.block_id };
}

// Historical BTC→fiat price at a block
export async function getHistoricalRateAtBlock(
  blockId: number,
  currency: string,
  chain: BtcLike = "bitcoin",
): Promise<number> {
  const url = `${BLOCKCHAIR_API}/${chain}/dashboards/block/${blockId}?rates=${encodeURIComponent(currency)}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Blockchair block dashboard ${res.status}`);
  const json = await res.json();
  const ctx = json?.context || json?.data?.[String(blockId)]?.context || json?.data?.context || {};
  const lower = currency.toLowerCase();
  const directKey = `market_price_${lower}`;
  if (directKey in ctx) return Number((ctx as any)[directKey]);
  if (lower === "usd" && "market_price_usd" in ctx) return Number((ctx as any)["market_price_usd"]);
  throw new Error("No historical market price found for requested currency");
}

// Helper for client display
export function satsToBtcString(sats: number) {
  return btcFromSats(sats).toFixed(8);
}
