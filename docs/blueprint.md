# **App Name**: InvoiceLink

## Core Features:

- Invoice Creation: Create a Bitcoin invoice link with specified amount, currency, and description.
- JWT Token Generation: Generates a signed JWT token encoding all invoice data, ensuring data integrity and statelessness.
- BTC Price Fetch: Fetches the real-time BTC price from CoinMarketCap to calculate the equivalent BTC amount.
- BIP21 Link Generation: Generates a BIP21-formatted Bitcoin URI for easy payment in wallets.
- Invoice Display: Renders a minimal, mobile-first invoice page with QR code, BTC amount, and expiry date.
- Price Lock and Refresh: Allows freezing the BTC quote for a specified time, with an option to refresh the quote before expiry.
- Payment Status Check: Allows checking the payment status by querying mempool.space for UTXOs.

## Style Guidelines:

- Primary color: Deep Purple (##10051c).
- Text color: White (#ffffff) to provide a clean and modern backdrop.
- Accent color: Yellow-Orange (#f6b30b) for fades and gradients with the purple and lighter tones of purple like #6a00ff if needed.
- Body and headline font: 'Inter' sans-serif for a modern, neutral look.
- Minimal, line-based icons for a clean and efficient user experience.
- Mobile-first, responsive layout to ensure accessibility on all devices.
- Subtle animations for loading states and user interactions to improve user experience.