-- ============================================================
--  RAG Greenfield — Inicialização PostgreSQL + pgvector
--  Executado automaticamente na primeira inicialização
--  do container postgres.
-- ============================================================

-- Habilita a extensão pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Confirma instalação
DO $$
BEGIN
  RAISE NOTICE 'pgvector instalado: %', (SELECT extversion FROM pg_extension WHERE extname = 'vector');
END;
$$;
