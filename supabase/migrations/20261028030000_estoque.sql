create table public.materiais (
  id uuid primary key,
  clinica_id text not null,
  nome text not null,
  quantidade_minima integer not null,
  constraint materiais_quantidade_minima_check check (quantidade_minima >= 0),
  constraint materiais_clinica_nome_unique unique (clinica_id, nome)
);

create index materiais_clinica_id_idx on public.materiais (clinica_id);

create table public.lotes_material (
  id uuid primary key,
  material_id uuid not null references public.materiais (id),
  quantidade integer not null,
  validade date not null,
  criado_em timestamptz not null,
  constraint lotes_material_quantidade_check check (quantidade >= 0)
);

create index lotes_material_material_id_idx on public.lotes_material (material_id);

create table public.procedimento_materiais (
  procedimento_id uuid not null references public.procedimentos (id),
  material_id uuid not null references public.materiais (id),
  quantidade integer not null,
  primary key (procedimento_id, material_id),
  constraint procedimento_materiais_quantidade_check check (quantidade > 0)
);

create table public.movimentacoes_estoque (
  id uuid primary key,
  clinica_id text not null,
  material_id uuid not null references public.materiais (id),
  lote_id uuid not null references public.lotes_material (id),
  tipo text not null,
  quantidade integer not null,
  usuario_id uuid references public.usuarios (id),
  agendamento_id uuid references public.agendamentos (id),
  registrado_em timestamptz not null,
  constraint movimentacoes_estoque_tipo_check check (tipo in ('entrada', 'baixa', 'vencimento')),
  constraint movimentacoes_estoque_quantidade_check check (quantidade > 0),
  constraint movimentacoes_estoque_usuario_check check (
    (tipo = 'vencimento' and usuario_id is null)
    or (tipo <> 'vencimento' and usuario_id is not null)
  ),
  constraint movimentacoes_estoque_agendamento_check check (
    (tipo = 'baixa' and agendamento_id is not null)
    or (tipo <> 'baixa' and agendamento_id is null)
  )
);

create index movimentacoes_estoque_material_id_idx on public.movimentacoes_estoque (material_id);
create index movimentacoes_estoque_clinica_id_idx on public.movimentacoes_estoque (clinica_id);

create table public.avisos_estoque (
  id uuid primary key,
  clinica_id text not null,
  material_id uuid not null references public.materiais (id),
  tipo text not null,
  texto text not null,
  constraint avisos_estoque_tipo_check check (tipo in ('estoque_minimo', 'estoque_insuficiente'))
);

create unique index avisos_estoque_minimo_unique
  on public.avisos_estoque (material_id)
  where tipo = 'estoque_minimo';

alter table public.materiais enable row level security;
alter table public.lotes_material enable row level security;
alter table public.procedimento_materiais enable row level security;
alter table public.movimentacoes_estoque enable row level security;
alter table public.avisos_estoque enable row level security;

revoke all on table public.materiais from anon, authenticated;
revoke all on table public.lotes_material from anon, authenticated;
revoke all on table public.procedimento_materiais from anon, authenticated;
revoke all on table public.movimentacoes_estoque from anon, authenticated;
revoke all on table public.avisos_estoque from anon, authenticated;

grant select, insert, update on table public.materiais to service_role;
grant select, insert, update on table public.lotes_material to service_role;
grant select, insert, update on table public.procedimento_materiais to service_role;
grant select, insert on table public.movimentacoes_estoque to service_role;
grant select, insert on table public.avisos_estoque to service_role;
