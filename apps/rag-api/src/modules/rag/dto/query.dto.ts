import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class QueryDto {
  @IsString()
  question: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  topK?: number;
}
