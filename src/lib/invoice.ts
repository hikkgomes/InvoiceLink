import { createHmac } from 'crypto';
import { JWT_SECRET, MOCK_BTC_PRICE_USD } from './constants';

export interface InvoicePayload {
  amount: number;
  currency: string;
  description: string;
  btcAmount: number;
  iat: number; // Issued at
  exp: number; // Expires
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

export function verifyAndDecodeToken(token: string): InvoicePayload | null {
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

    return payload;
  } catch (error) {
    console.error('Error verifying token:', error);
    return null;
  }
}

// Mock function for fetching BTC price.
export async function getBtcPrice(currency: string): Promise<number> {
  // In a real app, you would fetch this from an API like CoinMarketCap
  // and handle different currencies.
  console.log(`Fetching BTC price for ${currency}`);
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
  if (currency.toUpperCase() === 'USD') {
    return MOCK_BTC_PRICE_USD;
  }
  // For simplicity, we'll pretend other currencies are at par with USD.
  return MOCK_BTC_PRICE_USD;
}
