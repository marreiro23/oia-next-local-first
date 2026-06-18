import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OllamaProvider } from './providers/ollama.provider';
import { RagDocument } from './entities/rag-document.entity';
import { RagService } from './rag.service';
import { RagController } from './rag.controller';

/**
 * RagModule
 *
 * Módulo feature-based para o pipeline RAG.
 * DI tree:
 *   RagController → RagService → OllamaProvider
 *                             → Repository<RagDocument>
 */
@Module({
  imports: [
    // Registra a entidade no TypeORM e disponibiliza o Repository via DI
    TypeOrmModule.forFeature([RagDocument]),
  ],
  providers: [
    // OllamaProvider é @Injectable e recebe ConfigService via DI do AppModule
    OllamaProvider,
    RagService,
  ],
  controllers: [RagController],
  // Exporta para que outros módulos possam injetar sem reimportar
  exports: [OllamaProvider, RagService],
})
export class RagModule {}
