alter table public.procedimentos
  add column arquivado boolean not null default false;

comment on column public.procedimentos.arquivado is
  'Excluir arquiva. O agendamento antigo continua apontando para o procedimento.';
