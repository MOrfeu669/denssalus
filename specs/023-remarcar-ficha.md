# Remarcar na ficha e chamar na sala de espera

## Objetivo

O Remarcar da ficha move o horário do agendamento que já existe. A recepcionista chama o paciente que está na sala de espera. A agenda continua só em Dia e Semana.

## Escopo

- Na ficha, Remarcar pede a nova data e a nova hora e move o agendamento existente, com a mesma regra do arrastar da agenda.
- Conflito de horário aparece na ficha. Depois de mover, a ficha e a agenda mostram o horário novo.
- A recepcionista inicia o atendimento que já está em espera, na clínica dela. Admin e o dentista responsável continuam como estavam. Quem não tem permissão não chama. Agendamento de outra clínica não é chamado.
- A agenda oferece Dia e Semana. Não há visão de mês.

## Fora de escopo

Auth, RLS, middleware, migração e o desenho de isolamento entre clínicas. Dentição de leite. Login. Casca e travas de contador. Assistente de voz.

## Critério de pronto

O agendamento remarcado permanece um só. Conflito, outra clínica e falta de permissão bloqueiam. A recepcionista chama quem está em espera da própria clínica e não chama o de outra clínica. Os outros papéis seguem a regra anterior. `npm run lint`, `npx tsc --noEmit`, `npx vitest run` e `npm run build` verdes.
