# InvoiceLink

InvoiceLink is a non-custodial Bitcoin invoicing app. Merchants create invoice links and payers send BTC directly to the merchant wallet.

## Current Architecture

- Next.js App Router UI + Server Actions
- Static invoice URLs: `/invoice/{invoiceId}?k={viewKey}` where `invoiceId` is a random public ID (non-sequential)
- Supabase (private schema) for invoice persistence
- Quote pricing:
  - Primary: CoinGecko
  - Fallback: Bitstamp (USD/EUR only)
- Payment status checks:
  - Blockchair address + transaction + block endpoints
  - Fiat match tolerance configurable with `FIAT_TOLERANCE_BPS`

## Environment Variables

- `SUPABASE_URL`: your project URL
- `SUPABASE_SERVICE_ROLE_KEY`: server-only key (never expose in client)
- `INVOICE_KEY_PEPPER`: random secret used for hashing invoice view keys
- `FIAT_TOLERANCE_BPS`: optional, default `100` (1%)

## Supabase Setup

1. Create a Supabase project.
2. Run SQL from `docs/supabase-schema.sql` in the SQL editor.
3. Configure the environment variables above.

## Development

```bash
npm install
npm run dev
```

Quality checks:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

## Netlify Deployment

- Deploy as a standard Next.js app.
- In Netlify site settings, add all environment variables listed above (available to Functions).

## Known Limitation

Address reuse is supported but can be ambiguous for high-volume merchants because matching is address-based. Unique per-invoice addresses (xpub derivation) are intentionally out of scope for this MVP.
