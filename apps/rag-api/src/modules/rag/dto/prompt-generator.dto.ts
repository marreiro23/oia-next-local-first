import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class PromptGeneratorDto {
  @IsString()
  task: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  topK?: number = 8;
}
