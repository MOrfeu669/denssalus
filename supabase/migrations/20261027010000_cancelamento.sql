alter table public.agendamentos
  add column motivo_cancelamento text,
  add column cancelado_por uuid references public.usuarios (id),
  add column cancelado_em timestamptz;

alter table public.agendamentos
  add constraint agendamentos_cancelamento_check check (
    status <> 'cancelado'
    or (motivo_cancelamento is not null and cancelado_por is not null)
  );

create table public.avisos_recepcao (
  id uuid primary key default gen_random_uuid(),
  clinica_id text not null,
  agendamento_id uuid not null references public.agendamentos (id),
  paciente_id uuid not null,
  motivo text not null,
  criado_em timestamptz not null default now()
);

alter table public.avisos_recepcao enable row level security;

revoke all on table public.avisos_recepcao from anon, authenticated;
grant select, insert, update, delete on table public.avisos_recepcao to service_role;
