# OIA Next — Métodos de Uso do RAG

## 1. Objetivo do RAG de Projeto

O RAG deve permitir que os agentes locais trabalhem com contexto atualizado do repositório OIA Next, evitando respostas genéricas e reduzindo retrabalho.

A fase atual é a **Fase 2 — RAG de Projeto**, com três entregas prioritárias:

1. **Upsert por metadata.hash/path**
2. **Script `scripts/ingest-project.ts`**
3. **Endpoint `POST /rag/prompt`**

---

## 2. Estrutura esperada do módulo RAG

```text
apps/llm-ops-api/src/modules/llm-ops/rag/
├── rag.module.ts
├── interfaces/
│   └── vector-store.interface.ts
├── services/
│   ├── embedding.service.ts
│   ├── chunking.service.ts
│   ├── pgvector-store.service.ts
│   └── rag-orchestrator.service.ts
├── entities/
│   ├── rag-document.entity.ts
│   ├── rag-chunk.entity.ts
│   └── rag-interaction.entity.ts
├── dto/
│   ├── ingest-document.dto.ts
│   ├── ask-rag.dto.ts
│   └── rag-search-result.dto.ts
└── migrations/
    └── 1750000000000-CreatePgVectorRagTables.ts
```

---

## 3. Regras de ingestão

### Obrigatório

- Nunca usar `INSERT` puro para chunks.
- Usar upsert por `metadata.path` + `metadata.hash` + `chunkIndex`.
- Se hash igual: ignorar.
- Se path/chunkIndex igual e hash diferente: atualizar.
- Reportar sempre: inseridos, atualizados, ignorados e erros.

### Metadados padrão

```json
{
  "path": "apps/llm-ops-api/src/modules/llm-ops/rag/services/rag-orchestrator.service.ts",
  "kind": "source",
  "language": "typescript",
  "chunkIndex": 0,
  "hash": "sha256-do-conteudo",
  "project": "oia-next"
}
```

---

## 4. Regras de chunking

| Tipo | Estratégia |
|---|---|
| TypeScript | Preferir imports + classe, métodos separados, interfaces/types separados |
| YAML/JSON | Um chunk por arquivo |
| SQL/Migration | Um chunk por arquivo |
| Markdown | 1500–3000 caracteres com overlap aproximado de 150 |
| Arquivos grandes | Dividir por blocos sem quebrar semântica |

Ignorar sempre:

```text
node_modules
dist
.git
.env
*.log
package-lock.json
*.map
```

---

## 5. Regras de embedding

- Usar `EmbeddingService`.
- `EmbeddingService` deve usar `OllamaProvider` injetado.
- Não usar `fetch` direto para Ollama dentro dos services de negócio.
- Modelo por variável: `OLLAMA_EMBEDDING_MODEL`.
- Batch recomendado: 10 a 20 chunks.
- Logar latência por batch.
- Não logar vetor completo.

---

## 6. Busca vetorial

- Usar operador `<=>` do pgvector para distância coseno.
- `topK` padrão: 8.
- Score mínimo recomendado: 0.70.
- Filtrar por `project = "oia-next"`.
- Retornar sempre `path`, `chunkIndex`, `score` e trecho de conteúdo.

---

## 7. Endpoint `/rag/prompt`

### Entrada

```json
{
  "task": "Criar endpoint para upload de PDF e ingestão automática",
  "topK": 8
}
```

### Fluxo interno

1. Validar DTO.
2. Gerar embedding da tarefa.
3. Buscar chunks mais relevantes no pgvector.
4. Montar prompt estruturado.
5. Retornar `prompt` e `sources`.

### Saída esperada

```json
{
  "prompt": "Prompt final estruturado para o agente",
  "sources": [
    {
      "path": "apps/llm-ops-api/src/modules/llm-ops/rag/services/chunking.service.ts",
      "chunkIndex": 0,
      "score": 0.91
    }
  ]
}
```

---

## 8. Método de uso no ciclo de desenvolvimento

1. Alterou código relevante? Reindexar.
2. Precisa implementar algo? Chamar `/rag/prompt` com a tarefa.
3. Copiar o prompt retornado para OLLA CHAT em modo Plan ou Agent.
4. Usar `oia_next_full` para desenvolvimento.
5. Usar `oia_next_reviewer` para validação.
6. Registrar decisão técnica quando houver mudança arquitetural.
