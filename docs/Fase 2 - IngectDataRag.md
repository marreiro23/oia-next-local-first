: indexar o projeto no RAG e usar o RAG para montar um context pack/prompt de trabalho para os agentes.
A ideia fica assim:
repo do projeto
  ↓
script de ingestão
  ↓
chunks por arquivo/função/módulo
  ↓
Postgres + pgvector
  ↓
pergunta/tarefa do agente
  ↓
busca contexto relevante
  ↓
gera prompt estruturado para continuar desenvolvimento
O que falta no projeto agora é transformar o RAG manual em um RAG de projeto.
Próximos blocos
Criar um indexador do projeto:
scripts/ingest-project.ts
Ele deve ler arquivos como:
apps/rag-api/src/**/*.ts
docker-compose.local.yml
docker/postgres/init.sql
README.md
package.json
tsconfig.json
E ignorar:
node_modules
dist
.git
.env
*.log
package-lock.json opcionalmente
Salvar metadados por chunk:
{
  "path": "apps/rag-api/src/modules/rag/rag.service.ts",
  "kind": "source",
  "language": "typescript",
  "chunkIndex": 0,
  "hash": "...",
  "project": "rag-greenfield"
}
Criar chunks bons, não jogar arquivo inteiro sempre.
Para código, chunk ideal é algo como:
imports + classe
método por método
interfaces/types
config separado
No começo pode ser simples: dividir por tamanho, tipo 1500-3000 caracteres, com overlap pequeno.
Criar endpoint de prompt generator, por exemplo:
POST /rag/prompt
Body:
{
  "task": "Adicionar upload de documentos PDF no RAG",
  "topK": 8
}
Resposta esperada:
{
  "prompt": "...prompt pronto para agente...",
  "sources": [...]
}
Esse prompt deveria sair mais ou menos assim:
Você é um agente trabalhando no projeto rag-greenfield.

Objetivo:
Adicionar upload de documentos PDF no RAG.

Contexto relevante do código:
- apps/rag-api/src/modules/rag/rag.controller.ts: ...
- apps/rag-api/src/modules/rag/rag.service.ts: ...
- docker-compose.local.yml: ...

Arquitetura atual:
- NestJS API
- PostgreSQL + pgvector
- Ollama para embeddings/chat
- Endpoints atuais: /rag/health, /rag/ingest, /rag/search, /rag/query

Restrições:
- Seguir padrões existentes
- Não mexer em produção
- Não commitar secrets
- Validar com curl/docker compose

Tarefa:
...
Fluxo de uso
Depois disso, quando quiser que um agente continue o desenvolvimento:
curl -X POST http://localhost:3000/rag/prompt \
  -H "Content-Type: application/json" \
  -d '{"task":"Criar endpoint para upload de PDF e ingestão automática","topK":8}'
A saída vira o prompt/contexto que você passa para o agente.
Minha recomendação
O próximo passo técnico é implementar três coisas:
1. Upsert de documentos por metadata.hash/path
2. Script de ingestão do projeto
3. Endpoint /rag/prompt
Sem upsert, cada ingestão duplica os mesmos arquivos. Para um RAG de projeto, isso precisa ser resolvido cedo.