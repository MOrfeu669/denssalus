create table public.debitos (
  id uuid primary key,
  clinica_id text not null,
  paciente_id uuid not null references public.pacientes (id),
  origem text not null,
  item_plano_id uuid references public.itens_plano (id),
  agendamento_id uuid not null references public.agendamentos (id),
  valor numeric not null,
  desconto numeric not null default 0,
  desconto_por uuid references public.usuarios (id),
  status text not null default 'em_aberto',
  constraint debitos_origem_check check (origem in ('item_plano', 'procedimento_avulso')),
  constraint debitos_valor_check check (valor >= 0),
  constraint debitos_desconto_check check (desconto >= 0 and desconto <= valor),
  constraint debitos_status_check check (status in ('em_aberto', 'quitado'))
);

create table public.pagamentos (
  id uuid primary key,
  debito_id uuid not null unique references public.debitos (id),
  forma text not null,
  data date not null,
  registrado_por uuid not null references public.usuarios (id),
  constraint pagamentos_forma_check check (forma in ('dinheiro', 'pix', 'cartao_debito', 'cartao_credito', 'boleto', 'cheque'))
);

create unique index debitos_item_plano_id_key on public.debitos (item_plano_id) where item_plano_id is not null;
create unique index debitos_agendamento_avulso_key on public.debitos (agendamento_id) where origem = 'procedimento_avulso';
create index debitos_clinica_id_idx on public.debitos (clinica_id);
create index debitos_paciente_id_idx on public.debitos (paciente_id);
create index debitos_agendamento_id_idx on public.debitos (agendamento_id);

alter table public.debitos enable row level security;
alter table public.pagamentos enable row level security;

revoke all on table public.debitos from anon, authenticated;
revoke all on table public.pagamentos from anon, authenticated;
grant select, insert, update on table public.debitos to service_role;
grant select, insert on table public.pagamentos to service_role;
