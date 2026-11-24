---
name: ui
description: Adiciona ou compõe um componente shadcn/ui com Tailwind nas telas do Denssalus. Use ao criar ou alterar botão, diálogo, campo, interruptor, select, aba, alerta ou outro bloco visual em src/app, ou quando o usuário pedir shadcn, Tailwind ou um componente de interface.
---

# UI

Vale para bloco visual em `src/app/`. Coleção: shadcn/ui. Composição: Tailwind e/ou CSS da tela. Mutação continua Server Action. Design e layers: `.cursor/rules/frontend.mdc`.

1. Procure o bloco em `src/components/ui`. Se existir, componha esse arquivo. Não recrie o mesmo controle na tela.
2. Se não existir, adicione só o componente que a tela usa. Não instale a coleção inteira e não traga peça de outro kit.
3. Sem `components.json`, pare e confirme no chat antes de iniciar o shadcn. A iniciação liga o Tailwind ao projeto.
4. A página que busca dado permanece Server Component. O arquivo com `"use client"` é o bloco que abre, fecha ou guarda estado.
5. Formulário usa a Server Action da tela. O componente não chama o banco nem o domínio.
6. Composição visual é livre: tipografia, ritmo, cor e profundidade a serviço do fluxo. Em ajuste fino, altere um layer por vez (`fundo` | `superficie` | `conteudo` | `acao` | `overlay`).
7. Nome acessível e foco depois da ação seguem `src/app/AGENTS.md`. Pare quando a tela mostrar carregando, vazio, erro e sucesso.
