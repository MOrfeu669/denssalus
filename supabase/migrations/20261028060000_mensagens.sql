create table public.modelos_mensagem (
  clinica_id text not null,
  tipo text not null,
  conteudo text not null,
  primary key (clinica_id, tipo),
  constraint modelos_mensagem_tipo_check check (tipo in ('confirmacao_agendamento', 'lembrete_24h', 'lembrete_5h'))
);

create table public.mensagens_externas (
  id uuid primary key,
  clinica_id text not null,
  paciente_id uuid not null references public.pacientes (id),
  agendamento_id uuid not null references public.agendamentos (id),
  tipo text not null,
  canal text not null,
  contato text not null,
  texto text not null,
  status text not null,
  tentativas integer not null,
  programado_para timestamptz not null,
  enviado_em timestamptz,
  constraint mensagens_externas_tipo_check check (tipo in ('confirmacao_agendamento', 'lembrete_24h', 'lembrete_5h')),
  constraint mensagens_externas_canal_check check (canal in ('sms', 'email', 'whatsapp')),
  constraint mensagens_externas_status_check check (status in ('pendente', 'enviado', 'falhou')),
  constraint mensagens_externas_agendamento_tipo_unique unique (agendamento_id, tipo)
);

create index mensagens_externas_clinica_id_idx
  on public.mensagens_externas (clinica_id);

alter table public.modelos_mensagem enable row level security;
alter table public.mensagens_externas enable row level security;

revoke all on table public.modelos_mensagem from anon, authenticated;
revoke all on table public.mensagens_externas from anon, authenticated;

grant select, insert, update on table public.modelos_mensagem to service_role;
grant select, insert, update on table public.mensagens_externas to service_role;
