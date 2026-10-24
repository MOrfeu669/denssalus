# App

Vale para `src/app/`. O `AGENTS.md` da raiz continua valendo para o resto do repositório.

## Escopo

Telas e Server Actions. Quem usa a tela é Admin, Dentista ou Recepcionista. O paciente não tem tela.

A tela e a action moram aqui. A action chama o domínio em `src/domain/`. O componente não acessa o banco. A sessão vem do cookie do Supabase Auth, renovado em `src/middleware.ts`. A agenda acompanha mudanças pelo Supabase Realtime.

## Mapa

App Router. Não há pasta `pages/`. O arquivo `src/app/app.tsx` é representativo da tela e não é uma página do Next. Rotas, `actions.ts` e o callback ainda não existem.

- `tests/` — suíte desta pasta; detalhe em `tests/AGENTS.md`

## Callback

O único endpoint HTTP da aplicação é `GET` em `src/app/auth/callback/route.ts` (troca o código do e-mail de recuperação pela sessão). Esse arquivo ainda não existe.

- Invoque a skill `api` ao criar ou alterar esse Route Handler. Mutação de domínio é Server Action e fica fora desta skill.
- Consulte a doc atual via Context7 antes de usar nome de função ou classe do Supabase.
- Leitura e escrita de dado clínico filtram pela clínica da sessão. Papel insuficiente não executa a ação.
- Papel sem permissão usa a mensagem "Ação não permitida para seu papel". Sem stack para o cliente.
- Não exponha senha, token nem dado de outra clínica.

## Regras de interface

Fluxos visíveis, na ordem das fases: login, configuração da clínica, cadastro de dentista e de paciente, agenda. Cada fluxo termina num estado visível de sucesso (sessão aberta, clínica salva, cadastro na lista, horário na grade).

- A agenda alterna entre dia e semana. Não há visão de mês.
- Agendamento `cancelado` aparece na grade, riscado.
- Cadeira desativada, dentista removido ou horário fora do funcionamento aparecem com alerta (cor destacada ou sinal "!"). Não somem da grade.
- Erro da ação aparece como mensagem na tela, com retry quando a falha for de carregamento. Papel sem permissão mostra "Ação não permitida para seu papel".
- Texto, rótulo e foco seguem o nome acessível da ação. Depois da ação, o foco vai para o resultado (mensagem de sucesso, erro ou item criado).
- A tela usa os mesmos termos do domínio. Não invente sinônimo para cadeira, evolução, débito ou agendamento.

### Vocabulário

- Clínica = a clínica do usuário logado. Não há seletor de outra clínica.
- Cadeira = posto de atendimento na grade e nos filtros.
- Dentista = profissional da clínica. Especialidade é só informação.
- Paciente = cadastro. Nome e pelo menos um canal de comunicação são obrigatórios no formulário.
- Procedimento = nome, tempo médio e valor médio.
- Agendamento = horário na grade, com status `agendado`, `em_espera`, `iniciado`, `concluido` ou `cancelado`.
- Evolução = texto do atendimento. Salvar conclui a consulta.
- Débito = valor a receber nascido do item concluído. Só o Admin vê a ação de quitar.

## Como implementar

1. Ler a tela e a Server Action antes de criar componente. Não abra feature de fase posterior.
2. Dados da tela vêm da Server Action. Estado de UI fica no componente que o usa.
3. Componente recebe dados já prontos para renderizar. Formatação e cópia ficam fora da Server Action.
4. Cada tela cobre carregando, vazio, erro e sucesso.
5. Interação nova tem nome acessível e foco previsível depois da ação.
6. Manter cada arquivo até ~200 linhas. Acima de ~300, extrair o bloco de UI ou o hook.
7. Onde a spec ainda tem `PENDENTE`, não escolha o comportamento da tela. Pare e confirme no chat.

## Verificar

Ainda não há suíte nem comando para subir o app. Quando existirem, entram aqui. Até lá, pronto é o fluxo alterado com teste e a tela mostrando carregando, vazio, erro e sucesso.

## Antes de agir

Confirmar no chat antes de mudar rota pública, texto legal ou a entrada e a saída de Server Action de que a tela depende.

Segredos e chaves ficam em variável de ambiente, fora do código e do diff.
