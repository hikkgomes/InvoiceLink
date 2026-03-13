import { createHash, randomBytes } from "node:crypto";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { getInvoiceKeyPepper, getSupabaseServerEnv } from "@/lib/env.server";
import { type InvoicePayload, type PersistedInvoiceStatus } from "@/lib/invoice";

const INVOICES_SCHEMA = "private";
const INVOICES_TABLE = "invoices";
const ACCESS_KEY_BYTES = 18;

type InvoiceRow = {
  id: number;
  public_id: string;
  access_key_hash: string;
  amount_fiat: number | string;
  currency: string;
  description: string;
  address: string;
  amount_sats: number | string;
  amount_usd: number | string;
  invoice_created_at: string;
  quote_expires_at: string;
  invoice_expires_at: string;
  status: string;
  txid: string | null;
};

export type CreateStoredInvoiceInput = {
  amountFiat: number;
  currency: string;
  description: string;
  address: string;
  amountSats: number;
  amountUsd: number;
  invoiceCreatedAt: number;
  quoteExpiresAt: number;
  invoiceExpiresAt: number;
};

let supabaseAdmin: SupabaseClient | null = null;

function getSupabaseAdminClient() {
  if (supabaseAdmin) return supabaseAdmin;

  const env = getSupabaseServerEnv();
  supabaseAdmin = createClient(env.url, env.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  return supabaseAdmin;
}

function toNumber(value: number | string, field: string): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid numeric value for ${field}`);
  }
  return parsed;
}

function toEpochMs(value: string, field: string): number {
  const parsed = new Date(value).getTime();
  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid timestamp for ${field}`);
  }
  return parsed;
}

function toPersistedStatus(value: string): PersistedInvoiceStatus {
  if (value === "pending" || value === "detected" || value === "confirmed" || value === "expired" || value === "error") {
    return value;
  }
  return "error";
}

function rowToInvoicePayload(row: InvoiceRow): InvoicePayload {
  return {
    invoiceId: row.public_id,
    amountFiat: toNumber(row.amount_fiat, "amount_fiat"),
    currency: row.currency,
    description: row.description || "",
    address: row.address,
    amountSats: toNumber(row.amount_sats, "amount_sats"),
    amountUsd: toNumber(row.amount_usd, "amount_usd"),
    invoiceCreatedAt: toEpochMs(row.invoice_created_at, "invoice_created_at"),
    quoteExpiresAt: toEpochMs(row.quote_expires_at, "quote_expires_at"),
    invoiceExpiresAt: toEpochMs(row.invoice_expires_at, "invoice_expires_at"),
    status: toPersistedStatus(row.status),
    txId: row.txid,
  };
}

export function generateInvoiceAccessKey(): string {
  return randomBytes(ACCESS_KEY_BYTES).toString("base64url");
}

export function hashInvoiceAccessKey(accessKey: string): string {
  return createHash("sha256").update(`${accessKey}:${getInvoiceKeyPepper()}`).digest("hex");
}

export function buildInvoiceUrl(invoiceId: string, accessKey: string): string {
  const key = encodeURIComponent(accessKey);
  return `/invoice/${invoiceId}?k=${key}`;
}

export async function createStoredInvoice(input: CreateStoredInvoiceInput): Promise<{ invoice: InvoicePayload; accessKey: string }> {
  const accessKey = generateInvoiceAccessKey();
  const accessKeyHash = hashInvoiceAccessKey(accessKey);

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .schema(INVOICES_SCHEMA)
    .from(INVOICES_TABLE)
    .insert({
      access_key_hash: accessKeyHash,
      amount_fiat: input.amountFiat,
      currency: input.currency,
      description: input.description,
      address: input.address,
      amount_sats: input.amountSats,
      amount_usd: input.amountUsd,
      invoice_created_at: new Date(input.invoiceCreatedAt).toISOString(),
      quote_expires_at: new Date(input.quoteExpiresAt).toISOString(),
      invoice_expires_at: new Date(input.invoiceExpiresAt).toISOString(),
      status: "pending",
      txid: null,
    })
    .select("*")
    .single<InvoiceRow>();

  if (error || !data) {
    throw new Error(`Failed to create invoice row: ${error?.message || "missing data"}`);
  }

  return {
    invoice: rowToInvoicePayload(data),
    accessKey,
  };
}

export async function getStoredInvoiceByAccessKey(invoiceId: string, accessKey: string): Promise<InvoicePayload | null> {
  const accessKeyHash = hashInvoiceAccessKey(accessKey);

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .schema(INVOICES_SCHEMA)
    .from(INVOICES_TABLE)
    .select("*")
    .eq("public_id", invoiceId)
    .eq("access_key_hash", accessKeyHash)
    .maybeSingle<InvoiceRow>();

  if (error) {
    throw new Error(`Failed to load invoice row: ${error.message}`);
  }
  if (!data) return null;

  return rowToInvoicePayload(data);
}

export async function updateStoredInvoiceQuote(
  invoiceId: string,
  quote: { amountSats: number; amountUsd: number; quoteExpiresAt: number },
): Promise<InvoicePayload> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .schema(INVOICES_SCHEMA)
    .from(INVOICES_TABLE)
    .update({
      amount_sats: quote.amountSats,
      amount_usd: quote.amountUsd,
      quote_expires_at: new Date(quote.quoteExpiresAt).toISOString(),
    })
    .eq("public_id", invoiceId)
    .select("*")
    .single<InvoiceRow>();

  if (error || !data) {
    throw new Error(`Failed to update invoice quote: ${error?.message || "missing data"}`);
  }

  return rowToInvoicePayload(data);
}

export async function setStoredInvoiceStatus(
  invoiceId: string,
  status: PersistedInvoiceStatus,
  txId?: string | null,
): Promise<InvoicePayload> {
  const patch: { status: PersistedInvoiceStatus; txid?: string | null } = { status };
  if (typeof txId !== "undefined") patch.txid = txId;

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .schema(INVOICES_SCHEMA)
    .from(INVOICES_TABLE)
    .update(patch)
    .eq("public_id", invoiceId)
    .select("*")
    .single<InvoiceRow>();

  if (error || !data) {
    throw new Error(`Failed to update invoice status: ${error?.message || "missing data"}`);
  }

  return rowToInvoicePayload(data);
}
