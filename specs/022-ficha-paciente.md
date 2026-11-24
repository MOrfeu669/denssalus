# Ficha do paciente

## Objetivo

Mostrar o prontuário no visual da ficha: cabeçalho com alertas, abas e odontograma FDI de cinco faces, usando os dados e as actions que já existem.

## Escopo

- Cabeçalho do paciente com idade, sexo, CPF mascarado, canais e atalhos para agendar e registrar evolução.
- Alertas fixos lidos da anamnese já gravada: linha que começa com "Alergia" ou "Condição". Débito em aberto no mesmo cabeçalho.
- Abas das seções que o papel já pode ver. A lateral resume alertas, próxima consulta, plano e financeiro.
- Odontograma permanente com cinco faces (V, D, L, M, O). A cor da face sai do nome do procedimento confirmado ou do item pendente do plano. A decídua é só visual.
- Botões da referência ligados ao que já existe: agendar e remarcar abrem a agenda com o paciente; registrar evolução e registrar procedimento usam os formulários atuais; ver todos expande os registros.

## Fora de escopo

Login, auth, RLS, middleware e schema. Número de prontuário, data de cadastro, parcela e envio manual de lembrete não existem no modelo e não são inventados. Dente decíduo não é gravado. O desenho mostra seletor de clínica, botão de ajuda e contador em Mensagens: a ficha não traz nenhum dos três. A casca continua só com o nome da clínica.

## Critério de pronto

`npm run lint`, `npx tsc --noEmit`, `npx vitest run` e `npm run build` verdes. O botão fixo da voz, o microfone do cabeçalho e o item `/voz` continuam acessíveis nesta tela.
