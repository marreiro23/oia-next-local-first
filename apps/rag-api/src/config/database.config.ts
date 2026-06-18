import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  name: process.env.DB_NAME ?? 'ragdb',
  user: process.env.DB_USER ?? 'raguser',
  pass: process.env.DB_PASS ?? 'ragpass',
  // Nunca true em produção — use migrations
  synchronize: process.env.DB_SYNCHRONIZE === 'true',
}));
