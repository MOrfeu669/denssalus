# Base visual das telas

## Objetivo

Deixar a casca, os tokens e os estados que as telas seguintes vão reutilizar, no visual Paper já aprovado.

## Escopo

- Tokens `--paper-status-*` e `--paper-tint-*` no tema, e um badge de status do agendamento.
- Fontes da casca: Montserrat nos títulos, Roboto no texto, PT Mono em rótulos e códigos, números com tabular-nums.
- Lateral branca de 248px, com grupos, item ativo, contador de retornos e usuário no rodapé.
- Cabeçalho com busca global de paciente (nome, CPF ou telefone), sempre pela clínica da sessão.
- Foco de 3px, botão de envio em "Salvando…" e desabilitado padronizado.
- Assistente de voz no grupo Gestão e no cabeçalho, sem alterar a integração.

## Fora de escopo

Agenda, prontuário, dashboard, estoque e lista de pacientes. Login. Auth, RLS, middleware e migração de PDFs. Seletor de outra clínica. Contador de Mensagens.

## Critério de pronto

`npm run lint`, `npx tsc --noEmit`, `npx vitest run` e `npm run build` verdes. A busca não devolve paciente de outra clínica. O link `/voz` está na lateral e o atalho do cabeçalho renderiza.
