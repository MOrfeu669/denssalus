# Etapa 1 — Até a agenda

Leia este arquivo inteiro antes de desenhar. Pare no fim. Consulta, prontuário, retorno, cancelamento e operação estão em `docs/FLUXO_USUARIO_FIGMA_ETAPA_2.md`. Não desenhe esses frames agora.

O Denssalus é a gestão de uma clínica odontológica. Quem entra é Admin, Dentista ou Recepcionista. O paciente não autentica e não tem tela. O texto da interface fica em português do Brasil.

Cada bloco numerado é um frame. Nomeie como `NN — Nome — papel`. Exemplo: `08 — Pacientes — todos`.

## Como desenhar

1. Crie as páginas `00 Fundamentos`, `01 Entrar`, `02 Preparar a clínica` e `03 Agenda`.
2. No frame feliz, desenhe o conteúdo e a ação principal. À margem, anote vazio, erro e sem permissão quando mudam o que se vê.
3. Ligue o protótipo nesta ordem: Entrar, Continuar, Início, Clínica, Dentistas, Pacientes, Agendamentos, Agenda. O horário criado aparece na grade.
4. Escolha o layout (barra lateral ou topo) e mantenha a casca igual depois do login. Não copie a aparência atual do código: ela é provisória.
5. Não invente tela, campo, papel, sinônimo nem fluxo marcado como fora ou pendente.

## Vocabulário

Use estas palavras. Não troque por sinônimo.

| Termo | Significado na tela |
| --- | --- |
| Clínica | A clínica de quem está logado. Não há seletor de outra clínica. |
| Cadeira | Posto de atendimento. Qualquer dentista usa qualquer cadeira ativa. |
| Dentista | Profissional da clínica, com CRO. Especialidade é só informação. |
| Paciente | Cadastro da clínica. Não é usuário. |
| Procedimento | Nome, tempo médio e valor médio. São estimativas. |
| Agendamento | Horário de um paciente com um dentista e uma cadeira. |
| Agenda | Grade do dia ou da semana. |
| Bloqueio de agenda | Intervalo em que o dentista não recebe agendamento novo. |

Status do agendamento, escritos assim na grade: `agendado`, `em espera`, `iniciado`, `concluído`, `cancelado`. Nesta etapa a grade só precisa mostrar `agendado` no caminho feliz. Os outros status aparecem como rótulo possível; as ações que os produzem ficam na etapa 2.

Termos da etapa 2, para não serem rebatizados lá: prontuário, evolução, débito, retorno.

## Quem vê o quê

Há um papel por pessoa. O Admin pode o que o Dentista pode, com as exceções anotadas no frame.

| Área | Admin | Dentista | Recepcionista |
| --- | --- | --- | --- |
| Entrar, sair, recuperar senha | sim | sim | sim |
| Usuários | sim | não | não |
| Clínica e cadeiras | sim | não | não |
| Dentistas | sim | não | não |
| Pacientes | sim | sim | sim |
| Procedimentos | cria e edita; só ele exclui | cria e edita | não |
| Agendamento e agenda | sim | sim | sim |
| Bloqueio de agenda | sim | sim | não |

Mensagem exata quando o papel não pode: `Ação não permitida para seu papel`.

O menu desta etapa só lista as áreas da tabela. Não coloque Mensagens, Retornos, Estoque, Dashboard nem Prontuário.

## Casca depois do login

Todo frame autenticado mostra:

- Nome da clínica, nome de quem entrou e o papel.
- Ação `Sair`.
- Navegação só com as áreas desta etapa. Área proibida não aparece no menu.
- Conteúdo da tela.
- Aviso de sucesso ou erro perto da ação, com foco visível nesse aviso depois dela.
- Em falha de carregamento, a mensagem e a ação `Tentar de novo`.

Não desenhe o sino. Não desenhe portal do paciente, várias clínicas no mesmo login, Super Admin, contagem regressiva de sessão nem visão de mês na agenda.

## Estados

O frame feliz basta. Acrescente frame separado só quando o estado muda a estrutura:

- **Vazio** — a lista não tem item e o texto diz o que falta. Exemplo: `Nenhum paciente cadastrado nesta clínica.`
- **Erro** — alerta e `Tentar de novo`.
- **Sucesso** — a mensagem confirma o que passou a existir (sessão aberta, clínica salva, cadastro na lista, horário na grade).
- **Sem permissão** — só o alerta `Ação não permitida para seu papel` e `Voltar`.
- **Carregando** — o botão da ação mostra o gerúndio (`Entrando…`, `Salvando…`) e fica inativo.

## Fora desta etapa

Não desenhe, porque a decisão ainda não existe ou porque pertence à etapa 2:

- Foto do dentista.
- Exportar ou importar pacientes.
- Série recorrente do bloqueio. Desenhe só início, fim e motivo.
- Antecedência máxima para agendar.
- Variação de papel para registrar emergência. A ação fica no agendamento, sem moldura de "só este papel".
- Itens de plano de tratamento no agendamento. A escolha desta etapa é nenhuma ou um procedimento.
- Cancelar, reagendar, retorno, chegada, iniciar, evolução, prontuário, estoque, sino, dashboard e modelos de mensagem.

## Caminho mínimo

Este é o protótipo inteiro da etapa 1. O procedimento não é passo obrigatório.

1. Admin entra.
2. Configura a clínica com ao menos uma cadeira ativa.
3. Cadastra um dentista ativo.
4. Cadastra um paciente, com nome e um canal.
5. Cria um agendamento `agendado`.
6. Abre a agenda e vê esse horário.

Dentista e Recepcionista não fazem os passos 2 e 3. Se faltar clínica, cadeira ativa ou dentista ativo, o início deles diz: `O Admin ainda precisa configurar a clínica e cadastrar um dentista.` Sem link para essas telas.

---

## 01 Entrar

### 01 — Entrar — todos

Campos: E-mail, Senha. Ação: `Entrar`. Link: `Esqueci a senha`.

Sucesso: mensagem de sessão aberta e link `Continuar` para o Início. Erro de senha: `Credenciais inválidas`. Sem sessão, nenhuma área interna aparece.

### 02 — Esqueci a senha — todos

Campo: E-mail. Ação: enviar o pedido de redefinição. Link: `Voltar ao login`. Sucesso: aviso de que o e-mail foi enviado, sem dizer se a conta existe.

### 03 — Nova senha — todos

Campos: nova senha e confirmação. Ação: salvar. Sucesso: volta para Entrar. Este frame abre a partir do link do e-mail, fora do menu.

### 04 — Início — admin

Depois de `Continuar`. Mostra quem entrou e o papel.

Guia do caminho mínimo, em ordem, com um único botão no passo atual:

1. `Configurar a clínica`
2. `Cadastrar dentista`
3. `Cadastrar paciente`
4. `Criar agendamento`
5. `Ver na agenda`

Passos anteriores aparecem concluídos. Os seguintes aparecem sem ser o botão principal. Abaixo do guia, o menu: Usuários, Clínica, Dentistas, Procedimentos, Pacientes, Agendamentos, Agenda.

### 05 — Início — dentista e recepcionista

O guia começa em `Cadastrar paciente`. Se a base não existe, o texto de espera pelo Admin substitui os dois primeiros passos e não há link para Clínica nem Dentistas. Menu sem Usuários, Clínica e Dentistas. Recepcionista também não vê Procedimentos.

---

## 02 Preparar a clínica

Ordem do Admin no primeiro uso: Usuários, Clínica, Dentistas, Pacientes, Procedimentos. Procedimento pode ficar para depois do primeiro agendamento.

### 06 — Usuários — admin

Cadastrar Dentista ou Recepcionista: nome, e-mail, senha, papel. A lista mostra nome e papel. Ação por linha: `Remover acesso`. Não há ação de remover a si mesmo.

Sucesso: a pessoa aparece na lista. Vazio: `Nenhum usuário cadastrado nesta clínica.`

Anote no frame: remover o acesso não apaga agendamento nem prontuário. Não desenhe tela de confirmação que prometa apagar dado clínico.

### 07 — Clínica — admin — ainda sem clínica

Título: `Clínica`. Texto: `Esta conta ainda não tem clínica. Crie a clínica para configurar horário e cadeiras.`

Campos: nome, dias da semana (qualquer combinação, inclusive fim de semana), horário de abertura, horário de fechamento, quantidade de cadeiras (mínimo 1). Sugestão visível: 08:00–18:00. Um horário vale para todos os dias marcados.

Ação: criar. Sucesso: a clínica salva e as cadeiras listadas (`Cadeira 1`, `Cadeira 2`…).

### 08 — Clínica — admin — já existe

Mostra nome, dias, horário e a lista de cadeiras. Ações: salvar horário e dias, `Adicionar cadeira`, `Desativar` em cada cadeira ativa.

Não desenhe cadeira presa a procedimento ou a dentista.

Anote na margem, sem desenhar a tela: um agendamento futuro em cadeira desativada, ou fora do horário novo, continua marcado. Não há cancelamento automático.

### 09 — Dentistas — admin

Campos: nome, CRO, telefone, CPF, especialidade (texto informativo; pode haver mais de uma). Ações: `Cadastrar dentista`, editar, `Remover`.

Lista com nome, CRO e se está ativo. Vazio: nenhum dentista cadastrado. Sem foto.

Anote: o cadastro também cria o acesso de papel Dentista. Remover tira agendamentos novos com ele; os já marcados ficam.

### 10 — Pacientes — todos

Lista em ordem de nome. Vazio: `Nenhum paciente cadastrado nesta clínica.`

Cadastro obrigatório: nome completo e ao menos um canal. Canal: tipo `SMS`, `E-mail` ou `WhatsApp`, mais o contato. Vários canais, exatamente um marcado como preferido.

Opcionais: CPF, endereço, data de nascimento, sexo (`masculino`, `feminino`, `outro`). A idade não é campo; se houver nascimento, mostre a idade calculada na lista ou no detalhe.

Se a data de nascimento indica menos de 18 anos, o formulário passa a exigir responsável: nome completo e CPF. Telefone do responsável é opcional. Sem data de nascimento, não mostre o bloco do responsável.

Erro de CPF repetido na clínica: aponte o paciente que já existe. Não desenhe importar nem exportar.

A edição da visão geral fica nesta lista. A linha ainda não abre outra página.

### 11 — Procedimentos — admin e dentista

Campos: nome, tempo médio, valor médio. Texto curto de que tempo e valor são estimativas. Ações: criar, editar. `Excluir` só no frame do Admin; no frame do Dentista o controle não existe.

Vazio: nenhum procedimento cadastrado. Não desenhe material neste frame. Não desenhe especialidade exigida.

---

## 03 Agenda

### 12 — Agendamentos — todos

Formulário de novo agendamento:

- Paciente
- Dentista (somente ativos)
- Cadeira (somente ativas)
- Início e fim
- Opcional: nenhum ou um procedimento

Se houver procedimento, o fim pode vir sugerido pelo tempo médio e continua editável.

Ação: `Criar agendamento`. Sucesso: o horário entra na lista com status `agendado`.

Erros visíveis, um por vez, em linguagem da clínica: cadeira ocupada, cadeira inativa, dentista inativo ou ocupado, paciente já agendado naquele horário, dia fora dos dias de atendimento, horário fora do funcionamento. Não desenhe reserva de material.

Ação secundária no mesmo frame: `Registrar emergência`. Mesmos campos, sem os erros de conflito. O horário pode estar no passado. Não marque um papel como dono dessa ação.

Lista dos agendamentos da clínica com paciente, dentista, cadeira, intervalo e status.

### 13 — Bloqueio de agenda — admin e dentista

Campos: dentista, início, fim, motivo opcional. Ação: `Bloquear`. Não desenhe repetição semanal, diária nem exceção de uma ocorrência.

O bloqueio aparece na grade e impede agendamento novo naquele intervalo.

### 14 — Agenda — todos

Grade de calendário. Controle `Dia` e `Semana`. Não desenhe `Mês`.

Filtros: dentista e cadeira, mais a data. Dentista e Recepcionista veem todos os dentistas da clínica, não só a própria coluna.

Cada horário mostra paciente, dentista, cadeira e status. Bloqueio aparece como intervalo sem paciente.

Alerta com cor distinta ou sinal `!` quando: cadeira desativada, dentista removido, horário `fora de horário`. O horário não some.

Anote no frame que a grade muda sozinha quando outra pessoa cria um horário, sem botão de atualizar. Não desenhe ação de cancelar, chegar nem iniciar.

Estados: dia sem horários; erro de carregamento com `Tentar de novo`.

---

## Protótipo

- `01 Entrar` sucesso → `04 Início`.
- `04 Início` → o botão do passo atual → o frame desse passo → `Voltar` ao Início, com o passo seguinte em destaque.
- O último frame do caminho é a agenda com o horário `agendado` visível.

Etiqueta no canto de cada frame: `Etapa 1`.

## Checklist

- O paciente não tem frame.
- Não há seletor de clínica nem mês na agenda.
- Os três papéis têm menu diferente, só com as áreas desta etapa.
- O caminho mínimo chega a um horário `agendado` visível na grade, sem passar por procedimento.
- Cadeira desativada, dentista removido e `fora de horário` têm alerta e não somem.
- Nenhuma tela usa sinônimo de cadeira ou agendamento.
- Não há frame de consulta, prontuário, retorno, cancelamento, estoque, sino, dashboard nem mensagem.
