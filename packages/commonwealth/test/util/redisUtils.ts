import { RedisCache } from '@hicommonwealth/adapters';
import { timeoutPromise } from './delayUtils';

export async function connectToRedis(redisCache: RedisCache) {
  const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
  if (!REDIS_URL) {
    throw new Error('REDIS_URL not set');
  }
  try {
    await Promise.race([timeoutPromise(10000), redisCache.init(REDIS_URL)]);
    if (!redisCache.isInitialized) {
      throw new Error('Redis Cache not initialized');
    }
  } catch (error) {
    throw error;
  }
}
