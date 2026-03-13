-- InvoiceLink MVP schema
-- Run this in Supabase SQL editor.

create schema if not exists private;

create table if not exists private.invoices (
  id bigint generated always as identity primary key,
  public_id text not null unique default md5(random()::text || clock_timestamp()::text),
  access_key_hash text not null,
  amount_fiat numeric not null check (amount_fiat > 0),
  currency text not null,
  description text not null default '',
  address text not null,
  amount_sats bigint not null check (amount_sats > 0),
  amount_usd numeric not null check (amount_usd > 0),
  invoice_created_at timestamptz not null,
  quote_expires_at timestamptz not null,
  invoice_expires_at timestamptz not null,
  status text not null default 'pending' check (status in ('pending', 'detected', 'confirmed', 'expired', 'error')),
  txid text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table private.invoices
add column if not exists public_id text;

alter table private.invoices
alter column public_id set default md5(random()::text || clock_timestamp()::text);

update private.invoices
set public_id = md5(random()::text || clock_timestamp()::text || id::text)
where public_id is null or length(public_id) = 0;

alter table private.invoices
alter column public_id set not null;

create unique index if not exists invoices_public_id_key on private.invoices (public_id);
create index if not exists invoices_status_idx on private.invoices (status);
create index if not exists invoices_quote_expires_idx on private.invoices (quote_expires_at);
create index if not exists invoices_invoice_expires_idx on private.invoices (invoice_expires_at);

create or replace function private.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_invoices_updated_at on private.invoices;
create trigger trg_invoices_updated_at
before update on private.invoices
for each row
execute function private.set_updated_at();

revoke all on schema private from anon, authenticated;
revoke all on table private.invoices from anon, authenticated;

grant usage on schema private to service_role;
grant select, insert, update on table private.invoices to service_role;
grant usage, select on sequence private.invoices_id_seq to service_role;
