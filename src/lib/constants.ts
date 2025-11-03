export const APP_NAME = "InvoiceLink";

// 10 minutes (quote)
export const QUOTE_EXPIRY_MS = 10 * 60 * 1000;

// Use a default secret for development, but require a strong one for production.
const defaultDevSecret = "default_insecure_secret_for_dev_only";
let secret = process.env.JWT_SECRET;

if (!secret) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET must be set to a long random value (>=32 chars) in production.");
  }
  console.warn("WARNING: JWT_SECRET not set. Using a default, insecure secret for development.");
  secret = defaultDevSecret;
} else if (secret.length < 32) {
   if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET is too short. It must be at least 32 characters long in production.");
  }
  console.warn(`WARNING: JWT_SECRET is too short (${secret.length}/32 chars). This is not secure.`);
}


export const JWT_SECRET = secret;


// External APIs we use
export const BLOCKCHAIR_API = "https://api.blockchair.com"; // historical fiat at block/tx time
export const FIAT_TOLERANCE_BPS = 100;                       // 1% window for fiat match
