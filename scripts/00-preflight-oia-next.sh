#!/usr/bin/env bash
set -euo pipefail

BASE_MODEL="${BASE_MODEL:-qwen2.5-coder:14b}"

ok() { printf '[OK] %s\n' "$1"; }
warn() { printf '[WARN] %s\n' "$1"; }
fail() { printf '[FAIL] %s\n' "$1"; exit 1; }

printf '== OIA Next preflight ==\n'

command -v ollama >/dev/null 2>&1 || fail "ollama não encontrado no PATH"
ok "ollama encontrado: $(command -v ollama)"

command -v docker >/dev/null 2>&1 || warn "docker não encontrado no PATH"
command -v git >/dev/null 2>&1 || warn "git não encontrado no PATH"
command -v node >/dev/null 2>&1 || warn "node não encontrado no PATH"
command -v npm >/dev/null 2>&1 || warn "npm não encontrado no PATH"

if ollama list | awk '{print $1}' | grep -qx "$BASE_MODEL"; then
  ok "modelo base já existe: $BASE_MODEL"
else
  warn "modelo base não encontrado: $BASE_MODEL"
  printf 'Execute: ollama pull %s\n' "$BASE_MODEL"
fi

if [ -f "package.json" ]; then
  ok "package.json localizado na raiz atual"
else
  warn "package.json não encontrado. Execute este script na raiz do monorepo OIA Next."
fi

if [ -f "docker-compose.local.yml" ]; then
  ok "docker-compose.local.yml localizado"
else
  warn "docker-compose.local.yml não encontrado"
fi

printf '\nPreflight concluído.\n'
