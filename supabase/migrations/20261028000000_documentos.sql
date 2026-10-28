create table public.modelos_documento (
  id uuid primary key,
  clinica_id text not null,
  criado_por uuid references public.usuarios (id),
  compartilhado boolean not null,
  nome text not null,
  tipo text not null,
  conteudo text not null,
  constraint modelos_documento_clinica_nome_key unique (clinica_id, nome),
  constraint modelos_documento_tipo_check check (tipo in ('padrao', 'personalizado'))
);

create table public.documentos_gerados (
  id uuid primary key,
  clinica_id text not null,
  modelo_id uuid not null references public.modelos_documento (id),
  paciente_id uuid not null references public.pacientes (id),
  anterior_id uuid references public.documentos_gerados (id),
  conteudo_final text not null,
  pdf bytea not null,
  assinatura text not null,
  gerado_por uuid not null references public.usuarios (id),
  gerado_em timestamptz not null
);

create table public.modelos_importados (
  modelo_id uuid references public.modelos_documento (id),
  usuario_id uuid references public.usuarios (id),
  primary key (modelo_id, usuario_id)
);

create index modelos_documento_clinica_id_idx on public.modelos_documento (clinica_id);
create index documentos_gerados_clinica_id_idx on public.documentos_gerados (clinica_id);
create index documentos_gerados_paciente_id_idx on public.documentos_gerados (paciente_id);

alter table public.modelos_documento enable row level security;
alter table public.documentos_gerados enable row level security;
alter table public.modelos_importados enable row level security;

revoke all on table public.modelos_documento from anon, authenticated;
revoke all on table public.documentos_gerados from anon, authenticated;
revoke all on table public.modelos_importados from anon, authenticated;
grant select, insert on table public.modelos_documento to service_role;
grant select, insert on table public.documentos_gerados to service_role;
grant select, insert on table public.modelos_importados to service_role;
