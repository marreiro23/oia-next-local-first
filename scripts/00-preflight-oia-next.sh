#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_ROOT="${OIA_PROJECT_ROOT:-${REPO_ROOT}/apps/rag-api}"

echo "== OIA Next preflight =="
echo "REPO_ROOT=${REPO_ROOT}"
echo "APP_ROOT=${APP_ROOT}"

if command -v ollama >/dev/null 2>&1; then
  echo "[OK] ollama encontrado: $(command -v ollama)"
else
  echo "[FAIL] ollama não encontrado"
  exit 1
fi

if ollama list | grep -q "qwen2.5-coder:14b"; then
  echo "[OK] modelo base já existe: qwen2.5-coder:14b"
else
  echo "[WARN] modelo qwen2.5-coder:14b não encontrado"
  echo "Execute: ollama pull qwen2.5-coder:14b"
fi

if [ -f "${APP_ROOT}/package.json" ]; then
  echo "[OK] package.json localizado em: ${APP_ROOT}/package.json"
else
  echo "[FAIL] package.json não encontrado em: ${APP_ROOT}"
  exit 1
fi

if [ -f "${REPO_ROOT}/docker-compose.local.yml" ]; then
  echo "[OK] docker-compose.local.yml localizado na raiz do repo"
elif [ -f "${APP_ROOT}/docker-compose.local.yml" ]; then
  echo "[OK] docker-compose.local.yml localizado em apps/rag-api"
else
  echo "[WARN] docker-compose.local.yml não localizado"
fi

echo
echo "Preflight concluído."