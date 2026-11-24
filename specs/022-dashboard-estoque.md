# Dashboard financeiro e estoque

## Objetivo

Deixar o dashboard financeiro e o estoque no visual Paper das telas de referência, com os números que o sistema já calcula e com os botões do desenho que já têm regra.

## Escopo

- Dashboard: período (hoje, 7 dias, mês, personalizado), indicadores, faturamento diário, por dentista, por procedimento, estoque abaixo do mínimo e despesa de prótese.
- A linha de meta diária só aparece quando a clínica tiver esse valor. Sem o campo, a linha não é desenhada e nenhum número é inventado.
- Exportar CSV no servidor, só com os dados da clínica da sessão. PDF e Excel continuam.
- Estoque: quantidade com barra e marca do mínimo, validade, status, busca, filtros e painel de histórico.
- Cadastrar material e registrar entrada funcionam. A baixa avulsa não grava: a baixa continua na conclusão do atendimento.
- O assistente de voz segue na lateral, no cabeçalho e no botão fixo.

## Fora de escopo

Login. Auth, RLS, middleware e migração. Agenda, prontuário e lista de pacientes. Campo novo de meta, de vencimento do débito, de categoria, de unidade ou de lote no banco. Seletor de clínica, botão de ajuda e contador de Mensagens, mesmo que o desenho os mostre.

## Critério de pronto

`npm run lint`, `npx tsc --noEmit`, `npx vitest run` e `npm run build` verdes. A meta ausente não vira um valor fixo. O CSV não inclui dado de outra clínica. O teste das telas encontra `/voz`, o microfone do cabeçalho e o botão fixo.
