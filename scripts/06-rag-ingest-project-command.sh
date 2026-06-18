#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

DEFAULT_PROJECT_ROOT="${REPO_ROOT}/apps/rag-api"
PROJECT_ROOT="${OIA_PROJECT_ROOT:-$DEFAULT_PROJECT_ROOT}"

echo "== Ingestão do projeto no RAG =="
echo "REPO_ROOT=${REPO_ROOT}"
echo "PROJECT_ROOT=${PROJECT_ROOT}"

if [ ! -f "${PROJECT_ROOT}/package.json" ]; then
  echo "[FAIL] package.json não encontrado em: ${PROJECT_ROOT}"
  echo
  echo "Defina manualmente:"
  echo "  export OIA_PROJECT_ROOT=/caminho/para/apps/rag-api"
  echo "  ./scripts/06-rag-ingest-project-command.sh"
  exit 1
fi

cd "${PROJECT_ROOT}"

echo
echo "== Validando scripts npm disponíveis =="
npm run || true

echo
echo "== Procurando script de ingestão =="

if npm run | grep -q "rag:ingest"; then
  echo "[OK] Executando npm run rag:ingest"
  npm run rag:ingest
elif [ -f "scripts/ingest-project.ts" ]; then
  echo "[OK] Executando scripts/ingest-project.ts via ts-node"
  npx ts-node scripts/ingest-project.ts
elif [ -f "../../scripts/ingest-project.ts" ]; then
  echo "[OK] Executando ingest-project.ts da raiz do repositório"
  npx ts-node ../../scripts/ingest-project.ts
else
  echo "[WARN] Nenhum script de ingestão encontrado."
  echo
  echo "Crie uma das opções abaixo:"
  echo "  1. apps/rag-api/scripts/ingest-project.ts"
  echo "  2. scripts/ingest-project.ts"
  echo "  3. script npm no package.json:"
  echo '     "rag:ingest": "ts-node scripts/ingest-project.ts"'
  exit 0
fi