---
name: ui
description: Adiciona ou compõe um componente shadcn/ui com Tailwind nas telas do Denssalus. Use ao criar ou alterar botão, diálogo, campo, interruptor, select, aba, alerta ou outro bloco visual em src/app, ou quando o usuário pedir shadcn, Tailwind ou um componente de interface.
---

# UI

Vale para bloco visual em `src/app/`. A coleção é shadcn/ui. O estilo da composição é Tailwind. Mutação continua Server Action.

1. Procure o bloco em `src/components/ui`. Se existir, componha esse arquivo. Não recrie o mesmo controle na tela.
2. Se não existir, adicione só o componente que a tela usa. Não instale a coleção inteira e não traga peça de outro kit.
3. Sem `components.json`, pare e confirme no chat antes de iniciar o shadcn. A iniciação liga o Tailwind ao projeto.
4. A página que busca dado permanece Server Component. O arquivo com `"use client"` é o bloco que abre, fecha ou guarda estado.
5. Formulário usa a Server Action da tela. O componente não chama o banco nem o domínio.
6. Tela que já tem `tela.css` conserva esse CSS até a tarefa pedir mudança visual nela. O bloco novo, nessa mudança, usa Tailwind e o componente da coleção.
7. Nome acessível e foco depois da ação seguem `src/app/AGENTS.md`. Pare quando a tela mostrar carregando, vazio, erro e sucesso.
