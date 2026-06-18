#!/usr/bin/env bash
set -euo pipefail

printf '== Ingestão do projeto no RAG ==\n'

if [ -f "scripts/ingest-project.ts" ]; then
  if command -v pnpm >/dev/null 2>&1; then
    printf '[INFO] Executando com pnpm tsx...\n'
    pnpm tsx scripts/ingest-project.ts
  elif npx --yes tsx --version >/dev/null 2>&1; then
    printf '[INFO] Executando com npx tsx...\n'
    npx tsx scripts/ingest-project.ts
  else
    printf '[FAIL] tsx não disponível. Instale com: npm i -D tsx\n'
    exit 1
  fi
elif npm run | grep -q "rag:ingest"; then
  printf '[INFO] Executando npm run rag:ingest...\n'
  npm run rag:ingest
else
  printf '[WARN] Nenhum script de ingestão encontrado.\n'
  printf 'Crie scripts/ingest-project.ts ou adicione no package.json: "rag:ingest".\n'
  exit 2
fi

printf '[OK] Ingestão finalizada. Confirme inseridos/atualizados/ignorados nos logs.\n'
