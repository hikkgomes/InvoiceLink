# **App Name**: NodeInvoice

## Core Features:

- Invoice Creation: Create a Bitcoin invoice link with specified amount, currency, and description.
- Static Invoice URLs: Persistent invoice URLs use `/invoice/{invoiceId}?k={viewKey}` with a random non-sequential `invoiceId`.
- Supabase Persistence: Invoice records are stored in `private.invoices`; only hashed access keys are persisted.
- BTC Price Fetch: Uses CoinGecko for all supported currencies. Falls back to CoinMarketCap when API key is configured.
- Currency Catalog: Major fiat currencies first, then BTC, then all other supported fiat currencies from CoinGecko/CoinMarketCap.
- BIP21 Link Generation: Generates a BIP21-formatted Bitcoin URI for easy payment in wallets.
- Invoice Display: Renders a minimal, mobile-first invoice page with QR code, BTC amount, and expiry date.
- Price Lock and Refresh: Refreshes quote fields (`amountSats`, `amountUsd`, `quoteExpiresAt`) without changing URL.
- BTC Direct Mode: Invoices can be created directly in BTC (fixed sat amount, no quote refresh cycle).
- Fiat Cushion: Fiat conversion adds a configurable cushion (`RATE_CUSHION_BPS`, default 1%).
- Payment Status Check: Checks payment status by querying Blockchair address/transaction/block APIs.
- Sticky Detection: Once a matching unconfirmed transaction is detected, the client keeps detected state while polling for confirmation.

## Known Constraints:

- The system is non-custodial (no private keys managed by platform).
- Matching is address-based and can be ambiguous when the same address is reused across many invoices.
- Unique per-invoice address derivation is out of scope for this MVP.

## Style Guidelines:

- Visual direction: Tech Noir, dark-first with optional light mode.
- Core colors: Slate/ink surfaces with cyan signal accents and Bitcoin orange highlights.
- Typography: Sora/Avenir-style geometric sans for body and headline, monospace for technical values.
- Background treatment: grid overlays + soft radial glows instead of flat single-color pages.
- Motion: restrained micro-animations for status, quote refresh, and loading only where meaningful.
- Mobile-first responsive layout across landing, invoice, and legal pages.
