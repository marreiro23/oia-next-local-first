#!/usr/bin/env bash
set -euo pipefail

MODELS=(
  "oia_next_full"
  "oia_next_reviewer"
  "oia_next_rag"
  "oia_next_devops"
)

echo "== Validando agentes Ollama =="

for MODEL in "${MODELS[@]}"; do
  echo
  echo "== Validando ${MODEL} =="

  if ollama show "${MODEL}:latest" >/dev/null 2>&1 || ollama show "${MODEL}" >/dev/null 2>&1; then
    echo "[OK] Modelo encontrado: ${MODEL}"
  else
    echo "[FAIL] Modelo não encontrado: ${MODEL}"
    exit 1
  fi
done

echo
echo "== Teste rápido de resposta =="
ollama run oia_next_full "Responda em pt-BR, em uma frase: qual é seu papel no projeto OIA Next?"

echo
echo "[OK] Todos os agentes foram validados."