'use client';

import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { validate as validateBtcAddress } from 'bitcoin-address-validation';

import { createInvoice, type CreateInvoiceState } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

const initialCreateInvoiceState: CreateInvoiceState = {
  error: null,
  details: {},
  invoiceUrl: null,
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={pending}>
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      Generate Invoice Link
    </Button>
  );
}

export function InvoiceForm() {
  const [state, formAction] = useActionState<CreateInvoiceState, FormData>(createInvoice, initialCreateInvoiceState);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (state.invoiceUrl) {
      router.push(state.invoiceUrl);
    }
    if (state.error && !state.invoiceUrl) {
      toast({
        variant: 'destructive',
        title: 'Error creating invoice',
        description: state.error,
      });
    }
  }, [state, router, toast]);

  const validateAddress = (address: string) => {
    try {
      return validateBtcAddress(address);
    } catch {
      return false;
    }
  };

  return (
    <form
      action={async (formData) => {
        const address = String(formData.get('address') || '');
        if (!validateAddress(address)) {
          toast({
            variant: 'destructive',
            title: 'Invalid address',
            description: 'Please enter a valid Bitcoin address.',
          });
          return;
        }

        formAction(formData);
      }}
    >
      <Card className="w-full border border-accent/30 bg-card/70 shadow-none">
        <CardHeader className="border-b border-accent/20 bg-secondary/30">
          <CardTitle>Create an invoice</CardTitle>
          <CardDescription>Instant, non-custodial request link for your client.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input id="amount" name="amount" type="number" placeholder="100.00" step="0.01" required />
            </div>
            <div className="col-span-1 space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select name="currency" defaultValue="USD">
                <SelectTrigger id="currency">
                  <SelectValue placeholder="Currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                  <SelectItem value="JPY">JPY</SelectItem>
                  <SelectItem value="CAD">CAD</SelectItem>
                  <SelectItem value="AUD">AUD</SelectItem>
                  <SelectItem value="CHF">CHF</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {state.details?.amount && <p className="text-sm text-destructive">{state.details.amount[0]}</p>}

          <div className="space-y-2">
            <Label htmlFor="address">Bitcoin wallet address</Label>
            <Input id="address" name="address" placeholder="bc1..." required />
            {state.details?.address && <p className="text-sm text-destructive">{state.details.address[0]}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea id="description" name="description" placeholder="e.g. Design retainer payment" />
            {state.details?.description && <p className="text-sm text-destructive">{state.details.description[0]}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="expiresIn">Invoice expiry in days (optional)</Label>
            <Input id="expiresIn" name="expiresIn" type="number" placeholder="Default: 7" min="1" />
            {state.details?.expiresIn && <p className="text-sm text-destructive">{state.details.expiresIn[0]}</p>}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-stretch gap-2">
          <SubmitButton />
          <p className="text-xs text-muted-foreground">
            Funds go wallet-to-wallet. NodeInvoice never takes custody of client balances.
          </p>
        </CardFooter>
      </Card>
    </form>
  );
}
