import { IsObject, IsOptional, IsString } from 'class-validator';

export class IngestDto {
  @IsString()
  content: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
