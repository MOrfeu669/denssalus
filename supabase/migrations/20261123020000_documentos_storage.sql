-- PDFs novos vão para o bucket privado `documentos`, no caminho clinica_id/documento_id.pdf.
-- A coluna pdf (bytea) fica só para o que já foi gerado. A rotina migrarPdfsLegados
-- copia cada bytea da própria clínica para o bucket, grava caminho e zera pdf.
alter table public.documentos_gerados
  add column caminho text,
  alter column pdf drop not null;

comment on column public.documentos_gerados.pdf is
  'Legado. Novos documentos deixam esta coluna nula e gravam o arquivo no bucket documentos.';

insert into storage.buckets (id, name, public)
values ('documentos', 'documentos', false)
on conflict (id) do update set public = false;
