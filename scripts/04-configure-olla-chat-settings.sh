#!/usr/bin/env bash
set -euo pipefail

SETTINGS_DIR=".vscode"
SETTINGS_FILE="$SETTINGS_DIR/settings.json"

mkdir -p "$SETTINGS_DIR"

if [ -f "$SETTINGS_FILE" ]; then
  cp "$SETTINGS_FILE" "$SETTINGS_FILE.bak.$(date +%Y%m%d%H%M%S)"
  printf '[WARN] Backup criado para settings.json existente.\n'
fi

cat > "$SETTINGS_FILE" <<'JSON'
{
  "olla-chat.ollamaUrl": "http://localhost:11434",
  "olla-chat.ollamaModel": "oia_next_full",
  "olla-chat.defaultMode": "plan",
  "olla-chat.approvalPolicy": "human_gated",
  "olla-chat.contextPolicy": "manual_only",
  "olla-chat.temperature": 0.3
}
JSON

printf '[OK] Configuração OLLA CHAT gravada em %s\n' "$SETTINGS_FILE"
printf '[INFO] Altere o modelo no picker do OLLA CHAT quando quiser usar reviewer, rag ou devops.\n'
