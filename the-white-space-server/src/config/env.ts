import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 5000,
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
};
