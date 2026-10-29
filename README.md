# denssalus

Gestão de uma clínica odontológica para Admin, Dentista e Recepcionista. O paciente não autentica e não vê tela.

O app é Next.js 15 (App Router). A sessão, o banco e o e-mail local vêm do Supabase. Não há cadastro público: o primeiro usuário é um Admin criado por script.

## Pré-requisitos

- Node.js 20 ou superior, com `npm` no `PATH`
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) em execução (o Supabase local sobe em containers)
- [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started)
- Git

Confira as versões:

```powershell
node -v
npm -v
docker info
supabase --version
```

## Subir o projeto

Na raiz do repositório:

```powershell
npm install
Copy-Item .env.example .env.local
supabase start
```

`supabase start` aplica as migrations em `supabase/migrations/` e imprime as URLs e as chaves. Se o comando reclamar de `supabase/seed.sql`, crie o arquivo vazio e rode de novo. O `config.toml` aponta esse seed, e ele ainda não está no repositório.

```powershell
New-Item -ItemType File -Path supabase/seed.sql -Force
supabase start
```

Copie os valores do `supabase status` para `.env.local`:

| Variável | O que colar |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | API URL, em geral `http://127.0.0.1:54321` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable key. Em CLI antiga, a anon key |
| `SUPABASE_SECRET_KEY` | Secret key. Em CLI antiga, a service role key |

A secret key fica só no servidor. Não commite o `.env.local`.

Crie o Admin e suba o app:

```powershell
npm run admin:criar
npm run dev
```

Abra [http://127.0.0.1:3000/login](http://127.0.0.1:3000/login) e entre com `ADMIN_EMAIL` e `ADMIN_SENHA`. O endereço do Auth local é `127.0.0.1`, não `localhost`.

Depois do login, o Admin configura a clínica em `/clinica`. Esse passo grava a clínica de verdade e atualiza o vínculo do usuário. O `ADMIN_CLINICA_ID` do script é só o identificador inicial (padrão `clinica-001`).

## Variáveis

O modelo está em `.env.example`.

| Variável | Obrigatória | Uso |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | sim | URL da API local |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | sim | Chave pública, lida no browser |
| `SUPABASE_SECRET_KEY` | sim | Chave do servidor. Cria usuários e lê o domínio |
| `ADMIN_EMAIL` | sim, no script | E-mail do primeiro Admin |
| `ADMIN_SENHA` | sim, no script | Senha do primeiro Admin. Mínimo de 6 caracteres |
| `ADMIN_NOME` | não | Nome exibido. Padrão `Admin` |
| `ADMIN_CLINICA_ID` | não | Identificador inicial do usuário. Padrão `clinica-001` |

Exemplo, com chaves fictícias:

```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...
ADMIN_EMAIL=admin@clinica.local
ADMIN_SENHA=uma-senha
ADMIN_NOME=Admin
ADMIN_CLINICA_ID=clinica-001
```

`npm run admin:criar` lê o `.env.local`. Se o e-mail já existir no Auth, o script para com o erro do Supabase. Troque o e-mail ou apague o usuário no Studio antes de rodar de novo.

## O que fica no ar

| Serviço | Endereço |
| --- | --- |
| App | http://127.0.0.1:3000 |
| API do Supabase | http://127.0.0.1:54321 |
| Postgres | `127.0.0.1:54322` (usuário `postgres`, senha `postgres`, banco `postgres`) |
| Studio | http://127.0.0.1:54323 |
| E-mail local (Mailpit) | http://127.0.0.1:54324 |

A recuperação de senha (`/recuperar`) não envia e-mail de verdade. O link aparece no Mailpit.

## Comandos

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Sobe o Next.js em modo de desenvolvimento |
| `npm test` | Roda a suíte (Vitest) |
| `npm run typecheck` | Checa os tipos sem emitir arquivo |
| `npm run build` | Gera o build de produção |
| `npm start` | Sobe o build. Rode `npm run build` antes |
| `npm run admin:criar` | Cria o Admin no Auth e na tabela `usuarios` |
| `supabase stop` | Derruba o stack local. Os dados ficam no volume do Docker |
| `supabase db reset` | Recria o banco a partir das migrations e do seed |

## Ambiente do Cursor

Regras, skills e agentes já estão no repositório. Esta parte não é necessária para rodar o app.

- `.cursor/rules` — regras por área. Só o guardrail é sempre ativo.
- `.cursor/skills` — skills `api` e `find-skill`.
- `.cursor/agents` — `code-review` e `release-notes`.
- `.cursor/mcp.json` — Context7, GitHub e Codebase Memory.
- `specs/` — uma spec por funcionalidade. O trabalho para quando o critério dessa spec passa.

O índice do código (`.codebase-memory/`) é local e não é versionado. Na raiz:

```powershell
codebase-memory-mcp cli index_repository --repo-path "$PWD" --persistence true
```
