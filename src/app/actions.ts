'use server';

import { z } from 'zod';
import { createSignedToken, getBtcPrice, verifyAndDecodeToken } from '@/lib/invoice';
import { QUOTE_EXPIRY_MS, MEMPOOL_API_URL } from '@/lib/constants';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const invoiceSchema = z.object({
  amount: z.coerce.number().positive({ message: 'Amount must be positive.' }),
  currency: z.string().min(1, { message: 'Currency is required.' }),
  address: z.string().min(26, { message: 'Please enter a valid Bitcoin address.'}),
  description: z.string().max(100, { message: 'Description is too long.' }).optional(),
});

export async function createInvoice(prevState: any, formData: FormData) {
  const validatedFields = invoiceSchema.safeParse({
    amount: formData.get('amount'),
    currency: formData.get('currency'),
    address: formData.get('address'),
    description: formData.get('description'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Invalid form data.',
    };
  }

  const { amount, currency, description, address } = validatedFields.data;

  try {
    const btcPrice = await getBtcPrice(currency);
    const amountWithCushion = amount * 1.0099;
    const btcAmount = parseFloat((amountWithCushion / btcPrice).toFixed(8));
    const now = Date.now();

    const payload = {
      amount,
      currency,
      description: description || '',
      address,
      btcAmount,
      iat: now,
      exp: now + QUOTE_EXPIRY_MS,
    };

    const token = createSignedToken(payload);
    
    return { token };

  } catch (error) {
    console.error('Failed to create invoice:', error);
    return { message: 'Failed to create invoice. Please try again.' };
  }
}

export async function refreshQuote(token: string) {
  const oldPayload = verifyAndDecodeToken(token);
  if (!oldPayload) {
    throw new Error('Invalid token for refresh.');
  }

  const { amount, currency, description, address } = oldPayload;

  try {
    const btcPrice = await getBtcPrice(currency);
    const amountWithCushion = amount * 1.0099;
    const btcAmount = parseFloat((amountWithCushion / btcPrice).toFixed(8));
    const now = Date.now();

    const newPayload = {
      amount,
      currency,
      description,
      address,
      btcAmount,
      iat: now,
      exp: now + QUOTE_EXPIRY_MS,
    };
    
    const newToken = createSignedToken(newPayload);
    revalidatePath(`/invoice/${token}`);
    redirect(`/invoice/${newToken}`);

  } catch (error) {
    console.error('Failed to refresh quote:', error);
    throw new Error('Failed to refresh quote. Please try again.');
  }
}

interface Utxo {
    txid: string;
    vout: number;
    status: {
        confirmed: boolean;
        block_height: number | null;
        block_hash: string | null;
        block_time: number | null;
    };
    value: number;
}

export async function checkPaymentStatus(address: string, expectedAmount: number) {
    try {
        const res = await fetch(`${MEMPOOL_API_URL}/address/${address}/utxo`);
        if (!res.ok) {
            throw new Error(`Mempool API responded with status ${res.status}`);
        }
        const utxos: Utxo[] = await res.json();
        
        const expectedSatoshis = Math.round(expectedAmount * 1e8);

        const paymentUtxo = utxos.find(utxo => utxo.value >= expectedSatoshis && !utxo.status.confirmed);
        const confirmedUtxo = utxos.find(utxo => utxo.value >= expectedSatoshis && utxo.status.confirmed);
        
        if (confirmedUtxo) {
            return { status: 'confirmed', txid: confirmedUtxo.txid };
        }
        if (paymentUtxo) {
            return { status: 'detected', txid: paymentUtxo.txid };
        }
        return { status: 'pending' };

    } catch (error) {
        console.error("Error checking payment status:", error);
        return { status: 'error' };
    }
}
