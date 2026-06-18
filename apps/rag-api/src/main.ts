import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Logger, ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const port = config.get<number>('app.port') ?? 3000;
  const logger = new Logger('Bootstrap');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  await app.listen(port, '0.0.0.0');
  logger.log(`RAG API rodando em http://0.0.0.0:${port}`);
  logger.log(`Ollama: ${config.get('ollama.baseUrl')}`);
  logger.log(`Banco: ${config.get('database.host')}:${config.get('database.port')}/${config.get('database.name')}`);
}

bootstrap();
