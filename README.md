# InvoiceLink

InvoiceLink is a non-custodial Bitcoin invoicing app. Merchants create invoice links and payers send BTC directly to the merchant wallet.

## Current Architecture

- Next.js App Router UI
- JWT-signed invoice payloads (HS256)
- Quote pricing:
  - Primary: CoinGecko
  - Fallback: Bitstamp (USD/EUR only)
- Payment status checks:
  - Blockchair address + transaction + block endpoints
  - Fiat match tolerance configurable with `FIAT_TOLERANCE_BPS`

## Environment Variables

- `JWT_SECRET`: required in production, at least 32 characters.
- `FIAT_TOLERANCE_BPS`: optional, default `100` (1%).

## Development

```bash
npm install
npm run dev
```

Quality checks:

```bash
npm run typecheck
npm run lint
npm run build
```

## Known Limitation

Address reuse is supported but can be ambiguous for high-volume merchants because matching is address-based. Unique per-invoice addresses (xpub derivation) are intentionally out of scope for the current MVP.
