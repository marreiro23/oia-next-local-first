import { registerAs } from '@nestjs/config';

export default registerAs('ollama', () => ({
  baseUrl: process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434',
  embedModel: process.env.OLLAMA_EMBED_MODEL ?? 'nomic-embed-text:latest',
  chatModel: process.env.OLLAMA_CHAT_MODEL ?? 'qwen2.5-coder:14b',
  timeoutMs: parseInt(process.env.OLLAMA_TIMEOUT_MS ?? '60000', 10),
}));
