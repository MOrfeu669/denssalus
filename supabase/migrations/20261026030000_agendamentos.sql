create extension if not exists btree_gist;

create table public.agendamentos (
  id uuid primary key default gen_random_uuid(),
  clinica_id text not null,
  paciente_id uuid not null references public.pacientes (id),
  dentista_id uuid not null references public.dentistas (id),
  cadeira_id uuid not null references public.cadeiras (id),
  procedimento_id uuid references public.procedimentos (id),
  inicio timestamptz not null,
  fim timestamptz not null,
  status text not null,
  iniciado_por uuid references public.usuarios (id),
  emergencia boolean not null default false,
  criado_por uuid not null references public.usuarios (id),
  alerta_cadeira boolean not null default false,
  alerta_horario boolean not null default false,
  alerta_dentista boolean not null default false,
  constraint agendamentos_status_check check (
    status in ('agendado', 'em_espera', 'iniciado', 'concluido', 'cancelado')
  ),
  constraint agendamentos_intervalo_check check (fim > inicio),
  constraint agendamentos_cadeira_excl
    exclude using gist (
      cadeira_id with =,
      tstzrange(inicio, fim, '[)') with &&
    ) where (emergencia = false and status in ('agendado', 'em_espera', 'iniciado')),
  constraint agendamentos_dentista_excl
    exclude using gist (
      dentista_id with =,
      tstzrange(inicio, fim, '[)') with &&
    ) where (emergencia = false and status in ('agendado', 'em_espera', 'iniciado')),
  constraint agendamentos_paciente_excl
    exclude using gist (
      paciente_id with =,
      tstzrange(inicio, fim, '[)') with &&
    ) where (emergencia = false and status in ('agendado', 'em_espera', 'iniciado'))
);

create index agendamentos_clinica_id_idx on public.agendamentos (clinica_id);

create index agendamentos_intervalo_idx
  on public.agendamentos
  using gist (tstzrange(inicio, fim, '[)'));

create table public.bloqueios_agenda (
  id uuid primary key default gen_random_uuid(),
  clinica_id text not null,
  dentista_id uuid not null references public.dentistas (id),
  inicio timestamptz not null,
  fim timestamptz not null,
  motivo text,
  criado_por uuid not null references public.usuarios (id),
  constraint bloqueios_agenda_intervalo_check check (fim > inicio)
);

create index bloqueios_agenda_clinica_id_idx on public.bloqueios_agenda (clinica_id);

alter table public.agendamentos enable row level security;
alter table public.bloqueios_agenda enable row level security;

revoke all on table public.agendamentos from anon, authenticated;
revoke all on table public.bloqueios_agenda from anon, authenticated;
grant select, insert, update, delete on table public.agendamentos to service_role;
grant select, insert, update, delete on table public.bloqueios_agenda to service_role;
