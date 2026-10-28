create table public.anamneses (
  paciente_id uuid primary key references public.pacientes (id),
  conteudo text not null,
  preenchido_por uuid not null,
  atualizado_em timestamptz not null
);

create table public.evolucoes (
  agendamento_id uuid primary key references public.agendamentos (id),
  texto text not null,
  registrado_por uuid not null,
  registrado_em timestamptz not null
);

create table public.auditoria (
  id uuid primary key,
  clinica_id text not null,
  entidade text not null,
  entidade_id text not null,
  usuario_id uuid not null,
  acao text not null,
  conteudo_anterior text,
  registrado_em timestamptz not null,
  constraint auditoria_entidade_check check (
    entidade in ('anamnese', 'evolucao', 'documento', 'odontograma')
  ),
  constraint auditoria_acao_check check (acao in ('criacao', 'edicao'))
);

create index auditoria_clinica_id_idx on public.auditoria (clinica_id);

alter table public.agendamentos add column concluido_em timestamptz;

alter table public.anamneses enable row level security;
alter table public.evolucoes enable row level security;
alter table public.auditoria enable row level security;

revoke all on table public.anamneses from anon, authenticated;
revoke all on table public.evolucoes from anon, authenticated;
revoke all on table public.auditoria from anon, authenticated;
grant select, insert, update, delete on table public.anamneses to service_role;
grant select, insert, update, delete on table public.evolucoes to service_role;
grant select, insert, update, delete on table public.auditoria to service_role;
