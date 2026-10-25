create table public.clinicas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  admin_id uuid not null,
  dias_atendimento text[] not null,
  horario_abertura time not null,
  horario_fechamento time not null,
  constraint clinicas_admin_unique unique (admin_id),
  constraint clinicas_horario_check check (horario_abertura < horario_fechamento),
  constraint clinicas_dias_check check (
    dias_atendimento <@ array['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo']::text[]
  ),
  constraint clinicas_dias_nao_vazio_check check (cardinality(dias_atendimento) > 0)
);

create table public.cadeiras (
  id uuid primary key default gen_random_uuid(),
  clinica_id uuid not null references public.clinicas (id),
  identificacao text not null,
  ativa boolean not null default true,
  constraint cadeiras_identificacao_unique unique (clinica_id, identificacao)
);

alter table public.clinicas enable row level security;
alter table public.cadeiras enable row level security;

revoke all on table public.clinicas from anon, authenticated;
revoke all on table public.cadeiras from anon, authenticated;
grant select, insert, update, delete on table public.clinicas to service_role;
grant select, insert, update, delete on table public.cadeiras to service_role;
