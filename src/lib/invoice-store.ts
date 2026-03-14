import { createHash, randomBytes } from "node:crypto";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { getInvoiceKeyPepper, getSupabaseServerEnv } from "@/lib/env.server";
import { DEFAULT_LOCALE, resolveLocale } from "@/lib/i18n";
import { type InvoicePayload, type PersistedInvoiceStatus } from "@/lib/invoice";

const INVOICES_SCHEMA = "private";
const INVOICES_TABLE = "invoices";
const ACCESS_KEY_BYTES = 18;

export type InvoiceStoreErrorCode =
  | "invalid_numeric"
  | "invalid_timestamp"
  | "row_decode_failed"
  | "insert_failed"
  | "read_failed"
  | "quote_update_failed"
  | "status_update_failed";

export class InvoiceStoreError extends Error {
  readonly code: InvoiceStoreErrorCode;
  readonly operation: string;
  override readonly cause?: unknown;

  constructor(code: InvoiceStoreErrorCode, operation: string, cause?: unknown) {
    super(`Invoice store operation failed: ${operation}`);
    this.name = "InvoiceStoreError";
    this.code = code;
    this.operation = operation;
    this.cause = cause;
  }
}

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

function asInvoiceStoreError(
  code: InvoiceStoreErrorCode,
  operation: string,
  error: unknown,
): InvoiceStoreError {
  if (error instanceof InvoiceStoreError) return error;
  return new InvoiceStoreError(code, operation, error);
}

function toNumber(value: number | string, field: string): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) {
    throw new InvoiceStoreError("invalid_numeric", `decode_${field}`);
  }
  return parsed;
}

function toEpochMs(value: string, field: string): number {
  const parsed = new Date(value).getTime();
  if (!Number.isFinite(parsed)) {
    throw new InvoiceStoreError("invalid_timestamp", `decode_${field}`);
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
  try {
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
  } catch (error) {
    throw asInvoiceStoreError("row_decode_failed", "row_to_payload", error);
  }
}

export function generateInvoiceAccessKey(): string {
  return randomBytes(ACCESS_KEY_BYTES).toString("base64url");
}

export function hashInvoiceAccessKey(accessKey: string): string {
  return createHash("sha256").update(`${accessKey}:${getInvoiceKeyPepper()}`).digest("hex");
}

export function buildInvoiceUrl(invoiceId: string, accessKey: string, rawLocale?: string | null): string {
  const params = new URLSearchParams({ k: accessKey });
  if (rawLocale) {
    const locale = resolveLocale(rawLocale);
    if (locale !== DEFAULT_LOCALE) {
      params.set("lang", locale);
    }
  }

  return `/invoice/${invoiceId}?${params.toString()}`;
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
    throw new InvoiceStoreError("insert_failed", "create_invoice", error || "missing_data");
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
    throw new InvoiceStoreError("read_failed", "load_invoice", error);
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
    throw new InvoiceStoreError("quote_update_failed", "update_quote", error || "missing_data");
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
    throw new InvoiceStoreError("status_update_failed", "update_status", error || "missing_data");
  }

  return rowToInvoicePayload(data);
}
