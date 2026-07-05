import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 5001,
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
};

if (!config.anthropicApiKey) {
  console.warn('ANTHROPIC_API_KEY is not set — the AI drawing feature will not work.');
}
