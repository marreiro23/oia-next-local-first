#!/usr/bin/env bash
set -euo pipefail

cat <<'CHECKLIST'
== Checklist de pronto OIA Next ==

[ ] Build aprovado no container local.
[ ] Smoke test /rag/health aprovado.
[ ] Smoke test /rag/prompt retorna prompt + sources.
[ ] Review Agent não encontrou problema crítico.
[ ] .env.example atualizado se houve variável nova.
[ ] Migration criada/aplicada se houve mudança de schema.
[ ] Nenhum secret, token ou .env real foi versionado.
[ ] Upsert RAG validado sem duplicação.
[ ] Logs mínimos adicionados nos services alterados.
[ ] Decisão arquitetural registrada em docs/adr quando aplicável.

Prompt sugerido para o reviewer:

Review Agent, valide a entrega acima seguindo os critérios do projeto OIA Next.
Avalie arquitetura, DI, segurança, RAG, testabilidade, smoke test, migrations, .env.example e riscos.
CHECKLIST
