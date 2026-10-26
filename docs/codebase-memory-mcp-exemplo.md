# Exemplo de uso: Codebase Memory MCP

Sessão real neste repositório (`AI architeture DEV`). Serve de roteiro: indexar, persistir, visualizar, reindexar e corrigir erros comuns.

Pré-requisitos: binário `codebase-memory-mcp` no `PATH`, servidor MCP `codebase-memory` no `.cursor/mcp.json`, Cursor com o MCP conectado.

---

## 1. Indexar a base inteira (via MCP)

No agente, com o MCP `codebase-memory` (namespace típico: `user-codebase-memory-mcp`):

1. Chamar `index_repository` com:
   - `repo_path`: caminho absoluto do repositório
   - `mode`: `full` (estrutura + semântica)
   - `async`: `true` (evita timeout do cliente MCP)
2. Pollar o mesmo `repo_path` com `status: true` até `state` ser `succeeded`, `failed` ou `cancelled`.
3. Conferir com `index_status` (`project` = nome retornado, ex.: `C-Users-user-Desktop-AI-architeture-DEV`).

Resultado típico deste repo (primeira indexação):

| Campo | Valor |
| --- | --- |
| status | `ready` |
| nodes / edges | ~115 / ~146 |
| gaps | nenhum arquivo parcial / skipped / not_indexed |

Nome do projeto: use o `name` de `list_projects` (ou o `root_path` absoluto), nunca um apelido inventado.

---

## 2. Pasta local do índice (`.codebase-memory`)

A pasta no checkout **não** é `.codebase-memory-mcp` (isso é cache/instalação global). No repositório, a persistência escreve:

```text
.codebase-memory/
  graph.db.zst      # grafo comprimido
  artifact.json     # commit, indexed_at, nodes, edges
  .gitattributes    # trata graph.db.zst como binário no merge
```

### Via MCP

```json
{
  "repo_path": "C:\\Users\\user\\Desktop\\AI architeture DEV",
  "mode": "full",
  "persistence": true,
  "async": true
}
```

### Via CLI (PowerShell, na raiz)

```powershell
codebase-memory-mcp cli index_repository --repo-path "$PWD" --persistence true
codebase-memory-mcp cli list_projects
```

Sem `persistence: true`, o grafo fica no cache do daemon/MCP e **não** cria `.codebase-memory/` no repo.

---

## 3. Visualizar o grafo (CBM Lens)

Config típica: `ui_enabled = true`, porta `9749`.

1. Confirmar daemon / UI:

```powershell
codebase-memory-mcp daemon status
```

2. Abrir no navegador: [http://127.0.0.1:9749](http://127.0.0.1:9749)
3. Selecionar o projeto indexado (ex.: `C-Users-user-Desktop-AI-architeture-DEV`).

Se a UI não estiver no ar:

```powershell
codebase-memory-mcp daemon start --open
```

Para encerrar depois:

```powershell
codebase-memory-mcp daemon stop
```

---

## 4. Atualizar o índice após mudanças no código

O CBM serve um **snapshot**. Editar ou apagar arquivos no disco **não** remove nós do grafo até reindexar (salvo watch ativo no projeto da sessão).

### Reindexar (CLI)

```powershell
codebase-memory-mcp cli index_repository --repo-path "$PWD"
# ou, se quiser atualizar o artefato local:
codebase-memory-mcp cli index_repository --repo-path "$PWD" --persistence true
```

Modos:

| Modo | Uso |
| --- | --- |
| `full` | padrão; estrutura + semântica |
| `moderate` | filtrado + semântica |
| `fast` | só estrutura; diagnóstico rápido |

### Reindexar ao abrir sessão MCP

```powershell
codebase-memory-mcp config set auto_index true
```

### Relacionado (não substitui reindex)

`detect_changes` mapeia o diff do Git no grafo (impacto). Se o arquivo novo/apagado ainda não entrou na geração atual do índice, reindexe antes.

---

## 5. Por que arquivos excluídos ainda aparecem

| Causa | Efeito |
| --- | --- |
| Índice antigo | UI e tools mostram a geração anterior |
| Watch desligado (`not_session_project`) | FS muda, grafo não |
| `.codebase-memory/` desatualizado | artefato ainda descreve o estado velho |
| Aba da UI sem reload | Lens em cima da geração anterior |

Correção: reindexar → checar `indexed_at` em `index_status` / `artifact.json` → recarregar a UI.

---

## 6. Erro comum no PowerShell: path literal

### Sintoma

```text
codebase-memory-mcp cli index_repository --repo-path (Get-Location).Path
...
{"project":"...-Get-Location-.Path","status":"error",
 "hint":"Pipeline failed. Check repo_path exists and contains source files..."}
```

O `project` contém `Get-Location` no nome: o CLI recebeu o texto `(Get-Location).Path`, não o path absoluto. Em chamada a executável nativo, essa forma muitas vezes **não** expande.

### Correção

```powershell
codebase-memory-mcp cli index_repository --repo-path "$PWD"
# ou
codebase-memory-mcp cli index_repository --repo-path "$((Get-Location).Path)"
# ou path absoluto explícito
codebase-memory-mcp cli index_repository --repo-path "C:\Users\user\Desktop\AI architeture DEV"
```

Confirme antes:

```powershell
$PWD.Path
```

Sucesso: o `project` volta a ser `C-Users-user-Desktop-AI-architeture-DEV` (sem `Get-Location` no nome).

---

## 7. Ferramentas MCP mais usadas neste fluxo

| Tool | Quando |
| --- | --- |
| `index_repository` | criar / atualizar índice (`async` + `status`, `persistence`) |
| `list_projects` | descobrir o `project` correto |
| `index_status` | readiness, counts, gaps, `indexed_at` |
| `search_graph` / `trace_path` | perguntas estruturais depois do índice |
| `detect_changes` | impacto do diff Git (após índice fresco) |

Fluxo mental do agente: **índice → grafo → snippet**; só então varrer arquivo solto.

---

## Checklist rápido

- [ ] MCP `codebase-memory` conectado no Cursor
- [ ] `index_repository` com path absoluto válido (`"$PWD"`, não `(Get-Location).Path` cru)
- [ ] `index_status` → `ready`
- [ ] (opcional) `persistence: true` → pasta `.codebase-memory/`
- [ ] (opcional) UI em `http://127.0.0.1:9749`
- [ ] Após apagar/alterar código: reindexar e conferir `indexed_at`
