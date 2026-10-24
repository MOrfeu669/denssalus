# Ambiente Cursor

Repositório de referência de ambinte com desenvolvimento assistido. Não há produto aqui: as pastas existem para o agente saber onde cada peça mora. Regras, skills, agentes e o `mcp.json` já estão no repositório. O que falta na máquina é o Cursor, o Node.js, o Git e as CLIs que alimentam os MCPs.

## Pré-requisitos

- Windows 10 ou superior, com PowerShell.
- [Cursor](https://cursor.com) instalado, com acesso a modelos (Fable, Opus, Sonnet, Haiku ou equivalentes).
- Git, com este repositório clonado. Worktree e o MCP do GitHub dependem disso.
- Node.js 20 ou superior, com `node` e `npx` no `PATH`.
- Conta GitHub, para autenticar o MCP do GitHub no Cursor.

Confira as versões:

```powershell
node -v
npx -v
git --version
```



## Instalação



### 1. Abrir o repositório no Cursor

```powershell
git clone <url-do-repositorio>
cd "<caminho-do-repositorio>"
```

Abra essa pasta no Cursor. As regras em `.cursor/rules`, as skills em `.cursor/skills`, os agentes em `.cursor/agents` e o `.cursor/mcp.json` passam a valer neste projeto.

### 2. Instalar o Codebase Memory

O `install.ps1` na raiz instala só o binário `codebase-memory-mcp`. Ele não configura o restante do ambiente. O destino padrão é `%LOCALAPPDATA%\Programs\codebase-memory-mcp`.

Inspecione o script antes de executar. Se o arquivo veio de download, remova a marca da web:

```powershell
Unblock-File .\install.ps1
powershell -ExecutionPolicy Bypass -File .\install.ps1
```

Para baixar o instalador oficial em vez de usar o que está no repositório:

```powershell
Invoke-WebRequest -Uri https://raw.githubusercontent.com/DeusData/codebase-memory-mcp/main/install.ps1 -OutFile install.ps1
Unblock-File .\install.ps1
powershell -ExecutionPolicy Bypass -File .\install.ps1
```

Feche e abra o terminal e confirme:

```powershell
codebase-memory-mcp --version
```



### 3. Autenticar o Context7

O servidor já está declarado em `.cursor/mcp.json`. A autenticação é por máquina. Com Node.js 18 ou superior:

```powershell
npx ctx7 setup --cursor
```

O comando abre o fluxo OAuth, gera a chave e registra o MCP no Cursor. Se você já tem uma chave:

```powershell
npx ctx7 setup --cursor --api-key SUA_CHAVE
```

Não commite a chave. Se o setup gravar `--api-key` dentro de `.cursor/mcp.json`, tire esse valor do arquivo versionado e use a configuração local do Cursor.

### 4. Conectar os MCPs no Cursor

O arquivo do projeto já declara os três servidores:


| MCP             | Declaração                           | Função                            |
| --------------- | ------------------------------------ | --------------------------------- |
| Context7        | `npx -y @upstash/context7-mcp`       | Documentação atual de bibliotecas |
| GitHub          | `https://api.githubcopilot.com/mcp/` | Issues, pull requests e checks    |
| Codebase Memory | comando `codebase-memory-mcp`        | Índice em grafo do código         |


Recarregue a janela do Cursor. Em **Settings → MCP**, os três devem aparecer conectados. O GitHub pede login na primeira vez. O Codebase Memory só conecta depois que o binário está no `PATH` e o terminal foi reiniciado.

### 5. Indexar o código

Na raiz do repositório:

```powershell
codebase-memory-mcp cli index_repository --repo-path "$PWD" --persistence true
codebase-memory-mcp cli list_projects
```

A primeira indexação cria `.codebase-memory/` na máquina. Essa pasta é dado local do índice, não código do projeto.

Para reindexar ao abrir uma sessão MCP deste repositório:

```powershell
codebase-memory-mcp config set auto_index true
```

Perguntas estruturais ("como funciona X?") passam por esse índice antes de varrer arquivo.

### 6. CLIs de economia de tokens

Opcionais. Instale e teste com uma pergunta simples sobre o código.

**RTK** comprime a saída de comandos antes dela entrar no contexto. No Cursor:

```powershell
winget install rtk-ai.rtk
rtk init -g --agent cursor
```

Reinicie o Cursor depois do `rtk init`.

**Caveman** é um agente de terminal com compressão de saída. Exige Node.js 20 ou superior:

```powershell
npm install -g @juliusbrussee/caveman-code
caveman --version
```

O harness deste repositório continua sendo o Cursor. O Caveman não substitui as regras, skills e agentes da pasta `.cursor`.

### 7. visualização de código e navegação de código-fonte

```bash
codebase-memory-mcp daemon start --open --port=9749
```



## O que já está configurado


| Pasta              | Conteúdo                                                      |
| ------------------ | ------------------------------------------------------------- |
| `.cursor/rules`    | Regras por área. Só o guardrail é sempre ativo.               |
| `.cursor/skills`   | Skills mínimas: `api` e `find-skill`.                         |
| `.cursor/agents`   | `code-review` e `release-notes`, cada um com ponto de parada. |
| `.cursor/mcp.json` | Context7, GitHub e Codebase Memory.                           |
| `specs`            | Uma spec por funcionalidade.                                  |
| `src/domain`       | Regras de negócio. A action chama o domínio.                  |
| `src/app`          | Telas e Server Actions.                                       |
| `tests`            | Testes do fluxo.                                              |
| `.seeds`           | Manual e os dez passos da aula.                               |


Regras injetadas pelo caminho do arquivo:


| Arquivo                       | Quando entra                                            |
| ----------------------------- | ------------------------------------------------------- |
| `.cursor/rules/guardrail.mdc` | Sempre                                                  |
| `.cursor/rules/backend.mdc`   | `src/domain/**/*` e `src/lib/**/*`                      |
| `.cursor/rules/frontend.mdc`  | `src/app/**/*`                                          |
| `.cursor/rules/prompt.mdc`    | `specs/**/*.md`                                         |
| `.cursor/rules/tests.mdc`     | arquivos `*.test.ts`, `*.spec.ts` e equivalentes em TSX |




## Modelos


| Uso                                      | Modelo |
| ---------------------------------------- | ------ |
| Segurança de fluxo e produto             | Fable  |
| Quebrar spec e raciocínio                | Opus   |
| Código do dia                            | Sonnet |
| Ler doc ou código, com a spec já fechada | Haiku  |


Effort maior só quando a spec pede raciocínio. Tarefa cotidiana fica no modelo do dia.

## Fluxo de uma tarefa

1. Ler a spec em `specs/`.
2. Ler o `AGENTS.md` da pasta em que o arquivo será criado.
3. Implementar, testar, refatorar e medir coverage.
4. Parar quando o critério da spec passar.

Trabalhe no modo orquestrado: um chat por tarefa, com a instrução completa. Review e release notes são agentes, não skills. Cada um declara onde para. Worktree é um diretório Git isolado por agente; o merge volta para a branch da tarefa.

## Validar

- Peça uma action de domínio e confira se entrou a regra de `src/domain/`, sem regra de tela.
- Peça uma tela em `src/app/` e confira se entrou a regra de front. O callback de autenticação é o único caso da skill `api`.
- Pergunte "como funciona o health check?" e veja se a resposta cita `src/domain/health.ts`.
- Rode uma spec pequena até o critério de pronto, sem o agente abrir a tarefa seguinte.



## Checklist

- [ ] Cursor, Git e Node.js 20+ instalados
- [ ] `codebase-memory-mcp --version` responde depois de reiniciar o terminal
- [ ] Context7 autenticado, sem chave commitada
- [ ] Context7, GitHub e Codebase Memory conectados no Cursor
- [ ] `index_repository` concluído para este repositório
- [ ] RTK e Caveman instalados, se for usar as CLIs
- [ ] Uma pergunta de domínio e uma de tela injetaram só a regra da área