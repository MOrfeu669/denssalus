alter table public.bloqueios_agenda
  add column frequencia text not null default 'pontual',
  add column data_fim date,
  add column excecoes date[] not null default '{}';

alter table public.bloqueios_agenda
  add constraint bloqueios_agenda_frequencia_check
    check (frequencia in ('pontual', 'diaria', 'semanal')),
  add constraint bloqueios_agenda_recorrencia_check
    check (
      (frequencia = 'pontual' and data_fim is null)
      or (frequencia <> 'pontual' and data_fim is not null)
    );
