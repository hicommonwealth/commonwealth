const chai = require('chai');
const expect = chai.expect;
import { RedisCache } from 'common-common/src/redisCache';
import { RedisNamespaces } from 'common-common/src/types';

function timeoutPromise(timeout: number) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      reject(new Error(`Timed out after ${timeout}ms`));
    }, timeout);
  });
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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

export async function testExpiry(
  redisCache: RedisCache,
  test_namespace: RedisNamespaces
) {
  const random = Math.random();
  const key = `testKey${random}`;
  const value = `testValue${random}`;
  const ttl = 3;
  await redisCache.setKey(test_namespace, key, value, ttl);
  let result = await redisCache.getKey(test_namespace, key);
  expect(result).to.equal(value);
  await sleep((ttl + 1) * 1000);
  result = await redisCache.getKey(test_namespace, key);
  expect(result).to.equal(null);
}

describe('RedisCache', () => {
  let redisCache: RedisCache;
  const test_namespace: RedisNamespaces = RedisNamespaces.Test_Redis;

  before(async () => {
    redisCache = new RedisCache();
    await connectToRedis(redisCache);
  });

  after(async () => {
    await redisCache.closeClient();
  });

  it('should set and get a key with namespace', async () => {
    const random = Math.random();
    const key = `testKey${random}`;
    const value = `testValue${random}`;
    await redisCache.setKey(test_namespace, key, value);
    const result = await redisCache.getKey(test_namespace, key);
    expect(result).to.equal(value);
  });

  it('test key expiry', async () => {
    await testExpiry(redisCache, test_namespace);
  });
});
