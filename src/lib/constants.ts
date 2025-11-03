export const APP_NAME = "InvoiceLink";

// 10 minutes (quote)
export const QUOTE_EXPIRY_MS = 5 * 1000;

// Use a default secret for dev; require a strong one in server-side production.
const isServer = typeof window === "undefined";
if (process.env.NODE_ENV === "production" && isServer) {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error("JWT_SECRET must be set to a long random value (>=32 chars) in production.");
  }
}
export const JWT_SECRET = process.env.JWT_SECRET!;

// External APIs we use
export const BLOCKCHAIR_API = "https://api.blockchair.com"; // historical fiat at block/tx time
export const FIAT_TOLERANCE_BPS = 100;                       // 1% window for fiat match
