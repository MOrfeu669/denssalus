create table public.pacientes (
  id uuid primary key default gen_random_uuid(),
  clinica_id text not null,
  nome text not null,
  cpf text,
  endereco text,
  data_nascimento date,
  sexo text,
  responsavel_nome text,
  responsavel_cpf text,
  responsavel_telefone text,
  canais jsonb not null,
  constraint pacientes_sexo_check check (sexo is null or sexo in ('masculino', 'feminino', 'outro')),
  constraint pacientes_responsavel_check check (
    (responsavel_nome is null and responsavel_cpf is null)
    or (responsavel_nome is not null and responsavel_cpf is not null)
  )
);

create unique index pacientes_clinica_cpf_unique
  on public.pacientes (clinica_id, cpf)
  where cpf is not null;

create index pacientes_clinica_id_idx on public.pacientes (clinica_id);

alter table public.pacientes enable row level security;

revoke all on table public.pacientes from anon, authenticated;
grant select, insert, update, delete on table public.pacientes to service_role;
