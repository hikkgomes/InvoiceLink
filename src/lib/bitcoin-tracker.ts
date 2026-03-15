type CacheEntry<T> = {
  expiresAt: number;
  value: T;
};

type EsploraStatus = {
  confirmed?: unknown;
  block_time?: unknown;
};

type EsploraVout = {
  value?: unknown;
  scriptpubkey_address?: unknown;
};

export type EsploraTx = {
  txid?: unknown;
  status?: EsploraStatus;
  vout?: EsploraVout[];
};

export type TxDetails = {
  satsToAddress: number;
  confirmed: boolean;
  time: number;
};

const DEFAULT_ESPLORA_BASE_URLS = ['https://mempool.space/api', 'https://blockstream.info/api'];
const ADDRESS_TXIDS_CACHE_TTL_MS = 10_000;
const REQUEST_TIMEOUT_MS = Number.parseInt(process.env.ESPLORA_TIMEOUT_MS || '8000', 10);
const MAX_RECENT_TXIDS = 50;

const addressTxidsCache = new Map<string, CacheEntry<string[]>>();
const confirmedTxDetailsCache = new Map<string, TxDetails>();

class EsploraHttpError extends Error {
  status: number;

  constructor(url: string, status: number, statusText: string) {
    super(`Esplora request failed (${status}) for ${url}: ${statusText}`);
    this.name = 'EsploraHttpError';
    this.status = status;
  }
}

function normalizeBaseUrl(base: string): string {
  return base.trim().replace(/\/+$/, '');
}

function getEsploraBaseUrls(): string[] {
  const configured = process.env.ESPLORA_BASE_URLS
    ?.split(',')
    .map((item) => normalizeBaseUrl(item))
    .filter((item) => item.length > 0);

  const candidates = configured && configured.length > 0 ? configured : DEFAULT_ESPLORA_BASE_URLS;
  return [...new Set(candidates.map((item) => normalizeBaseUrl(item)))];
}

function shouldFailover(error: unknown): boolean {
  if (error instanceof EsploraHttpError) {
    return error.status === 429 || error.status === 430 || error.status >= 500;
  }
  if (error instanceof Error && error.name === 'AbortError') {
    return true;
  }
  return error instanceof TypeError;
}

async function fetchJson(url: string): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      cache: 'no-store',
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new EsploraHttpError(url, response.status, response.statusText || 'Error');
    }
    return response.json();
  } finally {
    clearTimeout(timeout);
  }
}

async function withProviderFailover<T>(operation: string, request: (baseUrl: string) => Promise<T>): Promise<T> {
  const providers = getEsploraBaseUrls();
  let lastError: unknown = null;

  for (let index = 0; index < providers.length; index += 1) {
    const baseUrl = providers[index];
    try {
      return await request(baseUrl);
    } catch (error) {
      lastError = error;
      const isLast = index === providers.length - 1;
      if (isLast || !shouldFailover(error)) {
        throw error;
      }
    }
  }

  throw new Error(`${operation} failed: ${lastError instanceof Error ? lastError.message : 'unknown error'}`);
}

function parseTxArray(data: unknown): EsploraTx[] {
  if (!Array.isArray(data)) {
    throw new Error('Invalid Esplora tx list payload');
  }
  return data.filter((entry): entry is EsploraTx => typeof entry === 'object' && entry !== null);
}

function getTxId(tx: EsploraTx): string | null {
  return typeof tx.txid === 'string' && tx.txid.length > 0 ? tx.txid : null;
}

function isConfirmed(status: EsploraStatus | undefined): boolean {
  return status?.confirmed === true;
}

function getBlockTimeMs(status: EsploraStatus | undefined): number | null {
  if (typeof status?.block_time !== 'number' || !Number.isFinite(status.block_time)) {
    return null;
  }
  return status.block_time * 1000;
}

export function sumSatsToAddress(tx: EsploraTx, address: string): number {
  const target = address.toLowerCase();
  const outputs = Array.isArray(tx.vout) ? tx.vout : [];

  return outputs.reduce((total, output) => {
    if (typeof output.scriptpubkey_address !== 'string') return total;
    if (output.scriptpubkey_address.toLowerCase() !== target) return total;
    if (typeof output.value !== 'number' || !Number.isFinite(output.value)) return total;
    return total + Math.trunc(output.value);
  }, 0);
}

export async function listAddressRecentTxids(address: string): Promise<string[]> {
  const key = address.toLowerCase();
  const now = Date.now();
  const cached = addressTxidsCache.get(key);
  if (cached && cached.expiresAt > now) {
    return cached.value;
  }

  const txs = await withProviderFailover('listAddressRecentTxids', async (baseUrl) => {
    const encodedAddress = encodeURIComponent(address);
    const [mempoolPayload, confirmedPayload] = await Promise.all([
      fetchJson(`${baseUrl}/address/${encodedAddress}/txs/mempool`),
      fetchJson(`${baseUrl}/address/${encodedAddress}/txs`),
    ]);
    return [...parseTxArray(mempoolPayload), ...parseTxArray(confirmedPayload)];
  });

  const seen = new Set<string>();
  const txids: string[] = [];

  for (const tx of txs) {
    const txid = getTxId(tx);
    if (!txid || seen.has(txid)) continue;
    seen.add(txid);
    txids.push(txid);
    if (txids.length >= MAX_RECENT_TXIDS) break;
  }

  addressTxidsCache.set(key, {
    value: txids,
    expiresAt: now + ADDRESS_TXIDS_CACHE_TTL_MS,
  });

  return txids;
}

export async function getTx(txid: string): Promise<EsploraTx> {
  return withProviderFailover('getTx', async (baseUrl) => {
    const payload = await fetchJson(`${baseUrl}/tx/${encodeURIComponent(txid)}`);
    if (typeof payload !== 'object' || payload === null) {
      throw new Error('Invalid Esplora tx payload');
    }
    return payload as EsploraTx;
  });
}

export async function getTxDetails(txid: string, address: string): Promise<TxDetails> {
  const cacheKey = `${txid}:${address.toLowerCase()}`;
  const cached = confirmedTxDetailsCache.get(cacheKey);
  if (cached) return cached;

  const tx = await getTx(txid);
  const confirmed = isConfirmed(tx.status);
  const details: TxDetails = {
    satsToAddress: sumSatsToAddress(tx, address),
    confirmed,
    time: confirmed ? (getBlockTimeMs(tx.status) ?? Date.now()) : Date.now(),
  };

  if (details.confirmed) {
    confirmedTxDetailsCache.set(cacheKey, details);
  }

  return details;
}

export function clearBitcoinTrackerCachesForTests() {
  addressTxidsCache.clear();
  confirmedTxDetailsCache.clear();
}
