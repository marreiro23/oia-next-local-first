## Dev Agent: Implementação do endpoint `POST /rag/prompt` ###

Diagnóstico: A tarefa é implementar o endpoint `/rag/prompt` que permite gerar um prompt estruturado com base em uma tarefa descrita pelo usuário.

Esse endpoint deve:

1. Receber uma descrição de tarefa(`task`) e número de chunks relevantes(`topK`). 
2. Gerar um embedding da tarefa. 
3. Buscar os `topK` chunks mais relevantes no banco de dados pgvector. 
4. Montar um prompt com base nos chunks recuperados, incluindo contexto do projeto OIA Net. 
5. Retornar o prompt completo e uma lista dos chunks utilizados.

Isso faz parte da ** Fase 2 ** do projeto RAG de projeto, relacionado ao fluxo de ingestão automática e uso de contexto no desenvolvimento assistido por IA. 

### Plano de ação:
1. Criar DTO `PromptGeneratorDto` para entrada. 
2. Implementar serviço `PromptGeneratorService` com métodos: - Gerar embedding da tarefa(`embed()`). - Buscar chunks relevantes no pgvector(`findRelevantChunks()`). - Montar prompt final(`generatePrompt()`). 
3. Registrar o serviço no módulo RAG. 
4. Criar controller `RagController` com endpoint`/rag/prompt`. 
5. Adicionar logs mínimos. 
6. Sugerir smoke test via curl. 

### Arquivos afetados:
  - `apps/rag-api/src/modules/rag/dto/prompt-generator.dto.ts` — DTO para entrada do endpoint
  - `apps/rag-api/src/modules/rag/services/prompt-generator.service.ts` — Lógica principal de geração do prompt
  - `apps/rag-api/src/modules/rag/controllers/rag.controller.ts` — Endpoint`/rag/prompt`
  - `apps/rag-api/src/modules/rag/rag.module.ts` — Registro do serviço no módulo 
    

### Código: ####

1. DTO: `prompt-generator.dto.ts`
// apps/rag-api/src/modules/rag/dto/prompt-generator.dto.ts
import { IsString, IsOptional, IsNumber } from 'class-validator';

export class PromptGeneratorDto {
  @IsString()
  task: string;

  @IsOptional()
  @IsNumber()
  topK?: number = 8;
}
#### 2. Serviço: `prompt-generator.service.ts`

```c
// apps/rag-api/src/modules/rag/services/prompt-generator.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { EmbeddingService } from './embedding.service';
import { VectorChunkRepository } from '../repositories/vector-chunk.repository';

@Injectable()
export class PromptGeneratorService {
  private readonly logger = new Logger(PromptGeneratorService.name);

  constructor(
    private readonly embeddingService: EmbeddingService,
    private readonly vectorChunkRepository: VectorChunkRepository,
  ) {}

  async generatePrompt(dto: PromptGeneratorDto): Promise<{
    prompt: string;
    sources: Array<{ path: string; chunkIndex: number; score: number }>;
  }> {
    const { task, topK } = dto;

    this.logger.log(`Gerando prompt para tarefa: ${task}`);

    // 1. Gerar embedding da tarefa
    const taskEmbedding = await this.embeddingService.embed(task);
    this.logger.debug(`Embedding gerado com tamanho: ${taskEmbedding.length}`);

    // 2. Buscar chunks relevantes no pgvector
    const relevantChunks = await this.vectorChunkRepository.findTopKByEmbedding(
      taskEmbedding,
      topK,
    );

    if (relevantChunks.length === 0) {
      this.logger.warn('Nenhum chunk encontrado para a tarefa.');
    }

    // 3. Montar prompt com contexto
    const prompt = this.buildPrompt(task, relevantChunks);

    return {
      prompt,
      sources: relevantChunks.map((chunk) => ({
        path: chunk.metadata.path,
        chunkIndex: chunk.metadata.chunkIndex,
        score: chunk.score,
      })),
    };
  }

  private buildPrompt(task: string, chunks: any[]): string {
    const contextLines = chunks.map(chunk => {
      return `---\nPath: ${chunk.metadata.path}\nChunk ${chunk.metadata.chunkIndex}: ${chunk.text}\n---`;
    }).join('\n\n');

    return `
```


    [Instrução do agente]

```c
Você é um desenvolvedor experiente no projeto OIA Net, um sistema local-first com backend em NestJS e uso de RAG para contexto de código.

A tarefa é: "${task}"

Contexto relevante extraído do repositório:
${contextLines}

[Restrições do projeto]
- Seguir padrões do projeto (DI, Logger, DTOs, migrations).
- Usar Docker Compose local e produção.
- Não expor segredos no código-fonte.
- Manter compatibilidade com migrações.
- Evitar quebras em outros módulos.

[Objetivo]
Baseado nas informações acima, forneça instruções claras e técnicas para implementar a tarefa descrita acima. Inclua exemplos de código, se relevante.`;
  }
}


```c
#### 3. Controller: `rag.controller.ts`
// apps/rag-api/src/modules/rag/controllers/rag.controller.ts
import { Body, Controller, Post } from '@nestjs/common';
import { PromptGeneratorService } from '../services/prompt-generator.service';
import { PromptGeneratorDto } from '../dto/prompt-generator.dto';

@Controller('rag')
export class RagController {
  constructor(private readonly promptGeneratorService: PromptGeneratorService) {}

  @Post('prompt')
  async generatePrompt(@Body() dto: PromptGeneratorDto) {
    return this.promptGeneratorService.generatePrompt(dto);
  }
}
```

```c
#### 4. Módulo: `rag.module.ts`
// apps/rag-api/src/modules/rag/rag.module.ts
import { Module } from '@nestjs/common';
import { RagController } from './controllers/rag.controller';
import { PromptGeneratorService } from './services/prompt-generator.service';
import { EmbeddingService } from './services/embedding.service';
import { VectorChunkRepository } from './repositories/vector-chunk.repository';

@Module({
  controllers: [RagController],
  providers: [
    PromptGeneratorService,
    EmbeddingService,
    VectorChunkRepository,
  ],
  exports: [PromptGeneratorService],
})
export class RagModule {}
```

### Smoke test:
```c
curl -X POST http://localhost:3000/rag/prompt \
  -H "Content-Type: application/json" \
  -d '{"task":"Criar endpoint para upload de PDF e ingestão automática","topK":8}'
```


  ### Riscos:
  - Se o serviço de embedding estiver indisponível, o endpoint falhará. 
  - A qualidade do prompt depende da qualidade dos chunks armazenados no pgvector. 
  - O uso de `text` como campo para montar o prompt pode ser limitado se os chunks forem muito longos. 
  
  ### Próximo passo: Validar a implementação com o Review Agent.Verificar se o serviço de embedding está funcionando corretamente e se há chunks no banco de dados para testes reais.
  
  ## Dev Agent: Implementação do endpoint POST / rag / prompt

  ** Diagnóstico:**
    Implementação do endpoint `/rag/prompt` que gera prompts com base em tarefas, utilizando embeddings e busca no pgvector.Parte da Fase 2 de RAG de projeto.

** Plano de ação:**
  
1. Criar DTO `PromptGeneratorDto`.
2. Implementar serviço `PromptGeneratorService` com lógica de embedding + busca + montagem de prompt.
3. Registrar no módulo e criar controller.
4. Adicionar logs mínimos.
5. Sugerir smoke test via curl.

**Arquivos afetados:**
- `apps/rag-api/src/modules/rag/dto/prompt-generator.dto.ts` — DTO para entrada
- `apps/rag-api/src/modules/rag/services/prompt-generator.service.ts` — Lógica de geração do prompt
- `apps/rag-api/src/modules/rag/controllers/rag.controller.ts` — Endpoint `/rag/prompt`
- `apps/rag-api/src/modules/rag/rag.module.ts` — Registro no módulo

**Código:**
[Implementação acima]

**Smoke test:**
bash curl -X POST http://localhost:3000/rag/prompt \ -H "Content-Type: application/json" \ -d '{"task":"Criar endpoint para upload de PDF e ingestão automática","topK":8}'

**Riscos:**
- Falha no serviço de embedding.
- Qualidade do contexto depende do índice pgvector.

** Próximo passo:
** Validação com Review Agent.