#!/usr/bin/env bash
set -euo pipefail

API_BASE_URL="${API_BASE_URL:-http://localhost:3000}"

printf '== Smoke test RAG ==\n'
printf 'API_BASE_URL=%s\n' "$API_BASE_URL"

printf '\n[1/2] GET /rag/health\n'
curl -fsS "$API_BASE_URL/rag/health" | jq . 2>/dev/null || curl -fsS "$API_BASE_URL/rag/health"

printf '\n\n[2/2] POST /rag/prompt\n'
curl -fsS -X POST "$API_BASE_URL/rag/prompt" \
  -H "Content-Type: application/json" \
  -d '{"task":"Validar se o módulo RAG está usando upsert por hash e path","topK":8}' \
  | jq . 2>/dev/null || true

printf '\n[OK] Smoke test enviado. Verifique se sources retornaram com path, chunkIndex e score.\n'
