#!/usr/bin/env bash
set -euo pipefail

MODELFILES_DIR=".olla/modelfiles"

create_model() {
  local name="$1"
  local file="$2"

  if [ ! -f "$file" ]; then
    printf '[FAIL] Modelfile não encontrado: %s\n' "$file"
    exit 1
  fi

  printf '\n== Criando modelo: %s ==\n' "$name"
  ollama create "$name" -f "$file"
}

create_model "oia_next_full"     "$MODELFILES_DIR/Modelfile.full"
create_model "oia_next_reviewer" "$MODELFILES_DIR/Modelfile.reviewer"
create_model "oia_next_rag"      "$MODELFILES_DIR/Modelfile.rag"
create_model "oia_next_devops"   "$MODELFILES_DIR/Modelfile.devops"

printf '\n== Modelos disponíveis ==\n'
ollama list | grep -E 'oia_next_|NAME' || true
