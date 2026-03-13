import { beforeEach, describe, expect, it } from 'vitest';

import { buildInvoiceUrl, generateInvoiceAccessKey, hashInvoiceAccessKey } from '@/lib/invoice-store';

describe('invoice-store key utilities', () => {
  beforeEach(() => {
    process.env.INVOICE_KEY_PEPPER = 'test-pepper';
  });

  it('builds stable invoice URLs', () => {
    expect(buildInvoiceUrl('a9b8c7d6e5f4a3b2c1d0e9f8', 'quy3GDNB')).toBe(
      '/invoice/a9b8c7d6e5f4a3b2c1d0e9f8?k=quy3GDNB',
    );
  });

  it('hashes the same key deterministically and different keys differently', () => {
    const first = hashInvoiceAccessKey('same-key');
    const second = hashInvoiceAccessKey('same-key');
    const different = hashInvoiceAccessKey('different-key');

    expect(first).toBe(second);
    expect(first).not.toBe(different);
    expect(first).toMatch(/^[a-f0-9]{64}$/);
  });

  it('generates url-safe random access keys', () => {
    const one = generateInvoiceAccessKey();
    const two = generateInvoiceAccessKey();

    expect(one).not.toBe(two);
    expect(one.length).toBeGreaterThan(10);
    expect(one).toMatch(/^[A-Za-z0-9_-]+$/);
  });
});
