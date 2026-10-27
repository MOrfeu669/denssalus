grant select on table public.agendamentos to authenticated;
grant select on table public.bloqueios_agenda to authenticated;

create policy agendamentos_leitura_clinica
  on public.agendamentos
  for select
  to authenticated
  using (clinica_id = (auth.jwt() -> 'app_metadata' ->> 'clinica_id'));

create policy bloqueios_leitura_clinica
  on public.bloqueios_agenda
  for select
  to authenticated
  using (clinica_id = (auth.jwt() -> 'app_metadata' ->> 'clinica_id'));

alter publication supabase_realtime add table public.agendamentos;
alter publication supabase_realtime add table public.bloqueios_agenda;
