export const APP_NAME = "InvoiceLink";

// 10 minutes (quote)
export const QUOTE_EXPIRY_MS = 10 * 60 * 1000;

// Require a strong JWT secret in prod
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error("JWT_SECRET must be set to a long random value (>=32 chars).");
}
export const JWT_SECRET = process.env.JWT_SECRET;

// External APIs we use
export const BLOCKCHAIR_API = "https://api.blockchair.com"; // historical fiat at block/tx time
export const FIAT_TOLERANCE_BPS = 100; // 1% window for fiat match
