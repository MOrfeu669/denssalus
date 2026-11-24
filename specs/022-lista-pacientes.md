# Lista de pacientes

## Objetivo

A recepção vê a lista da clínica no visual da tela "06 Lista de pacientes": nome, contato, CPF mascarado, telefone, última visita, próxima consulta e situação, com filtro ao vivo e exportação CSV.

## Escopo

- Lista paginada da clínica da sessão, com chips Todos, Em tratamento, Com débito, Retorno pendente e Aniversariantes.
- Campo acima da lista filtra enquanto se digita, sem Enter, com espera curta. Ignora acento e maiúsculas. Combina com o chip. A busca do cabeçalho continua a busca direta e não muda.
- CPF na lista e no CSV no formato •••.000.000-••. O CPF completo fica só no cadastro.
- Exportar CSV no servidor, da clínica da sessão, no filtro e na seleção atuais. Sem seleção, exporta o filtro inteiro.
- Cadastrar paciente e editar a visão geral continuam. Agendar um paciente selecionado abre o agendamento que já existe. Prontuário abre a ficha que já existe.
- Situação lida dos registros que já existem: débito em aberto, retorno pendente ou notificado, plano em andamento ou consulta futura, alta se a última visita concluída tem menos de 12 meses, inativo no restante.
- Carregando, vazio, erro e sucesso visíveis. Assistente de voz segue na casca.

## Fora de escopo

- Ficha do paciente, agenda, dashboard e estoque.
- Seletor de clínica, botão de ajuda e contador em Mensagens. O desenho os mostra na casca; a lista não os cria. A casca mostra só o nome da clínica.
- Auth, RLS, middleware e schema. Não há data de cadastro: o texto "novos este mês" não entra.
- Importar planilha. O formato e o CPF repetido seguem pendentes na feature 004.
- Enviar mensagem em lote. Depende do canal externo.
- Excluir paciente. Não há ação de exclusão.
- Agendar vários pacientes de uma vez. O agendamento é de um paciente.

## Critério de pronto

Filtro ao vivo e CSV têm teste. A voz continua acessível nesta tela. `npm run lint`, `npx tsc --noEmit`, `npx vitest run` e `npm run build` verdes. Toda leitura da lista filtra pela clínica da sessão.
