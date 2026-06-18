import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * RagDocument
 *
 * Entidade que representa um documento ingerido no pipeline RAG.
 * O campo `embedding` é um vetor pgvector.
 * O índice HNSW é criado via migration — não via synchronize.
 */
@Entity('rag_documents')
export class RagDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Conteúdo original do chunk */
  @Column({ type: 'text' })
  content: string;

  /** Metadados livres: fonte, autor, página, etc. */
  @Column({ type: 'jsonb', default: '{}' })
  metadata: Record<string, unknown>;

  /**
   * Vetor de embedding gerado pelo OllamaProvider.
   * Dimensão depende do modelo (nomic-embed-text = 768).
   * Armazenado como vector(768) para permitir busca por similaridade.
   */
  @Column({ type: 'vector', length: 768, nullable: true })
  embedding: number[] | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
