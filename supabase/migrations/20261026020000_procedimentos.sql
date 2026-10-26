create table public.procedimentos (
  id uuid primary key default gen_random_uuid(),
  clinica_id text not null,
  nome text not null,
  tempo_medio_minutos integer not null,
  valor_medio numeric(12, 2) not null,
  constraint procedimentos_tempo_check check (tempo_medio_minutos > 0),
  constraint procedimentos_valor_check check (valor_medio >= 0)
);

create index procedimentos_clinica_id_idx on public.procedimentos (clinica_id);

alter table public.procedimentos enable row level security;

revoke all on table public.procedimentos from anon, authenticated;
grant select, insert, update, delete on table public.procedimentos to service_role;
