create table public.retornos (
  id uuid primary key,
  clinica_id text not null,
  paciente_id uuid not null,
  dentista_id uuid not null,
  agendamento_origem_id uuid not null unique references public.agendamentos (id),
  marcado_por uuid not null references public.usuarios (id),
  data_prevista date not null,
  status text not null,
  constraint retornos_status_check check (status in ('pendente', 'notificado', 'reagendado'))
);

create index retornos_clinica_id_idx on public.retornos (clinica_id);

create table public.retorno_config (
  clinica_id text primary key,
  dias_antecedencia integer not null,
  constraint retorno_config_dias_antecedencia_check check (dias_antecedencia > 0)
);

alter table public.retornos enable row level security;
alter table public.retorno_config enable row level security;

revoke all on table public.retornos from anon, authenticated;
revoke all on table public.retorno_config from anon, authenticated;
grant select, insert, update, delete on table public.retornos to service_role;
grant select, insert, update, delete on table public.retorno_config to service_role;
