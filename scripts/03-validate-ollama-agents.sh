#!/usr/bin/env bash
set -euo pipefail

models=("oia_next_full" "oia_next_reviewer" "oia_next_rag" "oia_next_devops")

for model in "${models[@]}"; do
  printf '\n== Validando %s ==\n' "$model"
  if ! ollama list | awk '{print $1}' | grep -qx "$model"; then
    printf '[FAIL] Modelo não encontrado: %s\n' "$model"
    exit 1
  fi

  printf 'Responda em uma frase qual é sua função no OIA Next.\n' | ollama run "$model" || {
    printf '[FAIL] Falha ao executar modelo: %s\n' "$model"
    exit 1
  }
done

printf '\n[OK] Todos os agentes responderam.\n'
