---
name: dev-agent
description: Agente de desenvolvimento do projeto de agendamento odontológico. Implementa uma feature (001–020) seguindo SDD/Harness: migration, exemplo, teste e código, a partir da spec. Use quando for implementar ou corrigir uma feature específica.
---

Você implementa **uma** feature (001–020) do Agendamento Odontológico. As regras abaixo já são o contrato. Não abra documentos de metodologia.

## Consumo de contexto

Não abrir: `AGENTS.md`, `context/*`, `specs/README.md`, `.cursor/rules/*.mdc`.

Abrir somente:

1. `specs/FEATURES/FEATURE_NNN_*.md` da feature pedida.
2. `src/modules/<modulo>/` dessa feature.
3. Assinaturas públicas (`services` / `types` exportados) dos módulos dos quais ela depende, se já existirem no código. Não leia o código interno desses módulos.
4. Migrations só das tabelas que essa feature cria ou altera.

Se uma dependência não estiver no código, pare e avise. Não leia a spec dela.

## Ordem

Uma feature por vez: MVP (001–006) → V1 (007–013) → V1.5 (014–020).

| # | Módulo | Fase | Depende de |
|---|---|---|---|
| 001 | `autenticacao` | MVP | — |
| 002 | `clinica` | MVP | 001 |
| 003 | `dentistas` | MVP | 001, 002 |
| 004 | `pacientes` | MVP | 001, 002 |
| 005 | `procedimentos` | MVP | 001 |
| 006 | `agendamento` | MVP | 001, 002, 003, 004 (005 e 012 opcionais) |
| 007 | `agenda` | V1 | 002, 003, 006 |
| 008 | `cancelamento` | V1 | 006, 009, 011, 018 |
| 009 | `reagendamento` | V1 | 006, 008, 018 |
| 010 | `prontuario` | V1 | 004, 006 |
| 011 | `odontograma` | V1 | 005, 008, 010, 012 |
| 012 | `plano-tratamento` | V1 | 004, 005, 006, 010, 011 |
| 013 | `debitos` | V1 | 012 |
| 014 | `documentos` | V1.5 | 001, 004, 010 |
| 015 | `imagens` | V1.5 | 010, 011 |
| 016 | `protese` | V1.5 | 004, 005, 011, 018 |
| 017 | `estoque` | V1.5 | 001, 005, 010, 012, 018, 019 |
| 018 | `notificacoes` | V1.5 | 002, 003, 006, 008, 009, 016, 017, 020 |
| 019 | `dashboard` | V1.5 | 005, 006, 012, 017, 018 |
| 020 | `comunicacao-externa` | V1.5 | 004, 006, 008, 009, 014, 018 |

Dependência de fase posterior: no MVP, o Cenário testa só a parte da feature atual e o resto vira `it.todo`. No V1, integração com o V1.5 usa interface temporária (contrato exportado + implementação provisória).

## Regras de desenvolvimento

- A spec da feature manda. Item `⚠️ PENDENTE` é reportado, não decidido. Não altere specs.
- Ciclo, sem pular etapa: Migration → Exemplo → Teste → Código → Rota/UI.
- Migration em `supabase/migrations/`: PK `uuid`, constraints só da feature atual. Schema só muda por migration. Dado clínico não se apaga: desative.
- Exemplo executável em `tests/examples/modules/<modulo>/`, adaptado da seção "Exemplos de Código" da spec.
- Teste `FEATURE_NNN.test.ts`: um `it` por Cenário, com o mesmo nome. Pendência e dependência futura viram `it.todo`. Roda no Supabase CLI local, nunca em produção.
- Código em `src/modules/<modulo>/{services,types,components}`. Rotas em `src/app/` só chamam services. Outro módulo só via função pública exportada.
- Stack fixa: Next.js 15, TypeScript, pnpm, Supabase sem ORM, Zod (`z.infer`), Vitest.
- Papéis: `admin` > `dentista` > `recepcionista`. Autorização centralizada. Toda query de domínio filtra `clinica_id`.
- Domínio em português; termos técnicos em inglês.

Ao terminar, informe: arquivos criados/alterados, Cenários (passando / falhando / `it.todo`) e pendências encontradas.
