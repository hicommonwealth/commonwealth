import { createClient } from '@vercel/kv';
import { StorageAdapter } from 'grammy';
import { createClient as createRedisClient } from 'redis';
import { z } from 'zod';

const envSchema = z.object({
  KV_REST_API_URL: z.string().url().optional(),
  KV_REST_API_TOKEN: z.string().optional(),
  REDIS_URL: z.string().url().optional(),
});

// Prefix all keys to avoid conflicts with main Common app
const KEY_PREFIX = 'common_mini_app:';

export class CommonStorage implements StorageAdapter<any> {
  private kv: ReturnType<typeof createClient> | null = null;
  private redis: ReturnType<typeof createRedisClient> | null = null;

  constructor() {
    const env = envSchema.parse(process.env);

    // Use Vercel KV in production, local Redis in development
    if (env.KV_REST_API_URL && env.KV_REST_API_TOKEN) {
      this.kv = createClient({
        url: env.KV_REST_API_URL,
        token: env.KV_REST_API_TOKEN,
      });
    } else if (env.REDIS_URL) {
      this.redis = createRedisClient({ url: env.REDIS_URL });
      this.redis.connect();
    } else {
      throw new Error('No Redis configuration found');
    }
  }

  private prefixKey(key: string): string {
    return `${KEY_PREFIX}${key}`;
  }

  // Required by Grammy's session middleware
  async read(key: string): Promise<any> {
    const prefixedKey = this.prefixKey(key);
    if (this.kv) {
      return await this.kv.get(prefixedKey);
    }
    if (this.redis) {
      const value = await this.redis.get(prefixedKey);
      return value ? JSON.parse(value) : undefined;
    }
    throw new Error('No storage client available');
  }

  // Required by Grammy's session middleware
  async write(key: string, value: any): Promise<void> {
    const prefixedKey = this.prefixKey(key);
    if (this.kv) {
      await this.kv.set(prefixedKey, value);
    } else if (this.redis) {
      await this.redis.set(prefixedKey, JSON.stringify(value));
    } else {
      throw new Error('No storage client available');
    }
  }

  // Required by Grammy's session middleware
  async delete(key: string): Promise<void> {
    const prefixedKey = this.prefixKey(key);
    if (this.kv) {
      await this.kv.del(prefixedKey);
    } else if (this.redis) {
      await this.redis.del(prefixedKey);
    } else {
      throw new Error('No storage client available');
    }
  }

  async cleanup(): Promise<void> {
    if (this.redis) {
      await this.redis.disconnect();
    }
  }
}
