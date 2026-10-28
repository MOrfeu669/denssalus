create table public.planos_tratamento (
  id uuid primary key,
  clinica_id text not null,
  paciente_id uuid not null references public.pacientes (id),
  criado_por uuid not null references public.usuarios (id),
  status text not null default 'proposto',
  criado_em timestamptz not null,
  constraint planos_tratamento_status_check check (status in ('proposto', 'em_andamento', 'concluido'))
);

create table public.itens_plano (
  id uuid primary key,
  plano_id uuid not null references public.planos_tratamento (id),
  clinica_id text not null,
  procedimento_id uuid not null references public.procedimentos (id),
  dentes smallint[] not null,
  valor numeric not null,
  agendamento_id uuid references public.agendamentos (id),
  status text not null default 'pendente',
  executado_por uuid references public.usuarios (id),
  concluido_em timestamptz,
  constraint itens_plano_status_check check (status in ('pendente', 'concluido')),
  constraint itens_plano_dentes_check check (cardinality(dentes) >= 1),
  constraint itens_plano_valor_check check (valor >= 0),
  constraint itens_plano_conclusao_check check (
    (status = 'pendente' and executado_por is null and concluido_em is null)
    or (status = 'concluido' and executado_por is not null and concluido_em is not null)
  )
);

create index planos_tratamento_clinica_id_idx on public.planos_tratamento (clinica_id);
create index planos_tratamento_paciente_id_idx on public.planos_tratamento (paciente_id);
create index itens_plano_plano_id_idx on public.itens_plano (plano_id);
create index itens_plano_clinica_id_idx on public.itens_plano (clinica_id);
create index itens_plano_agendamento_id_idx on public.itens_plano (agendamento_id);

alter table public.planos_tratamento enable row level security;
alter table public.itens_plano enable row level security;

revoke all on table public.planos_tratamento from anon, authenticated;
revoke all on table public.itens_plano from anon, authenticated;
grant select, insert, update on table public.planos_tratamento to service_role;
grant select, insert, update on table public.itens_plano to service_role;
