
import { createHmac } from 'crypto';
import { JWT_SECRET } from './constants';

export interface InvoicePayload {
  amount: number;
  currency: string;
  description: string;
  address: string;
  btcAmount: number;
  iat: number; // Issued at
  exp: number; // Expires
  invoiceExpiresAt?: number; // Optional invoice expiry timestamp
}

function base64UrlEncode(data: string) {
  return Buffer.from(data).toString('base64url');
}

function base64UrlDecode(data: string) {
  return Buffer.from(data, 'base64url').toString();
}

export function createSignedToken(payload: InvoicePayload): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));

  const signature = createHmac('sha256', JWT_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64url');
  
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

export function verifyAndDecodeToken(token: string, ignoreExpiration: boolean = false): InvoicePayload | null {
  try {
    const [encodedHeader, encodedPayload, signature] = token.split('.');
    
    const expectedSignature = createHmac('sha256', JWT_SECRET)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64url');

    if (signature !== expectedSignature) {
      console.error('Invalid token signature');
      return null;
    }

    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as InvoicePayload;

    if (!ignoreExpiration && Date.now() > payload.exp) {
        // We still return the payload for expired quotes so the UI can handle it
        return payload;
    }


    return payload;
  } catch (error) {
    console.error('Error verifying token:', error);
    return null;
  }
}

// Helper function to add a delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchWithRetry(url: string, options: RequestInit, retries = 2, backoff = 300) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) {
        return response.json();
      }
      console.warn(`Attempt ${i + 1} failed for ${url} with status: ${response.status}`);
    } catch (error) {
      console.warn(`Attempt ${i + 1} failed for ${url} with error:`, error);
    }
    await delay(backoff * (i + 1));
  }
  throw new Error(`Failed to fetch from ${url} after ${retries} attempts.`);
}


async function getBitstampPrice(currency: string): Promise<number> {
    const currencyCode = currency.toLowerCase();
    if (currencyCode !== 'usd' && currencyCode !== 'eur') {
        throw new Error(`Bitstamp fallback only supports USD and EUR.`);
    }

    const ticker = `bt${currencyCode}`;
    const data = await fetchWithRetry(`https://www.bitstamp.net/api/v2/ticker/${ticker}/`, { cache: 'no-store' });
    if (data && data.last) {
        return parseFloat(data.last);
    } else {
        throw new Error(`Invalid response from Bitstamp API.`);
    }
}

export async function getBtcPrice(currency: string): Promise<number> {
  const currencyCode = currency.toLowerCase();
  
  // 1. Primary Source: CoinGecko
  try {
    const data = await fetchWithRetry(
      `https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=${currencyCode}`,
      { cache: 'no-store' }
    );
    if (data.bitcoin && data.bitcoin[currencyCode]) {
      return data.bitcoin[currencyCode];
    } else {
       throw new Error(`Currency '${currency}' not found in CoinGecko response.`);
    }
  } catch (error) {
    console.warn("CoinGecko API failed, attempting fallback:", error);
    
    // 2. Fallback Source: Bitstamp (for USD/EUR)
    try {
        return await getBitstampPrice(currency);
    } catch (fallbackError) {
        console.error("All price sources failed:", fallbackError);
        throw new Error('Price service unavailable. Please try again later.');
    }
  }
}
