import { InvoiceForm } from '@/components/invoice-form';
import { APP_NAME } from '@/lib/constants';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
       <div className="absolute top-8 left-8 text-2xl font-bold text-foreground">
        {APP_NAME}
      </div>
      <InvoiceForm />
    </main>
  );
}
