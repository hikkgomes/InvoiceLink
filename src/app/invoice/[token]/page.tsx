import { verifyAndDecodeToken } from '@/lib/invoice';
import { InvoiceDisplay } from '@/components/invoice-display';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { APP_NAME } from '@/lib/constants';

type InvoicePageProps = {
  params: {
    token: string;
  };
};

export default async function InvoicePage({ params }: InvoicePageProps) {
  const { token } = params;
  const invoice = verifyAndDecodeToken(token);

  if (!invoice) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4">
        <Card className="w-full max-w-sm text-center">
          <CardHeader>
            <CardTitle className="flex items-center justify-center gap-2">
              <AlertTriangle className="h-6 w-6 text-destructive" />
              Invalid Invoice
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">This invoice link is invalid or has been tampered with.</p>
            <Button asChild className="mt-4">
                <Link href="/">Create a New Invoice</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
       <div className="absolute top-8 left-8 text-2xl font-bold text-foreground">
        <Link href="/">{APP_NAME}</Link>
      </div>
      <InvoiceDisplay invoice={invoice} token={token} />
    </main>
  );
}
