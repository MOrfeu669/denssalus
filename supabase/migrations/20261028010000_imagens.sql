-- Bucket privado. A leitura do arquivo é por URL assinada; não há policy em storage.objects.
insert into storage.buckets (id, name, public, file_size_limit)
values ('prontuario-imagens', 'prontuario-imagens', false, 20971520)
on conflict (id) do update
set public = false,
    file_size_limit = 20971520;

create table public.imagens_prontuario (
  id uuid primary key,
  clinica_id text not null,
  paciente_id uuid not null references public.pacientes (id),
  agendamento_id uuid references public.agendamentos (id),
  dente integer,
  tipo_caso text not null,
  descricao text not null,
  caminho text not null,
  tamanho_bytes integer not null,
  adicionado_por uuid not null references public.usuarios (id),
  adicionado_em timestamptz not null,
  excluido_em timestamptz,
  remocao_definitiva_em timestamptz,
  constraint imagens_prontuario_tamanho_check check (tamanho_bytes > 0 and tamanho_bytes <= 20971520)
);

create index imagens_prontuario_clinica_id_idx on public.imagens_prontuario (clinica_id);
create index imagens_prontuario_paciente_id_idx on public.imagens_prontuario (paciente_id);

alter table public.imagens_prontuario enable row level security;

revoke all on table public.imagens_prontuario from anon, authenticated;
grant select, insert, update, delete on table public.imagens_prontuario to service_role;
