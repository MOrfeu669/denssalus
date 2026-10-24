# Tecnologias

Decisão [stated] em 23/10/2026. O detalhe de área está nos `AGENTS.md`. Este repositório ainda não tem o scaffold: não há `package.json`, `src/lib/supabase/`, `src/middleware.ts` nem `supabase/`. Os caminhos abaixo são o alvo.

| Item | Decisão |
|---|---|
| Framework de interface | React 19 (`react` / `react-dom`), servido pelo Next.js 15 |
| Roteador | **App Router** — rotas em `src/app/`. Não há pasta `pages/` |
| Cliente Supabase | `@supabase/ssr`: `createBrowserClient` em `src/lib/supabase/client.ts` e `createServerClient` em `src/lib/supabase/server.ts` (Server Components, Server Actions, Route Handler e middleware) |
| Sessão | Cookie. No Next.js 15 a renovação fica em `src/middleware.ts`, função `middleware`. O arquivo `proxy.ts` é do Next.js 16 e não entra |
| Banco além do Auth | **PostgreSQL 17** (Supabase CLI local, porta `54322`). Sem ORM. O Auth fica em `auth.users`; o domínio fica no schema `public` (`usuarios`, clínica, dentistas, pacientes, procedimentos, agendamentos) |
| Endpoint HTTP da aplicação | Um único Route Handler: `GET` em `src/app/auth/callback/route.ts` (troca o código do e-mail de recuperação pela sessão). O restante das mutações passa por Server Actions (`src/app/**/actions.ts`), não por rotas HTTP próprias |
| Variáveis | `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Sem valores neste repositório |
| Autenticação | [stated] Supabase Auth (senha, sessão e e-mail de recuperação). Spec 001 |
| Agenda em tempo real | [stated] Supabase Realtime. Spec 007 |

A API local do Supabase (PostgREST) sobe na porta `54321`, e o app fala com ela pelos clientes acima.

## Fora desta decisão

Storage e envio. O formato de erro das Server Actions também não está decidido: não traduzir 400, 401 ou 403 para outro contrato. Policies não entram; a clínica é isolada pelo filtro na Server Action.

Decisão [stated] em 24/10/2026, para o scaffold da Feature 001:

| Item | Decisão |
|---|---|
| Runner de teste | Vitest. Arquivos em `tests/`, comando `npm test` |
| Biblioteca de UI | Nenhuma. Telas em HTML e React |

A criação de usuário pelo Admin e a leitura de `usuarios` usam a chave secreta só no servidor (`SUPABASE_SECRET_KEY`). Ela não leva o prefixo `NEXT_PUBLIC_`.

## Árvore prevista de `supabase/`

Ainda não existe neste repositório.

```
supabase/
├── .gitignore
├── config.toml
└── migrations/
```

Esta decisão não inclui `functions/` nem policies em arquivos separados.
