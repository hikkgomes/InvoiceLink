import { createHmac } from 'crypto';
import { JWT_SECRET, MOCK_BTC_PRICE_USD } from './constants';

export interface InvoicePayload {
  amount: number;
  currency: string;
  description: string;
  address: string;
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
  
  // This is a simplified mock. In a real application, you'd use a price feed
  // to get real-time exchange rates for all supported currencies.
  const rates: { [key: string]: number } = {
    USD: MOCK_BTC_PRICE_USD,
    EUR: MOCK_BTC_PRICE_USD * 0.93,
    GBP: MOCK_BTC_PRICE_USD * 0.79,
    JPY: MOCK_BTC_PRICE_USD * 157,
    CAD: MOCK_BTC_PRICE_USD * 1.37,
    AUD: MOCK_BTC_PRICE_USD * 1.50,
    CHF: MOCK_BTC_PRICE_USD * 0.90,
  };

  const rate = rates[currency.toUpperCase()];

  if (rate) {
    return MOCK_BTC_PRICE_USD / (rate / MOCK_BTC_PRICE_USD);
  }

  // Fallback for any other currency
  return MOCK_BTC_PRICE_USD;
}
