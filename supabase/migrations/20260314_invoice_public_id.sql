create extension if not exists pgcrypto;

alter table private.invoices
add column if not exists public_id text;

alter table private.invoices
alter column public_id set default encode(gen_random_bytes(12), 'hex');

update private.invoices
set public_id = encode(gen_random_bytes(12), 'hex')
where public_id is null or length(public_id) = 0;

alter table private.invoices
alter column public_id set not null;

create unique index if not exists invoices_public_id_key on private.invoices (public_id);
