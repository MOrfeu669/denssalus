create table public.dentistas (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.usuarios (id),
  clinica_id text not null,
  nome text not null,
  cro text not null,
  telefone text not null,
  cpf text not null,
  especialidades text[] not null default '{}',
  ativo boolean not null default true,
  constraint dentistas_usuario_unique unique (usuario_id)
);

create index dentistas_clinica_id_idx on public.dentistas (clinica_id);

alter table public.dentistas enable row level security;

revoke all on table public.dentistas from anon, authenticated;
grant select, insert, update, delete on table public.dentistas to service_role;
