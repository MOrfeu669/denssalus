create table public.proteses (
  id uuid primary key,
  clinica_id text not null,
  paciente_id uuid not null references public.pacientes (id),
  dentes smallint[] not null,
  tipo text not null,
  responsavel_id uuid not null references public.dentistas (id),
  laboratorio text not null,
  procedimento_avaliacao_id uuid references public.procedimentos (id),
  procedimento_cirurgia_id uuid references public.procedimentos (id),
  agendamento_instalacao_id uuid references public.agendamentos (id),
  etapa text not null,
  status text not null,
  prazo_retorno date,
  ajuste_necessario text,
  valor_comissao numeric(12, 2),
  alerta_atraso boolean not null default false,
  historico jsonb not null,
  constraint proteses_dentes_check check (cardinality(dentes) > 0),
  constraint proteses_etapa_check check (etapa in ('pre_envio', 'envio_acompanhamento', 'recebimento_conferencia', 'instalacao')),
  constraint proteses_status_check check (status in ('em_andamento', 'concluida', 'descontinuada')),
  constraint proteses_comissao_check check (valor_comissao is null or valor_comissao >= 0)
);

create index proteses_clinica_id_idx on public.proteses (clinica_id);
create index proteses_paciente_id_idx on public.proteses (paciente_id);

create table public.protese_config (
  clinica_id text primary key,
  dias_limite_atraso integer not null,
  constraint protese_config_dias_check check (dias_limite_atraso between 15 and 30)
);

create table public.avisos_protese (
  id uuid primary key,
  clinica_id text not null,
  protese_id uuid not null unique references public.proteses (id),
  tipo text not null,
  criado_em timestamptz not null,
  constraint avisos_protese_tipo_check check (tipo = 'atraso_protese')
);

alter table public.proteses enable row level security;
alter table public.protese_config enable row level security;
alter table public.avisos_protese enable row level security;

revoke all on table public.proteses from anon, authenticated;
revoke all on table public.protese_config from anon, authenticated;
revoke all on table public.avisos_protese from anon, authenticated;
grant select, insert, update on table public.proteses to service_role;
grant select, insert, update, delete on table public.protese_config to service_role;
grant select, insert, update, delete on table public.avisos_protese to service_role;
