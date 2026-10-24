# Domínio

Vale para `src/domain/`. O `AGENTS.md` da raiz continua valendo para o resto do repositório.

## Escopo

Regras de negócio. A clínica é o tenant: toda leitura e escrita filtra pela clínica do usuário autenticado.

A Server Action em `src/app/` chama o domínio. O domínio não importa tela. A borda com o Postgres é o cliente de servidor em `src/lib/supabase/server.ts`, quando o scaffold existir.

[stated] Persistência em PostgreSQL 17, sem ORM, pelo cliente Supabase. Autenticação é Supabase Auth (senha, sessão e e-mail de recuperação ficam no Supabase). A agenda em tempo real usa Supabase Realtime. Mutações de domínio são Server Actions. O único HTTP da aplicação é o callback descrito em `src/app/AGENTS.md`.

## Mapa

- `src/domain/` — regras de negócio. O health check de exemplo fica em `src/domain/health.ts` e não é uma rota.
- `src/lib/supabase/` — clientes Supabase (Auth e Realtime), quando o scaffold existir
- `tests/` — suíte; detalhe em `tests/AGENTS.md`

## Regras de negócio

A Server Action não contorna estas invariantes. O detalhe fica na spec dona.

- Um usuário tem um papel (`admin`, `dentista` ou `recepcionista`) e uma clínica. O Admin pode o que o Dentista pode. Dados clínicos pertencem à clínica; remover usuário só remove o vínculo de permissão.
- Paciente não é usuário. Usuário de uma clínica não lê nem escreve dado de outra.
- Agendamento nasce `agendado`. Ciclo: `agendado` → `em_espera` (opcional) → `iniciado` → `concluido`, com `cancelado` terminal. Só o dentista responsável, ou o Admin, marca `iniciado`. Salvar a Evolução conclui o atendimento.
- Dois dentistas não ocupam a mesma cadeira no mesmo horário. O paciente não tem dois agendamentos ativos no mesmo horário, salvo emergência retroativa. As duas escritas conflitantes não podem as duas persistir.
- Cadeira inativa, dentista inativo e dia fora de `dias_atendimento` bloqueiam agendamento novo. Emergência retroativa ignora essas validações. Desativar cadeira, remover dentista ou mudar o horário não cancela o que já estava marcado: o registro ganha alerta.
- Não há reserva de material. A baixa ocorre na conclusão do atendimento (salvar a Evolução), em FEFO. Registrar procedimento no dente não baixa estoque.
- Débito nasce do item concluído. Só o Admin registra pagamento, à vista, sem parcial.
- Cancelamento exige motivo, só ocorre antes de `concluido` e não manda mensagem ao paciente. Com confirmação extra, o registro do odontograma passa a `revertido` e não é apagado.

### Vocabulário

- Clínica = tenant, com horário único e dias de atendimento.
- Cadeira = posto. Qualquer dentista, qualquer cadeira ativa, sem restrição de procedimento.
- Dentista = profissional com nome, CRO, telefone e CPF. Especialidade não restringe procedimento.
- Paciente = cadastro da clínica. Nome e pelo menos um canal são obrigatórios. CPF, quando informado, é único na clínica. Menor de 18 anos exige nome e CPF do responsável.
- Procedimento = nome, tempo médio e valor médio. Estimativas, não valores fixos.
- Agendamento = paciente, dentista, cadeira e intervalo. Procedimento é opcional.
- Evolução = texto obrigatório para concluir. A trilha de auditoria é só do Admin.

## Como implementar

1. Ler a spec da feature e o caso de uso antes de criar arquivo. Não implemente feature de fase posterior.
2. Colocar a regra no domínio. A Server Action chama o caso de uso.
3. Validar na borda. O domínio recebe dados já válidos, inclusive clínica e papel.
4. Escrita de agendamento persiste em transação e devolve o recurso já consistente.
5. Papel sem permissão não executa a ação. A mensagem desse bloqueio é "Ação não permitida para seu papel". O formato de erro da Server Action não está decidido.
6. Falha de integração vira erro de aplicação, com a causa original preservada. O cliente não recebe stack.
7. Manter cada arquivo até ~200 linhas. Acima de ~300, dividir por caso de uso.
8. Onde a spec ainda tem `PENDENTE`, não escolha uma alternativa. Pare e confirme no chat.

## Verificar

Ainda não há suíte nesta pasta. Quando o comando existir, ele entra aqui. Até lá, pronto é o caso de uso com teste e o critério da spec da tarefa passando. Coverage mede o caminho dessa spec.

## Antes de agir

Confirmar no chat antes de mudar schema, migration ou contrato público.

Segredos, credenciais e dados reais ficam fora do código e do diff.
