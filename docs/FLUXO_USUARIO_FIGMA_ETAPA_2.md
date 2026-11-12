# Etapa 2 — Consulta, prontuário e operação

Leia antes `docs/FLUXO_USUARIO_FIGMA_ETAPA_1.md`. Valem o vocabulário, a casca, os estados e a regra de não inventar tela nem sinônimo. Não redesenhe os frames 01 a 14, exceto nos acréscimos marcados abaixo.

O paciente continua sem tela. O texto segue em português do Brasil. Nomeie o frame como `NN — Nome — papel`.

## Como desenhar

1. Crie as páginas `04 Consulta`, `05 Prontuário` e `06 Operação`.
2. Reuse a casca da etapa 1. Acrescente o sino só nos frames desta etapa, no canto superior.
3. No menu, além do que já existe, entram Retornos, Estoque e Dashboard para os três papéis, e Mensagens só para o Admin.
4. Ligue o protótipo a partir da agenda e da lista de pacientes já desenhadas. Não refaça o caminho mínimo.

## Quem vê o quê

O Admin pode o que o Dentista pode, com as exceções do frame. A Recepcionista não preenche seção clínica.

| Área | Admin | Dentista | Recepcionista |
| --- | --- | --- | --- |
| Cancelar agendamento | sim | sim | sim |
| Marcar retorno | sim | sim | não; ela reagenda a partir do aviso |
| Marcar chegada | sim | sim | sim |
| Iniciar atendimento | sim | só o responsável | não |
| Evolução | sim | só o responsável | não |
| Visão geral e histórico | sim | sim | sim |
| Anamnese, odontograma, plano, imagens | sim | sim | não |
| Débito | vê e quita | vê e aplica desconto | vê |
| Gerar documento | não desenhe como ação dele | sim | não |
| Prótese e estoque | sim | sim | sim |
| Mensagens (modelos) | sim | não | não |
| Sino e dashboard | sim | sim | sim |

Mensagem exata quando o papel não pode: `Ação não permitida para seu papel`.

## Vocabulário desta etapa

| Termo | Significado na tela |
| --- | --- |
| Prontuário | Visão geral do paciente mais as seções clínicas. |
| Evolução | Texto do atendimento. Salvar conclui a consulta. |
| Débito | Valor a receber, nascido do item concluído. |
| Retorno | Próxima consulta a marcar, com data prevista. |

Status escritos assim: `agendado`, `em espera`, `iniciado`, `concluído`, `cancelado`.

## Fora desta etapa

Não desenhe, porque a decisão ainda não existe:

- Provedor de assinatura digital. No documento, mostre `Assinado por` e o nome do dentista.
- O Admin assinando ou gerando documento. No frame dele, os modelos aparecem sem a ação `Gerar`.
- Cadastro de laboratório. Na prótese, laboratório é texto livre.
- Vencimento ou alerta de débito em atraso.
- Pagamento parcial, parcela ou lançamento manual de débito.
- Um agendamento com procedimento avulso e itens de plano ao mesmo tempo. A escolha passa a ser nenhuma, um procedimento ou itens do plano.
- Mensagem ao paciente no cancelamento ou no retorno.
- Portal do paciente.

## Acréscimos nos frames da etapa 1

Não recrie a tela. Acrescente só o controle:

- No frame 10, a linha do paciente abre o prontuário.
- No frame 12, a escolha opcional ganha uma terceira alternativa, exclusiva: itens do plano de tratamento daquele paciente.
- No frame 14, `cancelado` fica riscado e continua na grade. O horário passa a abrir o detalhe do agendamento.
- No Início, o menu ganha Retornos, Estoque, Dashboard e, para o Admin, Mensagens.

---

## 04 Consulta

A consulta começa na agenda ou na lista de agendamentos.

### 15 — Cancelar agendamento — todos

A partir do agendamento que ainda não está `concluído` (`agendado`, `em espera` ou `iniciado`). Campo obrigatório: motivo. Ação: `Cancelar`.

Em seguida, pergunta: `Deseja reagendar?` com `Sim` e `Não`.

`Sim` abre o frame 12 já com o mesmo paciente, dentista e procedimento. `Não` volta à agenda, horário riscado.

Se o agendamento tiver registro confirmado no odontograma, antes de cancelar mostre um alerta e uma confirmação extra. Não desenhe essa confirmação no caminho feliz sem odontograma.

Não desenhe mensagem ao paciente nesta tela.

### 16 — Retornos — admin, dentista e recepcionista

Duas regiões:

- Admin e Dentista marcam retorno: paciente e data futura. Não há ação de apagar o retorno.
- A lista de retornos a reagendar é o que a Recepcionista vê. Cada item pede um agendamento novo. Quando o agendamento existe, o item sai da lista.

Não desenhe mensagem automática ao paciente.

### 17 — Chegada — todos que veem o agendamento

Ação opcional no agendamento `agendado`: `Marcar chegada`. O status passa a `em espera`. A consulta também pode seguir sem essa ação. Não desenhe a chegada como passo obrigatório.

### 18 — Iniciar atendimento — dentista responsável e admin

Ação `Iniciar` no agendamento `agendado` ou `em espera`. Status passa a `iniciado`. No frame da Recepcionista essa ação não existe. No frame de outro dentista, que não é o responsável, também não.

### 19 — Evolução — dentista responsável e admin

Campo de texto obrigatório. Ação: `Salvar evolução`. Não desenhe botão `Concluir`.

Sucesso visível: a evolução aparece no histórico e o agendamento fica `concluído`. Evolução já salva pode ser editada; o status continua `concluído`.

Não desenhe trava por falta de estoque. A consulta conclui mesmo assim.

---

## 05 Prontuário

Abre pela linha do paciente. Título: `Prontuário de [nome]`. Voltar leva a Pacientes.

Ordem das seções na página, de cima para baixo. Seção que o papel não preenche aparece só leitura, ou some, conforme a tabela. Recepcionista vê visão geral, histórico, débitos e próteses. Não vê formulário de anamnese, evolução, odontograma, plano, imagens nem gerar documento.

### 20 — Visão geral — todos

Nome, canais com o preferido marcado, CPF, endereço, data de nascimento, sexo, idade calculada, responsável quando houver. Ação: `Editar a visão geral em Pacientes`, que volta ao frame 10.

### 21 — Anamnese — dentista e admin

Texto editável. Salvar não conclui a consulta. Vazio: nenhuma anamnese registrada.

### 22 — Histórico — todos

Lista das consultas do paciente, inclusive `cancelado`, com data e status. Vazio: `Nenhum agendamento para este paciente.`

### 23 — Evoluções — dentista e admin

Lista do que foi salvo no frame 19. Cada item mostra o texto e quando foi salvo.

### 24 — Odontograma — dentista e admin

Boca em quatro quadrantes: superior direito, superior esquerdo, inferior esquerdo, inferior direito. Visão espelhada, como o dentista vê o paciente de frente. Números FDI. Cada dente abre o histórico de registros.

Ações: vincular um procedimento a um ou mais dentes; registrar procedimento pré-existente, sem agendamento. Pré-existente não mostra débito nem baixa de estoque.

Registro tem estado `confirmado` ou `revertido`. `revertido` continua visível e não parece apagado.

Não desenhe baixa de estoque neste frame.

### 25 — Plano de tratamento — dentista e admin

Lista de planos do paciente. Cada plano tem status `proposto`, `em andamento` ou `concluído`, e o valor total (soma dos itens).

Item: procedimento, um ou mais dentes FDI, valor editável a partir do valor médio. Item `pendente` pode ser editado e vinculado a um agendamento. Item `concluído` mostra o dentista que executou e não tem campos editáveis.

Quando todos os itens estão `concluídos`, o plano mostra `concluído`. Recepcionista não vê criar nem editar.

### 26 — Débitos — todos veem, admin quita

Lista no prontuário. Cada débito nasce de item de plano concluído ou de procedimento avulso concluído. Não desenhe botão de lançar débito à mão. Não desenhe parcial, parcela nem vencimento.

Status: `em aberto` ou `quitado`.

Dentista e Admin: ação `Aplicar desconto`. Recepcionista não tem essa ação.

Só o Admin vê `Quitar`. Campos: forma (`dinheiro`, `PIX`, `cartão de débito`, `cartão de crédito`, `boleto`, `cheque`) e data. O valor quitado é o que restou depois do desconto. Sucesso: status `quitado`, com quem registrou.

### 27 — Documentos — dentista gera

Modelos visíveis: Receituário, Atestado, Termo de Consentimento. Dentista e Admin podem criar outro modelo, com variáveis de paciente e dentista (nome, CPF, data de nascimento).

Ação `Gerar` só no frame do Dentista. O PDF gerado mostra os dados preenchidos e `Assinado por [nome do dentista]`. Documento gerado não tem edição; a correção é `Gerar novo`, e o anterior permanece na lista.

Recepcionista não tem `Gerar`. No frame do Admin, mostre os modelos sem a ação de gerar.

### 28 — Raio X e imagens — dentista e admin

Galeria do paciente em ordem cronológica. Cada imagem: descrição, dente FDI quando houver, tipo de caso, data. Ação: adicionar. Acima de 20 MB, o envio é recusado na própria tela. Sem lista de formatos proibidos.

Excluir não some na hora: a imagem fica recuperável, com ação `Restaurar`. Não desenhe prazo técnico na interface; se precisar de nota, use a margem do frame, não um contador para o usuário.

### 29 — Próteses — todos

Um pedido por vez, em quatro etapas, sempre nesta ordem:

1. Pedido: tipo, paciente, um ou mais dentes FDI, profissional responsável, laboratório (texto livre).
2. Envio: saída para o laboratório e prazo de retorno.
3. Conferência: peça retornou, atraso ou ajuste.
4. Instalação: conclusão e valor da comissão, digitado, não calculado.

Ação em qualquer etapa: `Descontinuar`. O pedido descontinuado permanece no histórico.

No odontograma, o dente do pedido mostra a prótese. Não desenhe cadastro de laboratórios.

### 30 — Trilha de auditoria — admin

Só no frame do Admin, no fim do prontuário. Lista: o que mudou (anamnese, evolução, documento, odontograma), quem alterou e quando. Vazio: `Nenhum registro na trilha.` Dentista e Recepcionista não veem esta seção.

---

## 06 Operação

Desenhe depois da consulta e do prontuário.

### 31 — Estoque — todos

Lista de materiais: nome, quantidade válida, quantidade mínima, validade do lote. Abaixo do mínimo, a linha fica vermelha, com nome e quantidade.

Ações: cadastrar material, reabastecer (quantidade e validade; isso cria um lote), ver histórico de entradas e baixas.

Na conclusão da consulta, como painel ligado ao frame 19 e não como tela solta: quantidade usada de cada material, preenchida com o padrão do procedimento e editável por Dentista ou Admin. Se não houver quantidade bastante, a consulta continua concluída e o aviso diz qual material e quanto faltou. Não desenhe saldo negativo nem reserva no agendamento.

### 32 — Sino — todos

Ícone no canto superior. Abre a lista das notificações da pessoa. As críticas permanecem até a situação acabar, mesmo que o dashboard as esconda.

Textos de exemplo, um item cada:

- Paciente em espera, para o dentista daquele agendamento.
- Retorno a reagendar, para as recepcionistas.
- Cancelamento para comunicar o paciente, para as recepcionistas.
- Falha de envio ao paciente, para as recepcionistas.
- Estoque abaixo do mínimo, baixa insuficiente, cadeira indisponível, fora de horário, dentista removido, atraso de prótese: para toda a clínica.

Não desenhe e-mail nem SMS saindo do sino. O sino é interno.

### 33 — Dashboard — todos

Página em rolagem vertical. Período escolhido por quem usa.

Blocos: faturamento no período, faturamento por dentista, faturamento por procedimento, valores recebidos, despesa de prótese (fora do faturamento), ocupação da agenda, materiais abaixo do mínimo em vermelho.

O Admin tem um controle para ocultar blocos por papel. Cada pessoa pode ocultar um bloco só na própria visão. Bloco oculto no dashboard continua no sino se for crítico.

Ações: exportar PDF e exportar Excel. Não desenhe visão de mês da agenda aqui.

### 34 — Mensagens — admin

Modelos de texto da clínica, únicos, sem variação por procedimento. Variáveis visíveis: nome do paciente e data do horário.

Dois usos anotados na margem, não como botões de envio manual: mensagem ao criar agendamento e lembretes 24 h e 5 h antes, só pelo canal preferido, só se o horário ainda não passou.

Não desenhe envio ao cancelar nem ao marcar retorno. Não desenhe tela do paciente recebendo a mensagem.

---

## Protótipo

- `10 Pacientes` linha → `20 Prontuário`.
- `14 Agenda` horário → detalhe → `17 Chegada` ou `18 Iniciar` → `19 Evolução` → status `concluído` na agenda.
- `15 Cancelar` com `Sim` → `12 Agendamentos` preenchido com o mesmo paciente, dentista e procedimento.
- `16 Retornos` da Recepcionista → `12 Agendamentos`.

Etiqueta no canto de cada frame: `Etapa 2`.

## Checklist

- `Salvar evolução` é a única conclusão da consulta.
- `cancelado` está riscado e continua na grade.
- Só o Admin quita. Só o Dentista gera documento.
- Recepcionista não preenche anamnese, evolução, odontograma nem plano.
- Nenhuma tela usa sinônimo de evolução, débito, retorno ou agendamento.
- O caminho mínimo da etapa 1 permanece intacto: entrar, clínica, dentista, paciente, agendamento, agenda.
