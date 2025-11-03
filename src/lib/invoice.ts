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
        console.error('Token has expired');
        // We still return the payload for expired quotes so the UI can handle it
        return payload;
    }


    return payload;
  } catch (error) {
    console.error('Error verifying token:', error);
    return null;
  }
}

/**
 * Fetches the current price of Bitcoin in the specified currency.
 * @param currency The currency to get the price in (e.g., 'USD', 'EUR').
 * @returns The price of 1 Bitcoin in the specified currency.
 */
export async function getBtcPrice(currency: string): Promise<number> {
  const currencyCode = currency.toLowerCase();
  try {
    const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=${currencyCode}`);
    if (!response.ok) {
      throw new Error(`CoinGecko API responded with status ${response.status}`);
    }
    const data = await response.json();
    
    if (data.bitcoin && data.bitcoin[currencyCode]) {
      return data.bitcoin[currencyCode];
    } else {
      throw new Error(`Currency '${currency}' not supported by the price API.`);
    }
  } catch (error) {
    console.error("Failed to fetch BTC price:", error);
    // As a fallback, you could return a stale or default price,
    // but for now, we'll re-throw to make the issue visible.
    throw new Error('Could not fetch Bitcoin price. Please try again later.');
  }
}
