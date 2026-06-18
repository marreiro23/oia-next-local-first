# OIA Next — Plano Consolidado de Refatoração e Execução

**Versão:** 1.0  
**Data:** 2026-06-18  
**Objetivo:** consolidar a versão de trabalho do projeto OIA Next em uma sequência objetiva de ações, dependências, requisitos, métodos de uso do RAG e scripts operacionais separados.

---

## 1. Decisão de arquitetura

O projeto deve operar com uma camada de agentes locais em Ollama, consumida pelo OLLA CHAT no VS Code, e uma camada RAG implementada no backend NestJS/TypeScript.

A convivência entre os agentes e os skills é válida porque cada camada tem papel diferente:

- **OIA Next Agent:** define comportamento, processo, restrições, padrão de resposta e contexto do projeto.
- **NestJS Skills:** define boas práticas técnicas de arquitetura, DI, segurança, performance, testes e DevOps.
- **RAG de Projeto:** fornece contexto atualizado do repositório para geração de respostas e prompts.
- **OLLA CHAT:** atua como interface operacional dentro do VS Code.

---

## 2. Sequência executiva recomendada

| Ordem | Etapa | Entrega | Dependência | Status esperado |
|---:|---|---|---|---|
| 0 | Preflight | Validar Ollama, Docker, Node, Git e modelo base | Nenhuma | Ambiente apto |
| 1 | Estrutura local | Criar `.olla/`, `.vscode/`, `scripts/` | Etapa 0 | Pastas criadas |
| 2 | Modelfiles | Criar agentes `full`, `reviewer`, `rag`, `devops` | Etapa 1 | Arquivos gerados |
| 3 | Modelos Ollama | Executar `ollama create` com nomes válidos | Etapa 2 + modelo base | Agentes listados |
| 4 | OLLA CHAT | Configurar `settings.json` do VS Code | Etapa 3 | OLLA usa `oia_next_full` |
| 5 | Infra RAG | Validar Docker Compose, API, Postgres, pgvector e Ollama | Etapa 0 | Containers saudáveis |
| 6 | Schema RAG | Confirmar entities, migrations e índices pgvector | Etapa 5 | Banco preparado |
| 7 | Ingestão | Executar `scripts/ingest-project.ts` | Etapa 6 | Chunks indexados |
| 8 | Prompt RAG | Validar `POST /rag/prompt` | Etapa 7 | Prompt com sources |
| 9 | Ciclo Agent | Usar Ask → Plan → Agent → Review | Etapa 8 | Fluxo operacional |
| 10 | Hardening | Testes, ADRs, CI/CD e documentação | Etapa 9 | Base estabilizada |

---

## 3. Correções aplicadas ao plano original

### 3.1 Nomenclatura de modelos Ollama

Evitar hífens nos nomes customizados dos modelos. Usar underscore:

```bash
ollama create oia_next_full     -f ./.olla/modelfiles/Modelfile.full
ollama create oia_next_reviewer -f ./.olla/modelfiles/Modelfile.reviewer
ollama create oia_next_rag      -f ./.olla/modelfiles/Modelfile.rag
ollama create oia_next_devops   -f ./.olla/modelfiles/Modelfile.devops
```

### 3.2 Estrutura correta de Modelfile

Usar `SYSTEM """` e não `SYSTEM ````, porque backticks são Markdown, não sintaxe do Ollama.

```dockerfile
FROM qwen2.5-coder:14b

SYSTEM """
Instruções do agente aqui.
"""
```

### 3.3 Redução do prompt de sistema

Não embutir o conteúdo completo de skills com centenas de exemplos no `SYSTEM`. O recomendado é manter o Modelfile conciso e usar o RAG ou anexos de contexto para documentação extensa.

---

## 4. Arquitetura alvo dos agentes

| Agente | Modelo Ollama | Função |
|---|---|---|
| Dev geral | `oia_next_full` | Desenvolvimento, refatoração, documentação, planejamento e orientação geral |
| Reviewer | `oia_next_reviewer` | Auditoria de arquitetura, DI, segurança, testabilidade e critério de pronto |
| RAG | `oia_next_rag` | Ingestão, chunking, embeddings, busca vetorial, upsert e `/rag/prompt` |
| DevOps | `oia_next_devops` | Docker Compose, variáveis, health checks, migrations, shutdown e deploy local |

---

## 5. Critérios de pronto

Uma entrega só deve ser considerada concluída quando:

- Build local aprovado no container ou ambiente equivalente.
- Smoke test aprovado.
- Review Agent sem problemas críticos.
- `.env.example` atualizado quando houver variável nova.
- Migration criada e aplicada quando houver mudança de schema.
- Nenhum secret, token ou `.env` real versionado.
- Decisão técnica registrada em ADR quando impactar arquitetura.
- RAG reindexado quando houver mudança estrutural relevante.
