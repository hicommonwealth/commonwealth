/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable dot-notation */
/* eslint-disable no-unused-expressions */
const chai = require('chai');
const expect = chai.expect;
import { RedisNamespaces } from '@hicommonwealth/core';
import { RedisCache, connectToRedis, delay } from '../../src';

async function addRandomKeys(
  redisCache: RedisCache,
  test_namespace: RedisNamespaces,
) {
  const random = Math.random();
  const key1 = `testKey${random}`;
  const value1 = `testValue${random}`;
  const key2 = `testKey${random + 1}`;
  const value2 = `testValue${random + 1}`;
  const key3 = `testKey${random + 2}`;
  const value3 = `testValue${random + 2}`;
  await redisCache.setKey(test_namespace, key1, value1);
  await redisCache.setKey(test_namespace, key2, value2);
  await redisCache.setKey(test_namespace, key3, value3);
  return {
    [`${RedisCache.getNamespaceKey(test_namespace, key1)}`]: value1,
    [`${RedisCache.getNamespaceKey(test_namespace, key2)}`]: value2,
    [`${RedisCache.getNamespaceKey(test_namespace, key3)}`]: value3,
  };
}

export async function testExpiry(
  redisCache: RedisCache,
  test_namespace: RedisNamespaces,
) {
  const random = Math.random();
  const key = `testKey${random}`;
  const value = `testValue${random}`;
  const ttl = 3;
  await redisCache.setKey(test_namespace, key, value, ttl);
  let result = await redisCache.getKey(test_namespace, key);
  expect(result).to.equal(value);
  await delay((ttl + 1) * 1000);
  result = await redisCache.getKey(test_namespace, key);
  expect(result).to.equal(null);
}

describe('RedisCache', () => {
  let redisCache: RedisCache;
  const test_namespace: RedisNamespaces = RedisNamespaces.Test_Redis;

  before(async () => {
    redisCache = new RedisCache();
    await connectToRedis(redisCache);
    await redisCache.deleteNamespaceKeys(test_namespace);
  });

  after(async () => {
    await redisCache.closeClient();
  });

  afterEach(async () => {
    await redisCache.deleteNamespaceKeys(test_namespace);
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
  }).timeout(5000);

  it('should get multiple keys with namespace', async () => {
    const data = await addRandomKeys(redisCache, test_namespace);
    const result = await redisCache.getNamespaceKeys(test_namespace);
    expect(result).to.deep.equal(data);
  });

  it('should delete multiple keys with namespace', async () => {
    await addRandomKeys(redisCache, test_namespace);
    const records = await redisCache.deleteNamespaceKeys(test_namespace);
    expect(records).to.equal(3);
    const result = await redisCache.getNamespaceKeys(test_namespace);
    expect(result).to.deep.equal({});
  });
});
