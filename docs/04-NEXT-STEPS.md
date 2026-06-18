# OIA Next — Next Steps Recomendados

## Prioridade 1 — Fechar base operacional dos agentes

1. Criar os Modelfiles com prompt enxuto.
2. Criar os modelos Ollama com nomes válidos.
3. Configurar OLLA CHAT apontando para `oia_next_full`.
4. Validar alternância manual entre `full`, `reviewer`, `rag` e `devops`.

## Prioridade 2 — Fechar RAG de Projeto

1. Confirmar entities e migrations do RAG.
2. Criar índice vetorial pgvector.
3. Implementar upsert real por path/hash/chunkIndex.
4. Implementar ou revisar `scripts/ingest-project.ts`.
5. Validar ingestão incremental sem duplicar chunks.
6. Validar `/rag/prompt`.

## Prioridade 3 — Governança técnica

1. Criar pasta `docs/adr`.
2. Registrar ADR sobre arquitetura local-first + Ollama + pgvector.
3. Registrar ADR sobre estratégia de agentes especializados.
4. Criar checklist de PR ou merge local.

## Prioridade 4 — Hardening

1. Adicionar testes unitários para `ChunkingService`, `EmbeddingService` e `PgVectorStoreService`.
2. Adicionar teste e2e para `/rag/prompt`.
3. Adicionar health checks de Ollama e Postgres.
4. Adicionar logs estruturados com requestId.
5. Revisar `.env.example`.

## Prioridade 5 — Evolução

1. Suporte a PDF e Markdown técnico.
2. Histórico de interações RAG em `rag-interaction`.
3. Avaliação automática de qualidade do retrieval.
4. Dashboard simples de chunks indexados.
5. Integração com pipeline CI/CD.
