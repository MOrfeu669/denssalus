# Specs

Vale para `specs/`. O `AGENTS.md` da raiz continua valendo para o resto do repositório.

A metodologia é SDD. Esta pasta fecha o que o usuário precisa e por quê. Plano, tarefas e código vêm depois, em outro passo.


## Escopo

Uma spec por funcionalidade, em arquivo plano:

```text
specs/FEATURE_NNN_Nome.md
```

`NNN` é a ordem da feature. Stakeholder não técnico consegue ler o arquivo inteiro. As vinte specs atuais estão com status **Em Definição**.

## Mapa da spec

Seções de `FEATURE_NNN_Nome.md`:

1. **Cabeçalho** — status, fase (MVP, V1 ou V1.5), complexidade e dependências.
2. **Contexto** — problema, quem usa, resultado esperado.
3. **Requisitos** — caixas verificáveis, sem tecnologia no texto do requisito.
4. **Cenários** — `Dado` / `Quando` / `Então`. Um comportamento por cenário.
5. **Regras de Negócio** — `[stated]` ou `[correção]` para o que já foi decidido. `PENDENTE` para o que o usuário ainda não fechou.
6. **Dependências** — features que precisam existir antes.
7. **Notas** — histórico da decisão. Não vira requisito.

Não reescreva estas specs no formato de pasta `spec.md` com `FR-001` e `SC-001`.

## Como escrever

1. Partir do pedido do usuário. Onde faltar decisão, marcar `PENDENTE` com a pergunta objetiva e seguir. A spec só fecha quando esses marcadores saem, com resposta explícita.
2. Cada cenário declara a ação e o valor observável. Aceite em **Dado / Quando / Então**.
3. Requisito testável e sem ambiguidade. Caso de borda vira cenário ou regra. Premissa não vira requisito escondido.
4. Critério de sucesso mede resultado de negócio: tempo, taxa, estado observável. Stack, endpoint, tabela e estrutura de código ficam fora da spec e entram na fase de plano.
5. Regra pendente não é decidida pelo agente. Não copie uma pendência para o `AGENTS.md` como se fosse invariante.
6. Manter o arquivo até ~200 linhas. Acima de ~300, dividir em outra funcionalidade.
7. Feature de fase posterior não entra no critério da feature atual. Onde o cenário depender dela, o teste futuro fica marcado, sem implementar essa feature.

## Verificar

A spec está pronta quando:

- As seções obrigatórias estão preenchidas
- O texto é legível por quem não implementa
- Cenários cobrem o fluxo principal e os casos de borda
- Cada requisito tem aceite observável
- Escopo, dependências e premissas estão explícitos
- Nenhum `PENDENTE` restante
- Nenhum detalhe de stack, API ou estrutura de código no requisito

Status **Em Definição** não é spec fechada. Não marque como pronta e não comece o código dessa feature enquanto houver pendência.

## Antes de agir

Confirmar no chat antes de marcar a spec como pronta com pendência aberta, ou antes de alterar o escopo de uma spec já confirmada.
