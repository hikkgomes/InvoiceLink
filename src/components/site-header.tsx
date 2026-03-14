import Link from 'next/link';

import { ThemeToggle } from '@/components/theme-toggle';
import { APP_NAME } from '@/lib/constants';

interface SiteHeaderProps {
  showMarketingLinks?: boolean;
}

export function SiteHeader({ showMarketingLinks = false }: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="inline-flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground">
          <span className="inline-flex h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_22px_rgba(34,211,238,0.75)]" />
          {APP_NAME}
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          {showMarketingLinks ? (
            <>
              <a href="#how-it-works" className="hidden text-sm text-muted-foreground transition hover:text-foreground sm:inline">
                How it works
              </a>
              <a href="#risk-notes" className="hidden text-sm text-muted-foreground transition hover:text-foreground sm:inline">
                Risk notes
              </a>
            </>
          ) : null}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
