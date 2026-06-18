#!/usr/bin/env bash
# ============================================================
#  scripts/setup-local.sh
#  Fase 1 — Setup completo e smoke test da stack local
#  Uso: chmod +x scripts/setup-local.sh && ./scripts/setup-local.sh
# ============================================================

set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
ok()   { echo -e "${GREEN}✓${NC} $1"; }
warn() { echo -e "${YELLOW}!${NC} $1"; }
fail() { echo -e "${RED}✗${NC} $1"; exit 1; }

echo ""
echo "=================================================="
echo " RAG Greenfield — Setup Local (Fase 1)"
echo "=================================================="
echo ""

# ----------------------------------------------------------
# Pré-requisitos
# ----------------------------------------------------------
echo "→ Verificando pré-requisitos..."
command -v docker   >/dev/null 2>&1 || fail "Docker não encontrado. Instale o Docker Engine."
command -v docker compose version >/dev/null 2>&1 || fail "Docker Compose v2 não encontrado."
ok "Docker $(docker --version | cut -d' ' -f3 | tr -d ',')"

# ----------------------------------------------------------
# Subir a stack
# ----------------------------------------------------------
echo ""
echo "→ Subindo containers..."
docker compose -f docker-compose.local.yml up -d --build

echo ""
echo "→ Aguardando postgres ficar saudável..."
TRIES=0
until docker compose -f docker-compose.local.yml exec -T postgres \
  pg_isready -U raguser -d ragdb >/dev/null 2>&1; do
  TRIES=$((TRIES+1))
  [ $TRIES -ge 30 ] && fail "Postgres não ficou saudável em 60s"
  sleep 2
done
ok "Postgres saudável"

echo ""
echo "→ Verificando Ollama no HOST (localhost:11434)..."
if ! curl -sf http://localhost:11434/api/tags >/dev/null 2>&1; then
  fail "Ollama não está acessível em localhost:11434. Inicie o Ollama no host ou use docker-compose.gpu.yml em máquina com GPU NVIDIA."
fi
ok "Ollama disponível no host"

# ----------------------------------------------------------
# Verificar modelos necessários no Ollama do host
# ----------------------------------------------------------
echo ""
echo "→ Verificando modelos Ollama..."
MODELS=$(curl -sf http://localhost:11434/api/tags | grep -o '"name":"[^"]*"' | cut -d'"' -f4 || echo "")

if echo "$MODELS" | grep -q "nomic-embed-text"; then
  ok "nomic-embed-text disponível"
else
  warn "Baixando nomic-embed-text (embedding model)..."
  ollama pull nomic-embed-text:latest
  ok "nomic-embed-text instalado"
fi

if echo "$MODELS" | grep -q "qwen2.5-coder"; then
  ok "qwen3-coder disponível"
else
  warn "Qwen3-Coder:latest NÃO encontrado. Execute: ollama pull Qwen3-Coder:latest"
fi

# ----------------------------------------------------------
# Aguardar a API NestJS
# ----------------------------------------------------------
echo ""
echo "→ Aguardando RAG API iniciar..."
TRIES=0
until curl -sf http://localhost:3000/rag/health >/dev/null 2>&1; do
  TRIES=$((TRIES+1))
  if [ $TRIES -ge 40 ]; then
    warn "API demorou mais que o esperado. Verificando logs..."
    docker compose -f docker-compose.local.yml logs --tail=30 rag-api
    fail "API não respondeu em 80s"
  fi
  sleep 2
done
ok "RAG API disponível em http://localhost:3000"

# ----------------------------------------------------------
# Smoke test
# ----------------------------------------------------------
echo ""
echo "→ Smoke test: /rag/health..."
HEALTH=$(curl -sf http://localhost:3000/rag/health)
echo "   Resposta: $HEALTH"
ok "Health check OK"

echo ""
echo "→ Smoke test: ingestão de documento..."
INGEST=$(curl -sf -X POST http://localhost:3000/rag/ingest \
  -H 'Content-Type: application/json' \
  -d '{"content": "NestJS é um framework Node.js para construção de APIs escaláveis.","metadata":{"source":"smoke-test"}}')
echo "   Resposta: $INGEST"
DOC_ID=$(echo "$INGEST" | grep -o '"id":"[^"]*"' | cut -d'"' -f4 || echo "")
[ -z "$DOC_ID" ] && fail "Ingestão falhou — sem ID retornado"
ok "Documento ingerido: $DOC_ID"

echo ""
echo "→ Smoke test: busca vetorial..."
SEARCH=$(curl -sf "http://localhost:3000/rag/search?q=NestJS+framework&topK=1")
echo "   Resposta: $SEARCH"
ok "Busca vetorial OK"

# ----------------------------------------------------------
# Resultado
# ----------------------------------------------------------
echo ""
echo "=================================================="
echo -e " ${GREEN}Fase 1 concluída com sucesso!${NC}"
echo "=================================================="
echo ""
echo " API:      http://localhost:3000"
echo " Postgres: localhost:5432 (ragdb / raguser / ragpass)"
echo " Ollama:   http://localhost:11434 (host)"
echo ""
echo " GPU NVIDIA em container:"
echo " docker compose -f docker-compose.local.yml -f docker-compose.gpu.yml up -d --build"
echo " docker compose -f docker-compose.local.yml -f docker-compose.gpu.yml exec ollama ollama pull nomic-embed-text:latest"
echo ""
echo " Próximo: Fase 2 — pipeline query completo (POST /rag/query)"
echo ""
