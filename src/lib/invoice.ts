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

// Helper for client display
export function satsToBtcString(sats: number) {
  return btcFromSats(sats).toFixed(8);
}
