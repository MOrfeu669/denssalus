create table public.registros_odontograma (
  id uuid primary key,
  clinica_id text not null,
  paciente_id uuid not null references public.pacientes (id),
  dente smallint not null,
  quadrante text not null,
  procedimento_id uuid not null references public.procedimentos (id),
  origem text not null,
  agendamento_id uuid references public.agendamentos (id),
  status text not null default 'confirmado',
  registrado_por uuid not null references public.usuarios (id),
  registrado_em timestamptz not null,
  constraint registros_odontograma_origem_check check (
    (origem = 'atendimento' and agendamento_id is not null)
    or (origem = 'pre_existente' and agendamento_id is null)
  ),
  constraint registros_odontograma_status_check check (status in ('confirmado', 'revertido')),
  constraint registros_odontograma_quadrante_check check (
    quadrante in ('superior_direito', 'superior_esquerdo', 'inferior_esquerdo', 'inferior_direito')
  )
);

create index registros_odontograma_clinica_id_idx on public.registros_odontograma (clinica_id);
create index registros_odontograma_paciente_id_idx on public.registros_odontograma (paciente_id);
create index registros_odontograma_agendamento_id_idx on public.registros_odontograma (agendamento_id);

alter table public.registros_odontograma enable row level security;

revoke all on table public.registros_odontograma from anon, authenticated;
grant select, insert, update, delete on table public.registros_odontograma to service_role;
