create table public.dashboard_visibilidade (
  clinica_id text not null,
  papel text not null,
  campos_ocultos text[] not null,
  primary key (clinica_id, papel),
  constraint dashboard_visibilidade_papel_check check (papel in ('admin', 'dentista', 'recepcionista'))
);

create table public.dashboard_preferencia (
  usuario_id uuid primary key references public.usuarios (id),
  widgets_ocultos text[] not null,
  periodo text not null default 'mes'
);

alter table public.dashboard_visibilidade enable row level security;
alter table public.dashboard_preferencia enable row level security;

revoke all on table public.dashboard_visibilidade from anon, authenticated;
revoke all on table public.dashboard_preferencia from anon, authenticated;
grant select, insert, update on table public.dashboard_visibilidade to service_role;
grant select, insert, update on table public.dashboard_preferencia to service_role;
