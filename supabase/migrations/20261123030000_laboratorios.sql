create table public.laboratorios (
  id uuid primary key,
  clinica_id text not null,
  nome text not null,
  constraint laboratorios_clinica_nome_key unique (clinica_id, nome)
);

create index laboratorios_clinica_id_idx on public.laboratorios (clinica_id);

alter table public.laboratorios enable row level security;

revoke all on table public.laboratorios from anon, authenticated;
grant select, insert, update, delete on table public.laboratorios to service_role;

alter table public.proteses
  add column laboratorio_id uuid references public.laboratorios (id);
