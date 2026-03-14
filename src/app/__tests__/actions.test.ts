import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/invoice', async (importActual) => {
  const actual = await importActual<typeof import('@/lib/invoice')>();
  return {
    ...actual,
    getBtcPrice: vi.fn(),
    listAddressTxidsBlockchair: vi.fn(),
    getTxDetailsBlockchair: vi.fn(),
    getHistoricalRateAtBlock: vi.fn(),
  };
});

vi.mock('@/lib/invoice-store', () => ({
  buildInvoiceUrl: vi.fn(),
  createStoredInvoice: vi.fn(),
  getStoredInvoiceByAccessKey: vi.fn(),
  setStoredInvoiceStatus: vi.fn(),
  updateStoredInvoiceQuote: vi.fn(),
}));

import {
  checkPaymentStatus,
  createInvoice,
  loadInvoice,
  refreshQuote,
  type CreateInvoiceState,
} from '@/app/actions';
import type { InvoicePayload } from '@/lib/invoice';
import * as invoice from '@/lib/invoice';
import * as invoiceStore from '@/lib/invoice-store';

const PUBLIC_ID = 'f4c9a8b7d6e5c3f2a1b0d9e8';

function makePayload(overrides: Partial<InvoicePayload> = {}): InvoicePayload {
  const nowMs = Date.now();
  return {
    invoiceId: PUBLIC_ID,
    amountFiat: 100,
    currency: 'USD',
    description: 'Invoice',
    address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    amountSats: 100_000,
    amountUsd: 100,
    invoiceCreatedAt: nowMs,
    quoteExpiresAt: nowMs + 600_000,
    invoiceExpiresAt: nowMs + 7 * 24 * 60 * 60 * 1000,
    status: 'pending',
    txId: null,
    ...overrides,
  };
}

const initialCreateInvoiceState: CreateInvoiceState = {
  error: null,
  details: {},
  invoiceUrl: null,
};

describe('actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('createInvoice returns a stable invoice URL', async () => {
    vi.mocked(invoice.getBtcPrice)
      .mockResolvedValueOnce(100_000)
      .mockResolvedValueOnce(100_000);
    vi.mocked(invoiceStore.createStoredInvoice).mockResolvedValue({
      invoice: makePayload({ invoiceId: 'a9b8c7d6e5f4a3b2c1d0e9f8' }),
      accessKey: 'quy3GDNB',
    });
    vi.mocked(invoiceStore.buildInvoiceUrl).mockReturnValue('/invoice/a9b8c7d6e5f4a3b2c1d0e9f8?k=quy3GDNB');

    const formData = new FormData();
    formData.set('amount', '100');
    formData.set('currency', 'USD');
    formData.set('address', 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh');
    formData.set('description', 'Test');
    formData.set('expiresIn', '7');

    const result = await createInvoice(initialCreateInvoiceState, formData);

    expect(result.invoiceUrl).toBe('/invoice/a9b8c7d6e5f4a3b2c1d0e9f8?k=quy3GDNB');
    expect(result.error).toBeNull();
    expect(invoiceStore.createStoredInvoice).toHaveBeenCalledTimes(1);
  });

  it('createInvoice forwards locale when provided', async () => {
    vi.mocked(invoice.getBtcPrice)
      .mockResolvedValueOnce(100_000)
      .mockResolvedValueOnce(100_000);
    vi.mocked(invoiceStore.createStoredInvoice).mockResolvedValue({
      invoice: makePayload({ invoiceId: 'a9b8c7d6e5f4a3b2c1d0e9f8' }),
      accessKey: 'quy3GDNB',
    });
    vi.mocked(invoiceStore.buildInvoiceUrl).mockReturnValue('/invoice/a9b8c7d6e5f4a3b2c1d0e9f8?k=quy3GDNB&lang=es');

    const formData = new FormData();
    formData.set('amount', '100');
    formData.set('currency', 'USD');
    formData.set('address', 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh');
    formData.set('description', 'Test');
    formData.set('expiresIn', '7');
    formData.set('lang', 'es');

    const result = await createInvoice(initialCreateInvoiceState, formData);

    expect(result.invoiceUrl).toBe('/invoice/a9b8c7d6e5f4a3b2c1d0e9f8?k=quy3GDNB&lang=es');
    expect(invoiceStore.buildInvoiceUrl).toHaveBeenCalledWith('a9b8c7d6e5f4a3b2c1d0e9f8', 'quy3GDNB', 'es');
  });

  it('createInvoice masks upstream error details from user response', async () => {
    const sensitive = 'fetch failed https://api.coingecko.com status=503';
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(invoice.getBtcPrice).mockRejectedValue(new Error(sensitive));

    const formData = new FormData();
    formData.set('amount', '100');
    formData.set('currency', 'USD');
    formData.set('address', 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh');
    formData.set('description', '');
    formData.set('expiresIn', '7');

    const result = await createInvoice(initialCreateInvoiceState, formData);

    expect(result.invoiceUrl).toBeNull();
    expect(result.error).toBe('Failed to create invoice. Please try again.');
    expect(result.error).not.toContain('coingecko');
    expect(result.error).not.toContain('https://');
    expect(errorSpy).toHaveBeenCalledWith('createInvoice failed:', expect.any(Error));
  });

  it('createInvoice masks store-layer details from user response', async () => {
    const sensitive = 'supabase error host=db.internal code=42501';
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    vi.mocked(invoice.getBtcPrice)
      .mockResolvedValueOnce(100_000)
      .mockResolvedValueOnce(100_000);
    vi.mocked(invoiceStore.createStoredInvoice).mockRejectedValue(new Error(sensitive));

    const formData = new FormData();
    formData.set('amount', '100');
    formData.set('currency', 'USD');
    formData.set('address', 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh');
    formData.set('description', '');
    formData.set('expiresIn', '7');

    const result = await createInvoice(initialCreateInvoiceState, formData);

    expect(result.invoiceUrl).toBeNull();
    expect(result.error).toBe('Failed to create invoice. Please try again.');
    expect(result.error).not.toContain('supabase');
    expect(result.error).not.toContain('db.internal');
    expect(errorSpy).toHaveBeenCalledWith('createInvoice failed:', expect.any(Error));
  });

  it('loadInvoice returns Invalid invoice link for wrong id/key', async () => {
    vi.mocked(invoiceStore.getStoredInvoiceByAccessKey).mockResolvedValue(null);

    const result = await loadInvoice(PUBLIC_ID, 'bad-key');
    expect(result).toEqual({ error: 'Invalid invoice link' });
  });

  it('loadInvoice returns Invoice expired at hard-expiry boundary', async () => {
    const expiredPayload = makePayload({
      invoiceExpiresAt: Date.now() - 1000,
      status: 'pending',
    });
    vi.mocked(invoiceStore.getStoredInvoiceByAccessKey).mockResolvedValue(expiredPayload);
    vi.mocked(invoiceStore.setStoredInvoiceStatus).mockResolvedValue({
      ...expiredPayload,
      status: 'expired',
    });

    const result = await loadInvoice(expiredPayload.invoiceId, 'key');

    expect(result).toEqual({ error: 'Invoice expired' });
    expect(invoiceStore.setStoredInvoiceStatus).toHaveBeenCalledWith(expiredPayload.invoiceId, 'expired', null);
  });

  it('refreshQuote keeps immutable timestamps and only updates quote fields', async () => {
    const oldPayload = makePayload();
    const refreshedPayload = makePayload({
      quoteExpiresAt: oldPayload.quoteExpiresAt + 60_000,
      amountSats: oldPayload.amountSats + 123,
      amountUsd: oldPayload.amountUsd + 0.5,
    });

    vi.mocked(invoiceStore.getStoredInvoiceByAccessKey).mockResolvedValue(oldPayload);
    vi.mocked(invoice.getBtcPrice)
      .mockResolvedValueOnce(100_000)
      .mockResolvedValueOnce(100_000);
    vi.mocked(invoiceStore.updateStoredInvoiceQuote).mockResolvedValue(refreshedPayload);

    const result = await refreshQuote(oldPayload.invoiceId, 'key');

    expect('payload' in result).toBe(true);
    if ('payload' in result) {
      expect(result.payload.invoiceCreatedAt).toBe(oldPayload.invoiceCreatedAt);
      expect(result.payload.invoiceExpiresAt).toBe(oldPayload.invoiceExpiresAt);
      expect(result.payload.amountSats).toBe(refreshedPayload.amountSats);
      expect(result.payload.quoteExpiresAt).toBe(refreshedPayload.quoteExpiresAt);
    }
    expect(invoiceStore.updateStoredInvoiceQuote).toHaveBeenCalledWith(oldPayload.invoiceId, {
      amountSats: expect.any(Number),
      amountUsd: expect.any(Number),
      quoteExpiresAt: expect.any(Number),
    });
  });

  it('refreshQuote maps expired invoice to expired code', async () => {
    const expiredPayload = makePayload({ invoiceExpiresAt: Date.now() - 1, status: 'pending' });
    vi.mocked(invoiceStore.getStoredInvoiceByAccessKey).mockResolvedValue(expiredPayload);
    vi.mocked(invoiceStore.setStoredInvoiceStatus).mockResolvedValue({ ...expiredPayload, status: 'expired' });

    const result = await refreshQuote(expiredPayload.invoiceId, 'key');

    expect(result).toEqual({ error: 'Invoice expired', code: 'expired' });
  });

  it('refreshQuote masks technical error details from user response', async () => {
    const payload = makePayload();
    const sensitive = 'upstream failure at https://api.coingecko.com host=internal';
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    vi.mocked(invoiceStore.getStoredInvoiceByAccessKey).mockResolvedValue(payload);
    vi.mocked(invoice.getBtcPrice).mockRejectedValue(new Error(sensitive));

    const result = await refreshQuote(payload.invoiceId, 'key');

    expect(result).toEqual({
      error: 'Failed to refresh quote. Please try again.',
      code: 'refresh_failed',
    });
    expect(errorSpy).toHaveBeenCalledWith('refreshQuote failed:', expect.any(Error));
  });

  it('refreshQuote masks store-layer details from user response', async () => {
    const payload = makePayload();
    const sensitive = 'supabase update failed relation=private.invoices';
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    vi.mocked(invoiceStore.getStoredInvoiceByAccessKey).mockResolvedValue(payload);
    vi.mocked(invoice.getBtcPrice)
      .mockResolvedValueOnce(100_000)
      .mockResolvedValueOnce(100_000);
    vi.mocked(invoiceStore.updateStoredInvoiceQuote).mockRejectedValue(new Error(sensitive));

    const result = await refreshQuote(payload.invoiceId, 'key');

    expect(result).toEqual({
      error: 'Failed to refresh quote. Please try again.',
      code: 'refresh_failed',
    });
    expect(errorSpy).toHaveBeenCalledWith('refreshQuote failed:', expect.any(Error));
  });

  it('returns pending for unconfirmed dust transactions', async () => {
    const nowMs = Date.now();
    vi.mocked(invoiceStore.getStoredInvoiceByAccessKey).mockResolvedValue(makePayload());
    vi.mocked(invoice.listAddressTxidsBlockchair).mockResolvedValue(['dust-tx']);
    vi.mocked(invoice.getTxDetailsBlockchair).mockResolvedValue({
      satsToAddress: 50,
      confirmed: false,
      time: nowMs,
    });

    const result = await checkPaymentStatus(PUBLIC_ID, 'key');

    expect(result.status).toBe('pending');
    expect(invoiceStore.setStoredInvoiceStatus).not.toHaveBeenCalled();
  });

  it('returns detected for matching unconfirmed amount', async () => {
    const nowMs = Date.now();
    vi.mocked(invoiceStore.getStoredInvoiceByAccessKey).mockResolvedValue(makePayload());
    vi.mocked(invoice.listAddressTxidsBlockchair).mockResolvedValue(['candidate-tx']);
    vi.mocked(invoice.getTxDetailsBlockchair).mockResolvedValue({
      satsToAddress: 100_500,
      confirmed: false,
      time: nowMs,
    });
    vi.mocked(invoiceStore.setStoredInvoiceStatus).mockResolvedValue(makePayload({ status: 'detected', txId: 'candidate-tx' }));

    const result = await checkPaymentStatus(PUBLIC_ID, 'key');

    expect(result).toEqual({ status: 'detected', txid: 'candidate-tx' });
    expect(invoiceStore.setStoredInvoiceStatus).toHaveBeenCalledWith(PUBLIC_ID, 'detected', 'candidate-tx');
  });

  it('returns confirmed for a fiat-matching confirmed payment', async () => {
    const nowMs = Date.now();
    vi.mocked(invoiceStore.getStoredInvoiceByAccessKey).mockResolvedValue(makePayload());
    vi.mocked(invoice.listAddressTxidsBlockchair).mockResolvedValue(['confirmed-tx']);
    vi.mocked(invoice.getTxDetailsBlockchair).mockResolvedValue({
      satsToAddress: 100_000,
      confirmed: true,
      time: nowMs,
      blockId: 123,
    });
    vi.mocked(invoice.getHistoricalRateAtBlock).mockResolvedValue(100_000);
    vi.mocked(invoiceStore.setStoredInvoiceStatus).mockResolvedValue(makePayload({ status: 'confirmed', txId: 'confirmed-tx' }));

    const result = await checkPaymentStatus(PUBLIC_ID, 'key');

    expect(result).toEqual({ status: 'confirmed', txid: 'confirmed-tx' });
    expect(invoiceStore.setStoredInvoiceStatus).toHaveBeenCalledWith(PUBLIC_ID, 'confirmed', 'confirmed-tx');
  });

  it('keeps detected sticky when no new tx is found later', async () => {
    const detected = makePayload({ status: 'detected', txId: 'abc123' });
    vi.mocked(invoiceStore.getStoredInvoiceByAccessKey).mockResolvedValue(detected);
    vi.mocked(invoice.listAddressTxidsBlockchair).mockResolvedValue([]);

    const result = await checkPaymentStatus(PUBLIC_ID, 'key');

    expect(result).toEqual({ status: 'detected', txid: 'abc123' });
  });
});
