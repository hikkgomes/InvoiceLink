# **App Name**: InvoiceLink

## Core Features:

- Invoice Creation: Create a Bitcoin invoice link with specified amount, currency, and description.
- Static Invoice URLs: Persistent invoice URLs use `/invoice/{invoiceId}?k={viewKey}` with a random non-sequential `invoiceId`.
- Supabase Persistence: Invoice records are stored in `private.invoices`; only hashed access keys are persisted.
- BTC Price Fetch: Uses CoinGecko for all supported currencies. Falls back to Bitstamp for USD/EUR only.
- BIP21 Link Generation: Generates a BIP21-formatted Bitcoin URI for easy payment in wallets.
- Invoice Display: Renders a minimal, mobile-first invoice page with QR code, BTC amount, and expiry date.
- Price Lock and Refresh: Refreshes quote fields (`amountSats`, `amountUsd`, `quoteExpiresAt`) without changing URL.
- Payment Status Check: Checks payment status by querying Blockchair address/transaction/block APIs.
- Sticky Detection: Once a matching unconfirmed transaction is detected, the client keeps detected state while polling for confirmation.

## Known Constraints:

- The system is non-custodial (no private keys managed by platform).
- Matching is address-based and can be ambiguous when the same address is reused across many invoices.
- Unique per-invoice address derivation is out of scope for this MVP.

## Style Guidelines:

- Primary color: Deep Purple (#10051c).
- Text color: White (#ffffff) to provide a clean and modern backdrop.
- Accent color: Yellow-Orange (#f6b30b) for fades and gradients with purple tones.
- Body and headline font: Inter sans-serif for a modern, neutral look.
- Minimal, line-based icons for a clean and efficient user experience.
- Mobile-first, responsive layout to ensure accessibility on all devices.
- Subtle animations for loading states and user interactions to improve user experience.
