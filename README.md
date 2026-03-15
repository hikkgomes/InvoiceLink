# NodeInvoice

NodeInvoice is a non-custodial Bitcoin invoicing app. Merchants create invoice links and payers send BTC directly to the merchant wallet.

## Current Architecture

- Next.js App Router UI + Server Actions
- Static invoice URLs: `/invoice/{invoiceId}?k={viewKey}` where `invoiceId` is a random public ID (non-sequential)
- Supabase (private schema) for invoice persistence
- Quote pricing:
  - Primary: CoinGecko
  - Fallback: CoinMarketCap (optional API key)
- Currency catalog:
  - Major fiat currencies first (`USD, EUR, GBP, JPY, CAD, AUD, CHF`)
  - `BTC` option for direct BTC invoices
  - Other fiat currencies from CoinGecko/CoinMarketCap, deduped and sorted
- Fiat cushion:
  - Fiat->BTC quotes apply a cushion (`RATE_CUSHION_BPS`, default `100` = 1%)
- BTC invoice mode:
  - Supports direct BTC amounts (for example `1 BTC` / `0.005 BTC`)
  - BTC invoices skip quote refresh and use exact satoshi matching on detection/confirmation
- Payment status checks:
  - Esplora API providers (`mempool.space/api` primary, `blockstream.info/api` fallback)
  - Confirmation uses on-chain tx status with sats-based matching (no historical-rate lookup)
  - Fiat match tolerance configurable with `FIAT_TOLERANCE_BPS`

## Environment Variables

- `SUPABASE_URL`: your project URL
- `SUPABASE_SERVICE_ROLE_KEY`: server-only key (never expose in client)
- `INVOICE_KEY_PEPPER`: random secret used for hashing invoice view keys
- `FIAT_TOLERANCE_BPS`: optional, default `100` (1%)
- `RATE_CUSHION_BPS`: optional, default `100` (1%)
- `COINMARKETCAP_API_KEY`: optional, enables pricing/catalog fallback
- `COINMARKETCAP_API_BASE`: optional, default `https://pro-api.coinmarketcap.com`
- `ESPLORA_BASE_URLS`: optional comma-separated provider override (default mempool + blockstream)
- `ESPLORA_TIMEOUT_MS`: optional request timeout in ms for Esplora calls (default `8000`)

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
