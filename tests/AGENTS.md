# Testes

Vale para escrever e rodar teste. O `AGENTS.md` da raiz continua valendo para o resto do repositório.

## Escopo

Suíte automatizada: unidade, integração e ponta a ponta.

O teste descreve o comportamento da spec. A implementação mora na pasta do código (`src/app/`, `src/domain/`).

## Mapa

- `tests/unit` — regra pura, sem I/O
- `tests/integration` — banco e transação
- `tests/e2e` — fluxo de ponta a ponta
- Nome do arquivo: espelha o módulo e termina em `.test.ts` ou `.test.tsx`

## O que cada teste cobre

- Um comportamento por caso. O nome diz a condição e o resultado, no vocabulário do cenário (`Dado` / `Quando` / `Então`).
- Unidade: entrada, saída e erro de domínio (papel, clínica, ciclo do agendamento, conflito de cadeira).
- Integração: persistência e transação. Duas escritas simultâneas na mesma cadeira e horário não podem as duas vencer.
- Ponta a ponta: o fluxo principal da feature e um caminho de falha visível.
- Feature que lê paciente, agenda ou prontuário inclui um caso em que o usuário de outra clínica não vê o dado.
- Caso novo nasce junto com a mudança. Caso quebrado fica vermelho até o comportamento voltar.
- Cenário que depende de feature de fase posterior fica como `it.todo`, com o número da feature. Não implemente essa feature para fazer o teste passar.

## Como escrever

1. Nomear o comportamento antes de escrever a asserção.
2. Montar só o estado que o caso precisa. Dados compartilhados ficam em factory.
3. Integração usa banco de teste. Unidade usa dublê só na borda já decidida (Supabase Auth e Realtime).
4. Asserção compara o resultado observável: retorno ou estado persistido.
5. Deixar o teste independente de ordem, relógio real e rede externa.
6. Não decidir no teste uma regra que a spec ainda marca como `PENDENTE`.

## Verificar

Ainda não há comando de suíte nem meta de coverage. Quando existirem, entram aqui. Até lá, pronto é o caso novo passando, a suíte relacionada verde e o coverage medindo o caminho da spec da tarefa.

## Antes de agir

Confirmar no chat antes de apagar caso, baixar o mínimo de coverage ou apontar teste para serviço externo real.

Credencial, dado pessoal e segredo de produção ficam fora de fixture e de snapshot. Use dados fictícios.
