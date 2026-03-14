'use client';

import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useActionState, useEffect } from 'react';
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
import { type I18nMessages, type Locale } from '@/lib/i18n';

const initialCreateInvoiceState: CreateInvoiceState = {
  error: null,
  details: {},
  invoiceUrl: null,
};

interface SubmitButtonProps {
  label: string;
}

function SubmitButton({ label }: SubmitButtonProps) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={pending}>
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      {label}
    </Button>
  );
}

interface InvoiceFormProps {
  locale: Locale;
  messages: I18nMessages['form'];
}

export function InvoiceForm({ locale, messages }: InvoiceFormProps) {
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
        title: messages.errors.createTitle,
        description: messages.errors.createDescription,
      });
    }
  }, [state, router, toast, messages]);

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
            title: messages.errors.invalidAddressTitle,
            description: messages.errors.invalidAddressDescription,
          });
          return;
        }

        formAction(formData);
      }}
    >
      <input type="hidden" name="lang" value={locale} />
      <Card className="w-full border border-accent/30 bg-card/70 shadow-none">
        <CardHeader className="border-b border-accent/20 bg-secondary/30 pb-4">
          <CardTitle>{messages.title}</CardTitle>
          <CardDescription>{messages.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="amount">{messages.amountLabel}</Label>
              <Input id="amount" name="amount" type="number" placeholder="100.00" step="0.01" required />
            </div>
            <div className="col-span-1 space-y-2">
              <Label htmlFor="currency">{messages.currencyLabel}</Label>
              <Select name="currency" defaultValue="USD">
                <SelectTrigger id="currency">
                  <SelectValue placeholder={messages.currencyLabel} />
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
            <Label htmlFor="address">{messages.addressLabel}</Label>
            <Input id="address" name="address" placeholder={messages.addressPlaceholder} required />
            {state.details?.address && <p className="text-sm text-destructive">{state.details.address[0]}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{messages.descriptionLabel}</Label>
            <Textarea id="description" name="description" placeholder={messages.descriptionPlaceholder} />
            {state.details?.description && <p className="text-sm text-destructive">{state.details.description[0]}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="expiresIn">{messages.expiresLabel}</Label>
            <Input id="expiresIn" name="expiresIn" type="number" placeholder={messages.expiresPlaceholder} min="1" />
            {state.details?.expiresIn && <p className="text-sm text-destructive">{state.details.expiresIn[0]}</p>}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-stretch gap-2">
          <SubmitButton label={messages.submitLabel} />
          <p className="text-xs text-muted-foreground">{messages.footnote}</p>
        </CardFooter>
      </Card>
    </form>
  );
}
