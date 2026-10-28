create table public.notificacoes_internas (
  id uuid primary key,
  clinica_id text not null,
  destinatario_id uuid not null references public.usuarios (id),
  tipo text not null,
  urgencia text not null,
  referencia_id text not null,
  mensagem text not null,
  lida boolean not null default false,
  resolvida boolean not null default false,
  criada_em timestamptz not null,
  constraint notificacoes_internas_tipo_check check (
    tipo in (
      'paciente_aguardando',
      'retorno_reagendar',
      'cancelamento_comunicar',
      'estoque_abaixo_minimo',
      'estoque_baixa_insuficiente',
      'cadeira_indisponivel',
      'fora_de_horario',
      'dentista_removido',
      'falha_envio_mensagem',
      'atraso_protese'
    )
  ),
  constraint notificacoes_internas_urgencia_check check (urgencia in ('normal', 'critica'))
);

create unique index notificacoes_internas_aberta_unique
  on public.notificacoes_internas (destinatario_id, tipo, referencia_id)
  where resolvida = false;

create index notificacoes_internas_clinica_destinatario_idx
  on public.notificacoes_internas (clinica_id, destinatario_id);

alter table public.notificacoes_internas enable row level security;

revoke all on table public.notificacoes_internas from anon, authenticated;
grant select, insert, update on table public.notificacoes_internas to service_role;
