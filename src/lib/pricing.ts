import { MAJOR_FIAT_CURRENCIES, type CurrencyCatalog } from '@/lib/currency';
import { getCoinMarketCapApiBase, getCoinMarketCapApiKey } from '@/lib/env.server';
const COINGECKO_API_BASE = 'https://api.coingecko.com/api/v3';

const CURRENCY_CATALOG_TTL_MS = 6 * 60 * 60 * 1000;
const FALLBACK_CATALOG_TTL_MS = 60 * 1000;
const PRICE_CACHE_TTL_MS = 60 * 1000;

type CacheEntry<T> = {
  expiresAt: number;
  value: T;
};

let currencyCatalogCache: CacheEntry<CurrencyCatalog> | null = null;
const priceCache = new Map<string, CacheEntry<number>>();

function toUpperCode(code: string): string {
  return code.trim().toUpperCase();
}

function getValidFiatCodes(): Set<string> {
  if (typeof Intl.supportedValuesOf !== 'function') {
    return new Set(MAJOR_FIAT_CURRENCIES);
  }
  return new Set(Intl.supportedValuesOf('currency').map((code) => code.toUpperCase()));
}

function buildFallbackCatalog(): CurrencyCatalog {
  const majorFiat = [...MAJOR_FIAT_CURRENCIES];
  return {
    majorFiat,
    bitcoin: 'BTC',
    otherFiat: [],
    all: [...majorFiat, 'BTC'],
  };
}

async function fetchJson(url: string, headers?: Record<string, string>) {
  const response = await fetch(url, {
    cache: 'no-store',
    headers,
  });
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }
  return response.json();
}

async function fetchCoinGeckoSupportedFiatCodes(): Promise<string[]> {
  const data = await fetchJson(`${COINGECKO_API_BASE}/simple/supported_vs_currencies`);
  if (!Array.isArray(data)) throw new Error('CoinGecko supported currencies payload invalid');
  return data.filter((item): item is string => typeof item === 'string').map(toUpperCode);
}

async function fetchCoinMarketCapFiatCodes(): Promise<string[]> {
  const apiKey = getCoinMarketCapApiKey();
  if (!apiKey) return [];

  const base = getCoinMarketCapApiBase();
  const data = await fetchJson(`${base}/v1/fiat/map?limit=5000`, { 'X-CMC_PRO_API_KEY': apiKey });
  const rows = Array.isArray(data?.data) ? data.data : [];

  return rows
    .map((row: unknown) => {
      const symbol = typeof row === 'object' && row !== null && 'symbol' in row ? (row as { symbol?: unknown }).symbol : null;
      return typeof symbol === 'string' ? toUpperCode(symbol) : '';
    })
    .filter((value: string) => value.length > 0);
}

async function priceFromCoinGecko(vs: string): Promise<number> {
  const lower = vs.toLowerCase();
  const data = await fetchJson(`${COINGECKO_API_BASE}/simple/price?ids=bitcoin&vs_currencies=${lower}`);
  const price = data?.bitcoin?.[lower];
  if (typeof price !== 'number' || !Number.isFinite(price) || price <= 0) {
    throw new Error('CoinGecko price missing');
  }
  return price;
}

async function priceFromCoinMarketCap(vs: string): Promise<number> {
  const apiKey = getCoinMarketCapApiKey();
  if (!apiKey) throw new Error('CoinMarketCap API key not configured');

  const base = getCoinMarketCapApiBase();
  const data = await fetchJson(`${base}/v2/cryptocurrency/quotes/latest?id=1&convert=${encodeURIComponent(vs)}`, {
    'X-CMC_PRO_API_KEY': apiKey,
  });

  const price = Number(data?.data?.['1']?.quote?.[vs]?.price);
  if (!Number.isFinite(price) || price <= 0) throw new Error('CoinMarketCap price missing');
  return price;
}

export async function getCurrencyCatalog(): Promise<CurrencyCatalog> {
  const now = Date.now();
  if (currencyCatalogCache && currencyCatalogCache.expiresAt > now) {
    return currencyCatalogCache.value;
  }

  try {
    const [cgCodes, cmcCodes] = await Promise.all([fetchCoinGeckoSupportedFiatCodes(), fetchCoinMarketCapFiatCodes()]);
    const validFiatCodes = getValidFiatCodes();
    const mergedFiat = new Set<string>();

    for (const code of [...cgCodes, ...cmcCodes]) {
      if (validFiatCodes.has(code)) mergedFiat.add(code);
    }

    const majorFiat = MAJOR_FIAT_CURRENCIES.filter((code) => mergedFiat.has(code)).map((code) => code as string);
    const otherFiat = [...mergedFiat]
      .filter((code) => !majorFiat.includes(code))
      .sort((left, right) => left.localeCompare(right));

    const value: CurrencyCatalog = {
      majorFiat: [...majorFiat],
      bitcoin: 'BTC',
      otherFiat,
      all: [...majorFiat, 'BTC', ...otherFiat],
    };

    currencyCatalogCache = { value, expiresAt: now + CURRENCY_CATALOG_TTL_MS };
    return value;
  } catch {
    const fallback = buildFallbackCatalog();
    currencyCatalogCache = { value: fallback, expiresAt: now + FALLBACK_CATALOG_TTL_MS };
    return fallback;
  }
}

export async function getBtcPrice(vs: string): Promise<number> {
  const target = toUpperCode(vs);
  if (target === 'BTC') return 1;

  const now = Date.now();
  const cached = priceCache.get(target);
  if (cached && cached.expiresAt > now) {
    return cached.value;
  }

  try {
    const value = await priceFromCoinGecko(target);
    priceCache.set(target, { value, expiresAt: now + PRICE_CACHE_TTL_MS });
    return value;
  } catch (cgError) {
    try {
      const value = await priceFromCoinMarketCap(target);
      priceCache.set(target, { value, expiresAt: now + PRICE_CACHE_TTL_MS });
      return value;
    } catch {
      const reason = cgError instanceof Error ? cgError.message : 'unknown';
      throw new Error(`Price unavailable for ${target}: ${reason}`);
    }
  }
}

export function applyFiatCushion(baseSats: number, cushionBps: number): number {
  if (!Number.isFinite(cushionBps) || cushionBps <= 0) return baseSats;
  return Math.ceil(baseSats * (1 + cushionBps / 10_000));
}

export function clearPricingCachesForTests() {
  currencyCatalogCache = null;
  priceCache.clear();
}
