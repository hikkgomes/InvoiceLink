import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  clearBitcoinTrackerCachesForTests,
  getTxDetails,
  listAddressRecentTxids,
  sumSatsToAddress,
  type EsploraTx,
} from '@/lib/bitcoin-tracker';

function mockJsonResponse(data: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    statusText: ok ? 'OK' : 'Error',
    json: async () => data,
  } as Response;
}

describe('bitcoin-tracker', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    clearBitcoinTrackerCachesForTests();
    delete process.env.ESPLORA_BASE_URLS;
    delete process.env.ESPLORA_TIMEOUT_MS;
  });

  it('merges mempool + confirmed txids and dedupes in order', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(mockJsonResponse([{ txid: 'mempool-a' }, { txid: 'dupe' }]))
      .mockResolvedValueOnce(mockJsonResponse([{ txid: 'dupe' }, { txid: 'confirmed-a' }]));

    const txids = await listAddressRecentTxids('bc1qtest');

    expect(txids).toEqual(['mempool-a', 'dupe', 'confirmed-a']);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it('falls back to secondary provider on throttled primary responses', async () => {
    process.env.ESPLORA_BASE_URLS = 'https://primary.invalid/api,https://fallback.invalid/api';
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(mockJsonResponse({}, false, 430))
      .mockResolvedValueOnce(mockJsonResponse({}, false, 430))
      .mockResolvedValueOnce(mockJsonResponse([{ txid: 'mempool-b' }]))
      .mockResolvedValueOnce(mockJsonResponse([{ txid: 'confirmed-b' }]));

    const txids = await listAddressRecentTxids('bc1qtest');

    expect(txids).toEqual(['mempool-b', 'confirmed-b']);
    expect(fetchSpy).toHaveBeenCalledTimes(4);
  });

  it('computes sats sent to address correctly', () => {
    const tx: EsploraTx = {
      vout: [
        { scriptpubkey_address: 'bc1qtarget', value: 50_000 },
        { scriptpubkey_address: 'bc1qother', value: 1_000 },
        { scriptpubkey_address: 'bc1qtarget', value: 25_000 },
      ],
    };

    expect(sumSatsToAddress(tx, 'bc1qtarget')).toBe(75_000);
  });

  it('caches confirmed tx details', async () => {
    const nowSeconds = Math.floor(Date.now() / 1000);
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      mockJsonResponse({
        txid: 'tx1',
        status: { confirmed: true, block_time: nowSeconds },
        vout: [{ scriptpubkey_address: 'bc1qtarget', value: 100_000 }],
      }),
    );

    const first = await getTxDetails('tx1', 'bc1qtarget');
    const second = await getTxDetails('tx1', 'bc1qtarget');

    expect(first.confirmed).toBe(true);
    expect(first.satsToAddress).toBe(100_000);
    expect(second).toEqual(first);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });
});
