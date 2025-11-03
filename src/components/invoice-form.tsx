'use client';

import { useEffect, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import { createInvoice } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { validate as validateBtcAddress } from 'bitcoin-address-validation';

const initialState = {
  error: null,
  details: {},
  token: null,
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      Create Invoice
    </Button>
  );
}

export function InvoiceForm() {
  const [state, formAction] = useActionState(createInvoice, initialState);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (state.token) {
      router.push(`/invoice#${state.token}`);
    }
    if (state.error && !state.token) {
      toast({
        variant: 'destructive',
        title: 'Error Creating Invoice',
        description: state.error,
      });
    }
  }, [state, router, toast]);

  const validateAddress = (addr: string) => {
    try { return validateBtcAddress(addr); } catch { return false; }
  };

  return (
    <form action={async (fd) => {
      const addr = String(fd.get("address") || "");
      if (!validateAddress(addr)) {
        toast({
            variant: "destructive",
            title: "Invalid Address",
            description: "Please enter a valid Bitcoin address.",
        });
        return;
      }
      formAction(fd);
    }}>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create Invoice</CardTitle>
          <CardDescription>Enter the details to generate a Bitcoin invoice link.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
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
            <Label htmlFor="address">Bitcoin Wallet Address</Label>
            <Input id="address" name="address" placeholder="Enter your Bitcoin address" required />
            {state.details?.address && <p className="text-sm text-destructive">{state.details.address[0]}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea id="description" name="description" placeholder="e.g., Coffee and cake" />
             {state.details?.description && <p className="text-sm text-destructive">{state.details.description[0]}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="expiresIn">Expires in (days, optional)</Label>
            <Input id="expiresIn" name="expiresIn" type="number" placeholder="Default: 7" min="1" />
            {state.details?.expiresIn && <p className="text-sm text-destructive">{state.details.expiresIn[0]}</p>}
          </div>
        </CardContent>
        <CardFooter>
          <SubmitButton />
        </CardFooter>
      </Card>
    </form>
  );
}
