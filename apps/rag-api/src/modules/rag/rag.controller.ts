import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { IngestDto } from './dto/ingest.dto';
import { PromptGeneratorDto } from './dto/prompt-generator.dto';
import { QueryDto } from './dto/query.dto';
import { RagService } from './rag.service';

@Controller('rag')
export class RagController {
  constructor(private readonly ragService: RagService) {}

  /** GET /rag/health — status do pipeline */
  @Get('health')
  health() {
    return this.ragService.healthCheck();
  }

  /** POST /rag/ingest — ingere um documento e gera embedding */
  @Post('ingest')
  ingest(@Body() dto: IngestDto) {
    return this.ragService.ingest(dto.content, dto.metadata ?? {});
  }

  /** GET /rag/search?q=...&topK=5 — busca vetorial pura */
  @Get('search')
  search(@Query('q') q: string, @Query('topK') topK?: string) {
    return this.ragService.search(q, topK ? parseInt(topK, 10) : 5);
  }

  /** POST /rag/query — pipeline completo: embed → search → LLM */
  @Post('query')
  query(@Body() dto: QueryDto) {
    return this.ragService.query(dto.question, dto.topK ?? 5);
  }

  /** POST /rag/prompt — gera prompt estruturado com contexto RAG */
  @Post('prompt')
  generatePrompt(@Body() dto: PromptGeneratorDto) {
    return this.ragService.generatePrompt(dto.task, dto.topK ?? 8);
  }
}
