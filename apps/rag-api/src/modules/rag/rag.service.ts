import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OllamaProvider } from './providers/ollama.provider';
import { RagDocument } from './entities/rag-document.entity';

export interface IngestResult {
  id: string;
  dimensions: number;
  content: string;
}

export interface SearchResult {
  id: string;
  content: string;
  metadata: Record<string, unknown>;
  similarity: number;
}

export interface RagQueryResult {
  query: string;
  context: string[];
  answer: string;
  sources: SearchResult[];
}

export interface PromptSource {
  id: string;
  path: string;
  chunkIndex: number | null;
  similarity: number;
}

export interface PromptGeneratorResult {
  task: string;
  prompt: string;
  sources: PromptSource[];
}

@Injectable()
export class RagService {
  private readonly logger = new Logger(RagService.name);

  constructor(
    private readonly ollama: OllamaProvider,
    @InjectRepository(RagDocument)
    private readonly docRepo: Repository<RagDocument>,
  ) {}

  // ----------------------------------------------------------------
  // ingest(content, metadata?) → IngestResult
  // Gera embedding e persiste o documento no pgvector
  // ----------------------------------------------------------------
  async ingest(content: string, metadata: Record<string, unknown> = {}): Promise<IngestResult> {
    this.logger.debug(`Ingerindo documento: ${content.substring(0, 80)}...`);

    const embedding = await this.ollama.embed(content);

    const doc = this.docRepo.create({
      content,
      metadata,
      embedding,
    });

    const saved = await this.docRepo.save(doc);

    this.logger.log(`Documento ${saved.id} ingerido (${embedding.length} dims)`);
    return { id: saved.id, dimensions: embedding.length, content };
  }

  // ----------------------------------------------------------------
  // search(query, topK?) → SearchResult[]
  // Busca vetorial por cosine similarity via pgvector
  // ----------------------------------------------------------------
  async search(query: string, topK = 5): Promise<SearchResult[]> {
    const queryEmbedding = await this.ollama.embed(query);
    const vectorLiteral = `[${queryEmbedding.join(',')}]`;

    // Usa operador <=> do pgvector para cosine distance
    // 1 - distance = similarity
    const results = await this.docRepo.query(
      `
      SELECT
        id,
        content,
        metadata,
        1 - (embedding <=> $1::vector) AS similarity
      FROM rag_documents
      WHERE embedding IS NOT NULL
      ORDER BY embedding <=> $1::vector
      LIMIT $2
      `,
      [vectorLiteral, topK],
    );

    return results.map((r: any) => ({
      id: r.id,
      content: r.content,
      metadata: r.metadata,
      similarity: parseFloat(r.similarity),
    }));
  }

  // ----------------------------------------------------------------
  // query(question, topK?) → RagQueryResult
  // Pipeline completo: embed → search → LLM com contexto
  // ----------------------------------------------------------------
  async query(question: string, topK = 5): Promise<RagQueryResult> {
    this.logger.debug(`RAG query: "${question}"`);

    const sources = await this.search(question, topK);
    const context = sources.map((s) => s.content);

    const systemPrompt = `Você é um assistente especializado. Responda APENAS com base no contexto abaixo.
Se a informação não estiver no contexto, diga "Não encontrei essa informação nos documentos disponíveis."

CONTEXTO:
${context.map((c, i) => `[${i + 1}] ${c}`).join('\n\n')}`;

    const answer = context.length > 0
      ? await this.ollama.chat(question, systemPrompt)
      : 'Nenhum documento relevante encontrado. Ingira documentos primeiro via POST /rag/ingest.';

    return { query: question, context, answer, sources };
  }

  // ----------------------------------------------------------------
  // generatePrompt(task, topK?) → PromptGeneratorResult
  // Monta um prompt técnico com os chunks mais relevantes do projeto
  // ----------------------------------------------------------------
  async generatePrompt(task: string, topK = 8): Promise<PromptGeneratorResult> {
    const normalizedTask = task.trim();
    const normalizedTopK = Math.max(1, Math.floor(topK));

    this.logger.log(`Gerando prompt para tarefa: "${normalizedTask}" (topK=${normalizedTopK})`);

    const sources = await this.search(normalizedTask, normalizedTopK);

    if (sources.length === 0) {
      this.logger.warn('Nenhum chunk encontrado para a tarefa informada.');
    }

    return {
      task: normalizedTask,
      prompt: this.buildImplementationPrompt(normalizedTask, sources),
      sources: sources.map((source) => this.toPromptSource(source)),
    };
  }

  // ----------------------------------------------------------------
  // healthCheck() → status do pipeline
  // ----------------------------------------------------------------
  async healthCheck(): Promise<Record<string, unknown>> {
    const ollamaOk = await this.ollama.healthCheck();
    const docCount = await this.docRepo.count();

    return {
      status: ollamaOk ? 'ok' : 'degraded',
      ollama: ollamaOk,
      documents: docCount,
    };
  }

  private buildImplementationPrompt(task: string, sources: SearchResult[]): string {
    const context = sources.length > 0
      ? sources.map((source, index) => this.formatPromptContext(source, index)).join('\n\n')
      : 'Nenhum chunk relevante foi encontrado no índice vetorial.';

    return `Você é um desenvolvedor experiente no projeto OIA Next, um sistema local-first com backend em NestJS e uso de RAG para contexto de código.

A tarefa é:
${task}

Contexto relevante extraído do repositório:
${context}

Restrições do projeto:
- Siga os padrões existentes do projeto, incluindo DI do NestJS, DTOs, Logger e TypeORM.
- Use configuração por ambiente e Docker Compose quando aplicável.
- Não exponha segredos no código-fonte.
- Preserve compatibilidade com pgvector e migrações existentes.
- Evite quebrar endpoints e módulos já implementados.

Objetivo:
Com base nas informações acima, forneça instruções técnicas e claras para implementar a tarefa. Inclua exemplos de código apenas quando forem úteis.`;
  }

  private formatPromptContext(source: SearchResult, index: number): string {
    const promptSource = this.toPromptSource(source);
    const location = [
      `Fonte ${index + 1}`,
      `id=${promptSource.id}`,
      `path=${promptSource.path}`,
      promptSource.chunkIndex === null ? null : `chunk=${promptSource.chunkIndex}`,
      `similarity=${promptSource.similarity.toFixed(4)}`,
    ].filter(Boolean).join(' | ');

    return `---\n${location}\n${source.content}\n---`;
  }

  private toPromptSource(source: SearchResult): PromptSource {
    return {
      id: source.id,
      path: this.readStringMetadata(source.metadata, ['path', 'filePath', 'filepath', 'source', 'filename']) ?? 'unknown',
      chunkIndex: this.readNumberMetadata(source.metadata, ['chunkIndex', 'chunk_index', 'index']),
      similarity: source.similarity,
    };
  }

  private readStringMetadata(metadata: Record<string, unknown>, keys: string[]): string | null {
    for (const key of keys) {
      const value = metadata?.[key];
      if (typeof value === 'string' && value.trim().length > 0) {
        return value;
      }
    }
    return null;
  }

  private readNumberMetadata(metadata: Record<string, unknown>, keys: string[]): number | null {
    for (const key of keys) {
      const value = metadata?.[key];
      if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
      }
      if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) {
        return Number(value);
      }
    }
    return null;
  }
}
