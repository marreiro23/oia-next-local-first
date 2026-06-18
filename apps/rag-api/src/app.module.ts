import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RagModule } from './modules/rag/rag.module';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import ollamaConfig from './config/ollama.config';

@Module({
  imports: [
    // ----------------------------------------------------------
    // ConfigModule: carrega variáveis de ambiente com validação
    // isGlobal: true → disponível em todos os módulos sem reimportar
    // ----------------------------------------------------------
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, ollamaConfig],
      envFilePath: ['.env.local', '.env'],
    }),

    // ----------------------------------------------------------
    // TypeORM: conexão com pgvector via DI — sem hardcode
    // DB_SYNCHRONIZE=true apenas em desenvolvimento local
    // ----------------------------------------------------------
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('database.host'),
        port: config.get<number>('database.port'),
        database: config.get<string>('database.name'),
        username: config.get<string>('database.user'),
        password: config.get<string>('database.pass'),
        synchronize: config.get<boolean>('database.synchronize'),
        autoLoadEntities: true,   // carrega entidades registradas nos módulos
        logging: config.get('app.env') === 'development' ? ['error', 'warn'] : false,
      }),
    }),

    // ----------------------------------------------------------
    // Feature modules
    // ----------------------------------------------------------
    RagModule,
  ],
})
export class AppModule {}
