Plano de Evolução --- LLM Local com RAG e Base de Conhecimento
Evolutiva 1. Visão do Produto O projeto tem como objetivo construir uma
plataforma LLM local-first, com RAG, execução em GPU local, publicação
controlada via Cloudflare e uso progressivo como assistente técnico para
code review, análise de arquitetura, documentação, diagnóstico e apoio à
migração faseada das APIs. O produto nasce a partir de experiências
reais de consultoria, onde foram identificados gaps recorrentes em
clientes, especialmente relacionados a documentação técnica, governança,
rastreabilidade, análise de código, operação de ambientes, suporte à
decisão e aceleração de entregas técnicas. O foco inicial não é apenas
construir APIs, mas criar uma camada inteligente capaz de entender o
contexto do projeto, consultar uma base de conhecimento local, apoiar
decisões técnicas e servir como vitrine demonstrável para clientes.

2.  Princípios Arquiteturais • Priorizar execução local sempre que
    tecnicamente viável. • Reduzir dependência de provedores externos. •
    Utilizar LM Studio como motor LLM principal. • Utilizar RAG como
    base de conhecimento incremental. • Evitar exposição direta do LM
    Studio à internet. • Publicar somente camadas controladas via
    Cloudflare. • Manter rastreabilidade das decisões arquiteturais. •
    Migrar componentes de forma faseada. • Evitar reescrita
    desnecessária em Python. • Manter NestJS/TypeScript como stack
    principal da API. • Utilizar Python apenas para experimentação,
    notebooks, avaliação, scripts auxiliares ou finetuning futuro.

3.  Decisão Técnica Principal O projeto adotará LM Studio como motor
    prioritário de inferência local, substituindo gradualmente o uso de
    Ollama quando houver equivalência funcional. O RAG será implementado
    localmente com Postgres + pgvector, permitindo que documentos,
    código, logs, decisões arquiteturais e contexto técnico sejam
    indexados e consultados localmente. A publicação externa será feita
    via Cloudflare, porém o LM Studio permanecerá como serviço interno,
    acessado somente pela aplicação ou API intermediária.

1

4. Fase 1 --- LM Studio como Motor LLM Principal 4.1 Objetivo
Estabelecer o LM Studio como backend principal de inferência local para
o produto, servindo como motor para interações LLM, code review, análise
técnica, geração de respostas e futura integração com RAG.

4.2 Resultado Esperado Ao final da Fase 1, o ambiente deverá permitir
que o llm-ops-api consuma o LM Studio localmente de forma autenticada,
estável e reproduzível.

4.3 Topologia da Fase 1 Usuário / Aplicação ↓ llm-ops-api ↓ LM Studio
Local Server ↓ Modelo LLM local em GPU

4.4 Componentes • LM Studio Desktop ou Headless. • Modelo principal de
chat/code review. • Modelo de embedding, se disponível e validado no LM
Studio. • API local em http://127.0.0.1:1234 . • Token de autenticação
do LM Studio. • Provider interno no llm-ops-api . • Logs de chamadas. •
Teste de conectividade. • Teste de resposta simples. • Teste de resposta
estruturada.

4.5 Configurações Recomendadas no LM Studio • Require Authentication :
habilitado. • Serve on Local Network : desabilitado inicialmente. •
Enable CORS : habilitar somente se houver consumo direto via browser. •
Just-in-Time Model Loading : habilitado. • Auto unload unused JIT loaded
models : habilitado. • Porta padrão: 1234 . • Exposição pública direta:
proibida. • Acesso externo: somente via aplicação intermediária.

2

4.6 Variáveis de Ambiente Sugeridas LLM_PROVIDER=lmstudio
LMSTUDIO_BASE_URL=http://127.0.0.1:1234/v1
LMSTUDIO_API_KEY=seu-token-local
LMSTUDIO_CHAT_MODEL=qwen3-14b-claude-sonnet-4.5-reasoning-distill
LMSTUDIO_EMBEDDING_MODEL=text-embedding-nomic-embed-text-v1.5 Caso o
modelo de embedding ainda não esteja validado no LM Studio, manter
temporariamente um provider alternativo, mas sem tornar o Ollama
prioridade arquitetural.

4.7 Provider Técnico Esperado Criar ou ajustar um provider no backend
para encapsular chamadas ao LM Studio. Responsabilidades do provider: •
Enviar prompts ao modelo. • Controlar temperatura, tokens e modelo. •
Tratar erro de conexão. • Tratar erro de autenticação. • Registrar logs
mínimos. • Padronizar resposta para o restante da aplicação. • Evitar
que services internos chamem diretamente o LM Studio.

4.8 Exemplo Conceitual de Fluxo LlmOpsService ↓ ModelRouterService ↓
LmStudioProvider ↓ LM Studio API

4.9 Critérios de Pronto da Fase 1 • LM Studio respondendo localmente via
API. • Autenticação por token validada. • llm-ops-api consumindo LM
Studio sem chamada direta a provedor externo. • Modelo principal
definido. • Provider interno funcionando. • Logs básicos disponíveis. •
Teste de chamada simples aprovado. • Teste de resposta estruturada
aprovado. • Documentação mínima criada. • Decisão arquitetural
registrada.

3

4.10 Testes Técnicos da Fase 1 Teste de listagem de modelos:

curl "\$LMSTUDIO_BASE_URL/models" -H "Authorization: Bearer
\$LMSTUDIO_API_KEY" Teste de chat:

curl "\$LMSTUDIO_BASE_URL/chat/completions" -H "Authorization: Bearer
\$LMSTUDIO_API_KEY" -H "Content-Type: application/json" -d '{ "model":
"qwen3-14b-claude-sonnet-4.5-reasoning-distill", "messages": \[ {
"role": "system", "content": "Você é um assistente técnico local para
análise de arquitetura e código." }, { "role": "user", "content":
"Explique os riscos de migrar um RAG de Astra DB para pgvector." }\],
"temperature": 0.2, "max_tokens": 800 }'

4.11 Riscos da Fase 1 • Expor LM Studio diretamente à internet. •
Misturar Ollama e LM Studio sem abstração. • Configurar tokens de forma
insegura. • Criar dependência direta do LM Studio dentro de services de
negócio. • Usar modelo inadequado para code review. • Não registrar logs
suficientes para diagnóstico.

4.12 Mitigações • Usar provider interno. • Manter LM Studio apenas em
localhost. • Usar Cloudflare somente na camada de aplicação. • Criar
variáveis de ambiente padronizadas. • Documentar modelo usado,
temperatura, contexto e limites. • Registrar falhas de autenticação,
timeout e indisponibilidade.

4

5. Fase 2 --- RAG Local com pgvector 5.1 Objetivo Implementar RAG local
usando Postgres + pgvector, substituindo dependências de vector stores
em nuvem e criando uma base de conhecimento evolutiva para o produto.

5.2 Resultado Esperado Ao final da Fase 2, o produto deverá conseguir: •
Ingerir documentos. • Quebrar conteúdo em chunks. • Gerar embeddings
localmente. • Salvar vetores no Postgres com pgvector. • Buscar contexto
relevante por similaridade. • Montar prompt enriquecido. • Chamar o LM
Studio. • Responder com base no contexto recuperado. • Registrar
interações e fontes utilizadas.

5.3 Topologia da Fase 2 Usuário / Aplicação ↓ llm-ops-api ↓ RagModule ↓
EmbeddingService ↓ LM Studio Embedding Model ↓ PgVectorStoreService ↓
Postgres + pgvector ↓ RagOrchestratorService ↓ LM Studio Chat Model

5.4 Componentes • RagModule • IVectorStore • PgVectorStoreService •
EmbeddingService • ChunkingService • RagOrchestratorService

5

• Entidades TypeORM para documentos, chunks e interações • Migration
para tabelas RAG • Postgres com extensão vector • Smoke test end-to-end

5.5 Estrutura Recomendada apps/llm-ops-api/src/modules/llm-ops/rag/ │
├── rag.module.ts │ ├── interfaces/ │

└── vector-store.interface.ts

│ ├── services/ │

├── embedding.service.ts

│

├── chunking.service.ts

│

├── pgvector-store.service.ts

│

└── rag-orchestrator.service.ts

│ ├── entities/ │

├── rag-document.entity.ts

│

├── rag-chunk.entity.ts

│

└── rag-interaction.entity.ts

│ ├── dto/ │

├── ingest-document.dto.ts

│

├── ask-rag.dto.ts

│

└── rag-search-result.dto.ts

│ └── migrations/ └── 1750000000000-CreatePgVectorRagTables.ts

5.6 Responsabilidades por Serviço EmbeddingService Responsável por gerar
embeddings usando provider local. Responsabilidades: • Receber texto. •
Chamar endpoint de embedding. • Validar dimensão do vetor. • Retornar
vetor numérico. • Tratar erro de modelo indisponível. • Registrar
latência da geração.

6

ChunkingService Responsável por dividir documentos em partes menores.
Responsabilidades: • Quebrar texto em chunks. • Aplicar tamanho máximo.
• Aplicar overlap. • Preservar metadados. • Gerar índice de chunk. •
Evitar chunks vazios. PgVectorStoreService Responsável por persistência
e busca vetorial. Responsabilidades: • Salvar documentos. • Salvar
chunks. • Salvar embeddings. • Buscar chunks similares. • Aplicar
filtros. • Remover documento indexado. • Normalizar score de
similaridade. RagOrchestratorService Responsável por coordenar o fluxo
RAG completo. Responsabilidades: • Receber pergunta. • Gerar embedding
da pergunta. • Buscar chunks similares. • Montar contexto. • Montar
prompt final. • Chamar modelo no LM Studio. • Retornar resposta. •
Salvar interação. • Informar fontes usadas.

5.7 Interface Técnica Recomendada export const VECTOR_STORE_TOKEN =
Symbol("VECTOR_STORE_TOKEN"); export interface VectorDocumentChunk {
documentId: string; chunkIndex: number; content: string;

7

embedding: number\[\]; metadata?: Record\<string, unknown\>; } export
interface VectorSearchResult { id: string; documentId: string; content:
string; metadata?: Record\<string, unknown\>; score: number; } export
interface IVectorStore { upsertChunks(chunks: VectorDocumentChunk\[\]):
Promise`<void>`{=html}; searchSimilar(params: { embedding: number\[\];
limit?: number; minScore?: number; filters?: Record\<string, unknown\>;
}): Promise\<VectorSearchResult\[\]\>; deleteDocument(documentId:
string): Promise`<void>`{=html}; }

5.8 Variáveis de Ambiente Sugeridas RAG_ENABLED=true
RAG_PGVECTOR_ENABLED=true RAG_EMBEDDINGS_ENABLED=true
RAG_CHUNK_SIZE=1000 RAG_CHUNK_OVERLAP=150 RAG_SEARCH_LIMIT=5
RAG_MIN_SCORE=0.70 RAG_VECTOR_DIMENSION=768
LMSTUDIO_BASE_URL=http://127.0.0.1:1234/v1
LMSTUDIO_API_KEY=seu-token-local
LMSTUDIO_CHAT_MODEL=qwen3-14b-claude-sonnet-4.5-reasoning-distill
LMSTUDIO_EMBEDDING_MODEL=text-embedding-nomic-embed-text-v1.5

5.9 Migration A migration deverá: • Criar extensão vector . • Criar
tabela de documentos.

8

• Criar tabela de chunks. • Criar coluna de embedding com dimensão
compatível. • Criar índices vetoriais. • Criar tabela de interações, se
necessário. Validações após migration:

SELECT extname FROM pg_extension WHERE extname = 'vector';

SELECT table_name FROM information_schema.tables WHERE table_schema =
'public' AND table_name ILIKE '%rag%';

5.10 Fluxo de Ingestão Documento recebido ↓ Normalização de texto ↓
Chunking ↓ Embedding de cada chunk ↓ Persistência no pgvector ↓
Documento disponível para busca

5.11 Fluxo de Pergunta e Resposta Usuário pergunta ↓ Embedding da
pergunta ↓ Busca vetorial no pgvector ↓ Recuperação dos chunks mais
relevantes ↓ Montagem do contexto ↓ Prompt final ↓ LM Studio ↓ Resposta
com base no contexto

9

↓ Registro da interação

5.12 Prompt Base para RAG Você é um assistente técnico local do projeto.
Responda usando prioritariamente o contexto fornecido. Se o contexto não
for suficiente, diga claramente que a base de conhecimento não possui
informação suficiente. Não invente detalhes. Quando possível, cite os
documentos ou trechos utilizados. Contexto: {{context}} Pergunta:
{{question}} Resposta:

5.13 Critérios de Pronto da Fase 2 • Postgres com pgvector operacional.
• Migration executada com sucesso. • Entidades RAG criadas. • RagModule
registrado no LlmOpsModule . • IVectorStore criado. •
PgVectorStoreService implementado. • EmbeddingService usando LM Studio
ou provider local definido. • Documento de teste ingerido. • Busca
vetorial funcionando. • Pergunta com RAG funcionando. • Smoke test
aprovado. • Astra removido somente após validação. • Variáveis antigas
removidas após validação. • Decisão arquitetural documentada.

5.14 Smoke Test Esperado O smoke test deve validar: • Saúde da API. •
Saúde do LM Studio. • Saúde do Postgres. • Existência da extensão vector
. • Ingestão de documento. • Geração de embedding. • Persistência no
pgvector. • Busca semântica.

10

• Resposta final via LM Studio. • Registro da interação.

5.15 Riscos da Fase 2 • Dimensão incorreta do embedding. • Score de
similaridade invertido ou mal interpretado. • Chunks grandes demais. •
Chunks pequenos demais. • Contexto irrelevante sendo enviado ao modelo.
• Prompt sem instruções claras. • Dependência residual do Astra. •
Migration quebrando ambiente local. • Falta de índices vetoriais. •
Latência alta na geração de embeddings.

5.16 Mitigações • Validar dimensão do embedding antes da migration
definitiva. • Normalizar score no PgVectorStoreService . • Testar
diferentes tamanhos de chunk. • Logar chunks recuperados. • Usar smoke
test end-to-end. • Manter branch dedicada. • Remover Astra somente após
validação. • Criar comando de rollback. • Medir latência por etapa.

6.  Esqueleto de Memória Técnica do Produto A memória técnica do produto
    será composta por documentos, decisões, código, logs e evidências
    indexáveis no RAG.

6.1 Categorias de Memória 1. Identidade do Produto • Nome do produto. •
Objetivo. • Público-alvo. • Problemas que resolve. • Diferencial
competitivo. • Hipóteses de venda. • Casos de uso prioritários. 2.
Decisões Arquiteturais • Escolha do LM Studio. • Escolha do pgvector. •
Estratégia local-first. • Uso de Cloudflare. • Não exposição direta do
LM Studio.

11

• Manutenção do backend em NestJS. • Uso de Python apenas como apoio. •
Migração faseada de APIs. 3. Topologia • Componentes locais. •
Componentes publicados. • Fluxos de rede. • Portas. • Hostnames. •
Cloudflare Tunnel. • Cloudflare Access. • Serviços internos. 4. Modelos
LLM • Modelo principal de chat. • Modelo de code review. • Modelo de
embedding. • Temperatura padrão. • Limite de tokens. • Context window. •
Critérios de troca de modelo. • Benchmarks internos. 5. RAG • Fontes
indexadas. • Estratégia de chunking. • Tamanho dos chunks. • Overlap. •
Dimensão dos embeddings. • Score mínimo. • Quantidade de chunks
recuperados. • Estratégia de citação. • Política de atualização da base.
6. APIs • Lista de APIs existentes. • Status de migração. •
Dependências. • Endpoints. • Serviços. • DTOs. • Entidades. •
Migrations. • Testes. • Riscos por API.

12

7. Code Review • Padrões esperados. • Critérios de revisão. •
Antipadrões conhecidos. • Padrões NestJS. • Padrões de injeção de
dependência. • Padrões de logging. • Padrões de erro. • Padrões de
testes. 8. Operação Local • Scripts de inicialização. • Docker Compose.
• Containers. • Volumes. • Backups. • Logs. • Health checks. •
Procedimentos de recuperação. 9. Demonstração Comercial • Casos de uso
demonstráveis. • Histórias de cliente. • Dores comuns. • Fluxos de demo.
• Perguntas prontas para apresentação. • Evidências de valor. • Métricas
de economia. 10. Roadmap • Fase atual. • Próximas fases. • Backlog
técnico. • Backlog comercial. • Itens bloqueados. • Itens críticos. •
Itens opcionais.

7.  Checklist de Contexto para Cada Sessão de Desenvolvimento Antes de
    iniciar uma sessão de trabalho com o LLM, preencher ou revisar:

7.1 Contexto da Sessão • Qual é o objetivo da sessão? • Qual fase do
projeto está sendo trabalhada? • Qual módulo será alterado? • Qual
problema será resolvido?

13

• Existe decisão arquitetural envolvida? • Existe risco de quebrar outro
módulo? • Existe dependência externa a remover? • Existe teste ou smoke
test aplicável?

7.2 Contexto Técnico • Caminho dos arquivos envolvidos. • Services
envolvidos. • Controllers envolvidos. • DTOs envolvidos. • Entities
envolvidas. • Migrations envolvidas. • Variáveis de ambiente envolvidas.
• Providers envolvidos. • Dependências npm envolvidas.

7.3 Contexto de RAG • A documentação relevante já foi indexada? • O
código relevante já foi indexado? • Existe ADR sobre essa decisão? • O
modelo deve responder com base no RAG? • O contexto recuperado é
confiável? • Há risco de contexto desatualizado?

7.4 Contexto de Code Review • O objetivo é revisar arquitetura? • O
objetivo é revisar segurança? • O objetivo é revisar performance? • O
objetivo é revisar legibilidade? • O objetivo é revisar testes? • O
objetivo é revisar aderência ao padrão do projeto?

7.5 Contexto de Execução • Branch atual. • Comando de build. • Comando
de teste. • Comando de lint. • Comando de smoke test. • Como reverter a
mudança. • Como validar manualmente.

8.  Checklist Antes de Migrar uma API 8.1 Antes da Migração • API
    identificada. • Responsabilidade da API entendida. • Dependências
    mapeadas.

14

• Banco/tabelas mapeados. • Services mapeados. • DTOs mapeados. • Testes
existentes identificados. • Logs existentes identificados. • Riscos
documentados. • Critério de pronto definido.

8.2 Durante a Migração • Alterar uma responsabilidade por vez. • Evitar
mudanças simultâneas de arquitetura e regra de negócio. • Manter
assinatura pública quando possível. • Usar interface quando houver
dependência externa. • Criar logs mínimos. • Rodar build frequentemente.
• Rodar testes por módulo. • Registrar decisões importantes.

8.3 Depois da Migração • Build aprovado. • Testes aprovados. • Smoke
test aprovado. • Code review com LLM executado. • Diff revisado. •
Documentação atualizada. • ADR criado ou atualizado. • RAG atualizado
com nova informação. • Dependências antigas removidas, se aplicável.

9.  Checklist de Documentos para Indexar no RAG Essenciais • README do
    projeto. • Arquitetura geral. • ADRs. • Tutoriais internos. •
    Documentos de integração. • .env.example . • Docker Compose. •
    Migrations. • Controllers. • Services. • DTOs. • Entities. • Scripts
    de smoke test. • Logs de erro relevantes.

15

Comerciais • Visão do produto. • Casos de uso. • Dores de clientes. •
Diferenciais. • Demonstrações. • Roteiros de apresentação. • SOWs
modelo. • Perguntas frequentes.

Operacionais • Procedimentos de start/stop. • Backup. • Restore. •
Troubleshooting. • Health checks. • Publicação Cloudflare. • Segurança
de acesso.

10. Prompt Mestre para Sessões Técnicas Você é o assistente técnico
    local do produto. Contexto do produto:

-   Plataforma LLM local-first.
-   LM Studio é o motor LLM prioritário.
-   RAG local com Postgres + pgvector.
-   Backend principal em NestJS/TypeScript.
-   Python é usado apenas para apoio, experimentação e scripts
    auxiliares.
-   Cloudflare publica a camada de aplicação, nunca o LM Studio
    diretamente.
-   O produto ainda não está em produção com clientes.
-   O objetivo é reduzir custos, remover dependências de nuvem e criar
    uma plataforma demonstrável para clientes. Objetivo da sessão:
    {{objetivo}} Módulo/arquivos envolvidos: {{arquivos}} Restrições:
-   Não reescrever em Python.
-   Não expor LM Studio diretamente.
-   Priorizar execução local.
-   Manter rastreabilidade.
-   Fazer migração faseada.
-   Evitar alterar múltiplos domínios ao mesmo tempo. Tarefa:

16

{{tarefa}} Formato esperado da resposta: - Diagnóstico. - Plano de
ação. - Arquivos afetados. - Riscos. - Código sugerido quando
aplicável. - Testes necessários. - Critério de pronto.

11. Prompt Mestre para Code Review Você é um revisor sênior de
    arquitetura e código para um projeto NestJS/ TypeScript. Contexto:

-   O projeto é uma plataforma LLM local-first.
-   LM Studio é o provider LLM principal.
-   RAG local usa Postgres + pgvector.
-   O objetivo é reduzir dependências externas e custo de nuvem.
-   O código deve favorecer modularidade, injeção de dependência,
    testabilidade e rastreabilidade. Revise o código abaixo
    considerando:

1.  Arquitetura.
2.  Separação de responsabilidades.
3.  Injeção de dependência.
4.  Acoplamento indevido.
5.  Tratamento de erros.
6.  Logs.
7.  Testabilidade.
8.  Segurança.
9.  Aderência ao objetivo local-first.
10. Riscos para migração faseada. Código: {{codigo}} Responda no
    formato:

-   Resumo executivo.
-   Pontos positivos.
-   Problemas encontrados.
-   Riscos.
-   Sugestões de refatoração.
-   Testes recomendados.
-   Prioridade das correções.

17

12. Prompt Mestre para Atualizar a Memória Técnica Atualize a memória
técnica do produto com a seguinte decisão, alteração ou evidência. Tipo
de informação: {{tipo}} Descrição: {{descricao}} Arquivos relacionados:
{{arquivos}} Impacto: {{impacto}} Status: {{status}} Data: {{data}}
Classifique essa informação em uma ou mais categorias: - Identidade do
produto - Decisão arquitetural - Topologia - Modelo LLM - RAG - API -
Code review - Operação local - Demonstração comercial - Roadmap

13. Próximo Marco O próximo marco do projeto é concluir a Fase 1 e
    iniciar a Fase 2 com a menor quantidade possível de mudanças
    paralelas. Ordem recomendada:
14. Validar LM Studio como provider principal.
15. Criar provider interno para LM Studio.
16. Padronizar variáveis de ambiente.
17. Validar chamada simples e chamada estruturada.
18. Subir Postgres com pgvector.
19. Criar migration RAG.
20. Criar RagModule .

18

8. Criar IVectorStore . 9. Implementar PgVectorStoreService . 10.
Implementar EmbeddingService . 11. Implementar ingestão. 12. Implementar
busca. 13. Implementar pergunta/resposta com contexto. 14. Rodar smoke
test. 15. Documentar resultado. 16. Atualizar memória técnica.

19


