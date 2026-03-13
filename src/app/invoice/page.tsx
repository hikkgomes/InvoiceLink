import Link from 'next/link';

import { APP_NAME } from '@/lib/constants';

export default function InvoiceMissingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="absolute left-8 top-8 text-2xl font-bold text-foreground">
        <Link href="/">{APP_NAME}</Link>
      </div>
      <p className="text-sm text-muted-foreground">Invoice ID is missing from the URL.</p>
    </main>
  );
}
