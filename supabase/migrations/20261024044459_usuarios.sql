create table public.usuarios (
  id uuid primary key,
  nome text not null,
  email text not null,
  papel text not null,
  clinica_id text not null,
  ativo boolean not null default true,
  constraint usuarios_papel_check check (papel in ('admin', 'dentista', 'recepcionista')),
  constraint usuarios_email_unique unique (email)
);

create index usuarios_clinica_id_idx on public.usuarios (clinica_id);

alter table public.usuarios enable row level security;

revoke all on table public.usuarios from anon, authenticated;
grant select, insert, update, delete on table public.usuarios to service_role;
