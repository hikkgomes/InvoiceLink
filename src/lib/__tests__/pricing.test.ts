import { beforeEach, describe, expect, it, vi } from 'vitest';

import { applyFiatCushion, clearPricingCachesForTests, getBtcPrice, getCurrencyCatalog } from '@/lib/pricing';

function mockJsonResponse(data: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    statusText: ok ? 'OK' : 'Error',
    json: async () => data,
  } as Response;
}

describe('pricing', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    clearPricingCachesForTests();
    delete process.env.COINMARKETCAP_API_KEY;
    delete process.env.COINMARKETCAP_API_BASE;
  });

  it('builds currency catalog with majors first, BTC second, and other fiat sorted', async () => {
    process.env.COINMARKETCAP_API_KEY = 'test-key';
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(mockJsonResponse(['usd', 'eur', 'gbp', 'brl', 'eth']))
      .mockResolvedValueOnce(
        mockJsonResponse({
          data: [{ symbol: 'JPY' }, { symbol: 'CAD' }, { symbol: 'AUD' }, { symbol: 'CHF' }],
        }),
      );

    const catalog = await getCurrencyCatalog();

    expect(catalog.majorFiat).toEqual(['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF']);
    expect(catalog.bitcoin).toBe('BTC');
    expect(catalog.otherFiat).toContain('BRL');
    expect(catalog.otherFiat).not.toContain('ETH');
    expect(catalog.all.slice(0, 8)).toEqual(['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'BTC']);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it('uses CoinMarketCap price fallback when CoinGecko fails', async () => {
    process.env.COINMARKETCAP_API_KEY = 'test-key';
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(mockJsonResponse({}, false, 503))
      .mockResolvedValueOnce(
        mockJsonResponse({
          data: {
            '1': {
              quote: {
                USD: { price: 96_500 },
              },
            },
          },
        }),
      );

    const price = await getBtcPrice('USD');

    expect(price).toBe(96_500);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it('throws when both price providers fail', async () => {
    process.env.COINMARKETCAP_API_KEY = 'test-key';
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(mockJsonResponse({}, false, 503))
      .mockResolvedValueOnce(mockJsonResponse({}, false, 500));

    await expect(getBtcPrice('EUR')).rejects.toThrow('Price unavailable for EUR');
  });

  it('applies fiat cushion using ceiling rounding', () => {
    expect(applyFiatCushion(100_000, 100)).toBe(101_000);
    expect(applyFiatCushion(100_001, 100)).toBe(101_002);
  });
});
