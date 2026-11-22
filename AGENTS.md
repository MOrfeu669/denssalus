# AGENTS.md

## denssalus

Gestão de uma clínica odontológica para Admin, Dentista e Recepcionista. O paciente não autentica e não vê tela.

Fora do MVP: várias clínicas no mesmo login, Super Admin, expiração de sessão e portal do paciente.

As specs estão em definição. Regra marcada como pendente na spec não vira decisão aqui.

## Mapa

- `specs/` — o quê e o critério de parada; ver `specs/AGENTS.md`
- `src/app/` — telas e Server Actions; ver `src/app/AGENTS.md`
- `src/components/ui/` — componentes da coleção shadcn/ui já no repositório (`button`, `checkbox`)
- `src/domain/` — regras de negócio; ver `src/domain/AGENTS.md`
- `src/lib/supabase/` — cliente de browser em `client.ts`, cliente de servidor em `server.ts`, e o acesso ao Postgres por área
- `src/middleware.ts` — renovação da sessão (cookie)
- `scripts/criar-admin.mjs` — cria o primeiro Admin (`npm run admin:criar`)
- `supabase/` — `config.toml`, 20 migrations em `supabase/migrations/` e `seed.sql` (vazio; o seed está ligado no config)
- `tests/` — comportamento; ver `tests/AGENTS.md`. A suíte que existe é a de unidade
- `docs/TECNOLOGIAS.md` — stack decidida

O índice do código (`.codebase.mcp`) é gerado pela CLI e não é versionado. Pergunta estrutural ("como funciona X?") passa pelo índice antes de varrer arquivo.

## Stack

[stated] em `docs/TECNOLOGIAS.md`: Next.js 15 com App Router (`src/app/`, sem pasta `pages/`), React 19, mutações por Server Actions e um único Route Handler (`GET` em `src/app/auth/callback/route.ts`). A interface usa Tailwind e a coleção shadcn/ui em `src/components/ui`. A sessão é cookie, renovada em `src/middleware.ts`. Os clientes ficam em `src/lib/supabase/`. PostgreSQL 17, sem ORM. Autenticação é Supabase Auth. A agenda em tempo real usa Supabase Realtime.

O scaffold está neste repositório: `package.json`, `src/app/`, `src/lib/supabase/`, `src/middleware.ts` e `supabase/` (config, 20 migrations e `seed.sql` vazio).

## Regras de negócio

Um usuário tem um papel e uma clínica. A hierarquia é piramidal: o Admin pode o que o Dentista pode. "Exclusivo do Dentista" inclui o Admin. Dados clínicos pertencem à clínica; remover um usuário não apaga prontuário nem agenda.

O agendamento nasce `agendado`. O ciclo é `agendado` → `em_espera` (opcional) → `iniciado` → `concluido`, com `cancelado` terminal. Salvar a Evolução conclui o atendimento. Não há reserva de material; a baixa ocorre nessa conclusão.

Dois dentistas não ocupam a mesma cadeira no mesmo horário. O paciente não tem dois agendamentos ativos no mesmo horário, salvo emergência retroativa. Conflito de cadeira e horário é transacional.

O faturamento nasce do item concluído (valor do item do plano ou valor médio do avulso), na data da conclusão, atribuído a quem executou. O débito segue essa origem. Só o Admin quita, à vista, sem parcial.

Cancelamento e retorno não disparam mensagem ao paciente. Mensagem externa só em agendamento novo e nos lembretes de 24h e 5h, pelo canal preferido, e nunca para horário que já passou.

O detalhe de cada regra fica na spec dona.

### Fases

- MVP: features 001 a 006
- V1: features 007 a 013
- V1.5: features 014 a 020

Não abra a feature da fase seguinte ao cumprir o critério da tarefa.

### Vocabulário

- Clínica = tenant. Horário único e dias de atendimento valem para a clínica inteira.
- Cadeira = posto de atendimento. Qualquer dentista usa qualquer cadeira ativa. Cadeira não restringe procedimento.
- Dentista = profissional com CRO, vinculado a uma clínica. Especialidade é informativa e não restringe procedimento.
- Paciente = cadastro da clínica, sem login. Nome e pelo menos um canal de comunicação são obrigatórios.
- Procedimento = nome, tempo médio e valor médio. Tempo e valor são estimativas.
- Agendamento = horário de um paciente com um dentista e uma cadeira.
- Prontuário = visão geral do paciente mais as seções clínicas (anamnese, evolução, odontograma e as demais features).
- Evolução = texto do atendimento. Salvá-la conclui a consulta.

## Verificar

A suíte é Vitest (`npm test`). Os arquivos que existem são `tests/unit/**/*.test.ts` e `tests/health.test.ts`. Não há `tests/integration` nem `tests/e2e`, nem meta de coverage. Pronto é o critério da spec da tarefa com teste verde. Coverage mede o caminho da spec.

## Convenções

Uma tarefa, uma spec. Pare quando o critério dessa spec passar.

Confirme no chat antes de mudar schema, migration ou contrato público, e antes de fechar uma spec que ainda tenha pendência.

Segredos, credenciais e dados reais ficam fora do código e do diff.

| Uso | Modelo |
| --- | --- |
| Segurança de fluxo e produto | Fable |
| Quebrar spec e raciocínio | Opus |
| Código do dia | Sonnet |
| Ler doc ou código, spec já fechada | Haiku |

Mais effort só quando a spec pede raciocínio. Tarefa cotidiana fica no modelo do dia.

Review e release notes são agentes, não skills. Cada um declara onde para. Worktree é um diretório Git isolado por agente; o merge volta para a branch da tarefa.
