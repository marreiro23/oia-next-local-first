import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Ollama } from 'ollama';

/**
 * OllamaProvider
 *
 * Provider NestJS injetável que encapsula o cliente Ollama.
 * Responsável por:
 *  - embed(text): gerar vetores de embedding para o RAG
 *  - chat(prompt): resposta de chat via LLM local
 *  - healthCheck(): verificar se o Ollama está acessível
 *
 * Injetado via DI — nunca instanciado diretamente.
 */
@Injectable()
export class OllamaProvider implements OnModuleInit {
  private readonly logger = new Logger(OllamaProvider.name);
  private client: Ollama;
  private readonly embedModel: string;
  private readonly chatModel: string;

  constructor(private readonly config: ConfigService) {
    this.embedModel = this.config.get<string>('ollama.embedModel')!;
    this.chatModel = this.config.get<string>('ollama.chatModel')!;

    this.client = new Ollama({
      host: this.config.get<string>('ollama.baseUrl'),
    });
  }

  // ----------------------------------------------------------------
  // Lifecycle hook — valida conexão ao iniciar o módulo
  // ----------------------------------------------------------------
  async onModuleInit(): Promise<void> {
    await this.healthCheck();
  }

  // ----------------------------------------------------------------
  // embed(text) → number[]
  // Gera embedding vetorial para um texto usando nomic-embed-text
  // ----------------------------------------------------------------
  async embed(text: string): Promise<number[]> {
    if (!text || text.trim().length === 0) {
      throw new Error('OllamaProvider.embed: texto não pode ser vazio');
    }

    const response = await this.client.embed({
      model: this.embedModel,
      input: text.trim(),
    });

    const embedding = response.embeddings?.[0];
    if (!embedding || embedding.length === 0) {
      throw new Error(`OllamaProvider.embed: resposta vazia do modelo ${this.embedModel}`);
    }

    this.logger.debug(`embed() → ${embedding.length} dimensões (modelo: ${this.embedModel})`);
    return embedding;
  }

  // ----------------------------------------------------------------
  // embedBatch(texts) → number[][]
  // Gera embeddings para múltiplos textos em sequência
  // ----------------------------------------------------------------
  async embedBatch(texts: string[]): Promise<number[][]> {
    const results: number[][] = [];
    for (const text of texts) {
      results.push(await this.embed(text));
    }
    return results;
  }

  // ----------------------------------------------------------------
  // chat(prompt, systemPrompt?) → string
  // Envia prompt para o LLM de chat e retorna a resposta
  // ----------------------------------------------------------------
  async chat(prompt: string, systemPrompt?: string): Promise<string> {
    const messages: Array<{ role: string; content: string }> = [];

    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    const response = await this.client.chat({
      model: this.chatModel,
      messages,
      stream: false,
    });

    return response.message?.content ?? '';
  }

  // ----------------------------------------------------------------
  // healthCheck() — chamado no onModuleInit
  // ----------------------------------------------------------------
  async healthCheck(): Promise<boolean> {
    try {
      const tags = await this.client.list();
      const models = tags.models?.map((m) => m.name) ?? [];
      this.logger.log(`Ollama OK — modelos disponíveis: [${models.join(', ')}]`);

      const hasEmbedModel = models.some((m) => m.includes('nomic-embed-text'));
      const hasChatModel = models.some((m) => m.includes(this.chatModel.split(':')[0]));

      if (!hasEmbedModel) {
        this.logger.warn(`Modelo de embedding não encontrado: ${this.embedModel}. Execute: ollama pull ${this.embedModel}`);
      }
      if (!hasChatModel) {
        this.logger.warn(`Modelo de chat não encontrado: ${this.chatModel}. Execute: ollama pull ${this.chatModel}`);
      }

      return true;
    } catch (err) {
      this.logger.error(`Ollama inacessível em ${this.config.get('ollama.baseUrl')}: ${err.message}`);
      // Não lança exceção — permite a API iniciar mesmo se Ollama demorar
      return false;
    }
  }

  // ----------------------------------------------------------------
  // getEmbedDimensions() — utilitário para criação do índice pgvector
  // ----------------------------------------------------------------
  async getEmbedDimensions(): Promise<number> {
    const testEmbedding = await this.embed('dimensão do vetor');
    return testEmbedding.length;
  }
}
