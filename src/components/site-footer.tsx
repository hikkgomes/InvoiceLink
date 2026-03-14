import Link from 'next/link';

import { ThemeToggle } from '@/components/theme-toggle';
import { APP_NAME, LEGAL_CONTACT_EMAIL } from '@/lib/constants';

export function SiteFooter() {
  return (
    <footer className="border-t border-border/50 bg-background/80">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-6 sm:px-6">
        <div className="max-w-2xl space-y-2 text-xs text-muted-foreground">
          <p>
            {APP_NAME} is non-custodial software infrastructure for Bitcoin invoicing. Funds move directly between payer and
            merchant wallets.
          </p>
          <p>
            Rates and blockchain data depend on third-party providers. No financial, tax, or legal advice. Contact:{' '}
            <a className="text-accent hover:underline" href={`mailto:${LEGAL_CONTACT_EMAIL}`}>
              {LEGAL_CONTACT_EMAIL}
            </a>
          </p>
        </div>

        <div className="flex items-end justify-between gap-4">
          <nav className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <Link className="hover:text-foreground" href="/legal">
              Legal
            </Link>
            <Link className="hover:text-foreground" href="/privacy">
              Privacy
            </Link>
            <Link className="hover:text-foreground" href="/terms">
              Terms
            </Link>
          </nav>

          <ThemeToggle compact />
        </div>
      </div>
    </footer>
  );
}
