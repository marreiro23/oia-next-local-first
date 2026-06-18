# OIA Next — Sequência de Execução dos Scripts

Execute a partir da raiz do repositório OIA Next.

## Ordem obrigatória

```bash
chmod +x scripts/*.sh

./scripts/00-preflight-oia-next.sh
./scripts/01-create-modelfiles.sh
./scripts/02-create-ollama-agents.sh
./scripts/03-validate-ollama-agents.sh
./scripts/04-configure-olla-chat-settings.sh
./scripts/05-rag-smoke-tests.sh
./scripts/06-rag-ingest-project-command.sh
./scripts/07-review-checklist.sh
```

## Dependências

| Script | Depende de | O que valida/cria |
|---|---|---|
| 00-preflight | Nenhuma | Binários, versão e modelo base |
| 01-create-modelfiles | 00 | `.olla/modelfiles/*` |
| 02-create-ollama-agents | 01 | Modelos `oia_next_*` no Ollama |
| 03-validate-ollama-agents | 02 | Smoke test dos agentes |
| 04-configure-olla-chat-settings | 02 | `.vscode/settings.json` |
| 05-rag-smoke-tests | API em execução | `/rag/health` e `/rag/prompt` |
| 06-rag-ingest-project-command | Backend pronto | Comando de ingestão do projeto |
| 07-review-checklist | Após alterações | Checklist de pronto |

## Observação

Os scripts foram criados para serem seguros: eles validam pré-requisitos, usam nomes de modelo com underscore e evitam sobrescrever arquivos sem backup quando aplicável.
