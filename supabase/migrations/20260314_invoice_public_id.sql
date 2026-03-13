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
