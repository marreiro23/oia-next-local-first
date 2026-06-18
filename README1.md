# Pacote OIA Next — Plano + Scripts

Este pacote consolida o material de trabalho do OIA Next em documentos objetivos e scripts individuais.

## Conteúdo

```text
docs/
  01-PLANO-CONSOLIDADO-OIA-NEXT.md
  02-METODOS-USO-RAG.md
  03-SEQUENCIA-EXECUCAO-SCRIPTS.md
  04-NEXT-STEPS.md

scripts/
  00-preflight-oia-next.sh
  01-create-modelfiles.sh
  02-create-ollama-agents.sh
  03-validate-ollama-agents.sh
  04-configure-olla-chat-settings.sh
  05-rag-smoke-tests.sh
  06-rag-ingest-project-command.sh
  07-review-checklist.sh

.olla/modelfiles/
  Modelfile.full
  Modelfile.reviewer
  Modelfile.rag
  Modelfile.devops
```

## Execução

Copie o conteúdo deste pacote para a raiz do repositório OIA Next e execute:

```bash
chmod +x scripts/*.sh
./scripts/00-preflight-oia-next.sh
./scripts/01-create-modelfiles.sh
./scripts/02-create-ollama-agents.sh
./scripts/03-validate-ollama-agents.sh
./scripts/04-configure-olla-chat-settings.sh
```

Depois, com a API em execução:

```bash
./scripts/05-rag-smoke-tests.sh
./scripts/06-rag-ingest-project-command.sh
```
