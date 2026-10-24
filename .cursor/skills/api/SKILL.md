---
name: api
description: Cria ou altera o Route Handler de callback da autenticação. Não use para mutação de domínio; mutação é Server Action.
---

# API

Vale só para o Route Handler `GET` em `src/app/auth/callback/route.ts`, que troca o código do e-mail de recuperação pela sessão. Mutação de domínio é Server Action e fica fora desta skill.

1. Confirme método, caminho, entrada, saída e erro com a decisão em `docs/TECNOLOGIAS.md`.
2. Consulte a doc atual do Supabase no Context7 antes de escrever a chamada.
3. O handler fica em `src/app/auth/callback/route.ts`.
4. Cubra o contrato com teste em `tests/`.
5. Pare quando o teste do contrato passar.

## Contrato

```ts
type Endpoint = {
  method: "GET";
  path: "/auth/callback";
  response: unknown;
  error: { code: string; message: string };
};
```
