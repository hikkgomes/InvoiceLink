export const APP_NAME = "NodeInvoice";
export const LEGAL_CONTACT_EMAIL = "legal@nodeinvoice.com";

// 10 minutes (quote)
export const QUOTE_EXPIRY_MS = 600 * 1000;

// Fiat match tolerance (in basis points). 100bps = 1%.
export const FIAT_TOLERANCE_BPS = parseInt(process.env.FIAT_TOLERANCE_BPS || "100", 10);

// Cushion applied to fiat->sats quote conversion (in basis points). 100bps = 1%.
export const RATE_CUSHION_BPS = parseInt(process.env.RATE_CUSHION_BPS || "100", 10);
