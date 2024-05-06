/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable dot-notation */
/* eslint-disable no-unused-expressions */
import { CacheNamespaces, cache, dispose } from '@hicommonwealth/core';
import { delay } from '@hicommonwealth/shared';
import chai from 'chai';
import { RedisCache } from '../../src';
const expect = chai.expect;

async function addRandomKeys(test_namespace: CacheNamespaces) {
  const random = Math.random();
  const key1 = `testKey${random}`;
  const value1 = `testValue${random}`;
  const key2 = `testKey${random + 1}`;
  const value2 = `testValue${random + 1}`;
  const key3 = `testKey${random + 2}`;
  const value3 = `testValue${random + 2}`;
  await cache().setKey(test_namespace, key1, value1);
  await cache().setKey(test_namespace, key2, value2);
  await cache().setKey(test_namespace, key3, value3);
  return {
    [`${RedisCache.getNamespaceKey(test_namespace, key1)}`]: value1,
    [`${RedisCache.getNamespaceKey(test_namespace, key2)}`]: value2,
    [`${RedisCache.getNamespaceKey(test_namespace, key3)}`]: value3,
  };
}

export async function testExpiry(test_namespace: CacheNamespaces) {
  const random = Math.random();
  const key = `testKey${random}`;
  const value = `testValue${random}`;
  const ttl = 3;
  await cache().setKey(test_namespace, key, value, ttl);
  let result = await cache().getKey(test_namespace, key);
  expect(result).to.equal(value);
  await delay((ttl + 1) * 1000);
  result = await cache().getKey(test_namespace, key);
  expect(result).to.equal(null);
}

describe('RedisCache', () => {
  const test_namespace: CacheNamespaces = CacheNamespaces.Test_Redis;

  before(async () => {
    cache(new RedisCache('redis://localhost:6379'));
    await cache().ready();
    await cache().deleteNamespaceKeys(test_namespace);
  });

  after(async () => {
    await dispose()();
  });

  afterEach(async () => {
    await cache().deleteNamespaceKeys(test_namespace);
  });

  it('should set and get a key with namespace', async () => {
    const random = Math.random();
    const key = `testKey${random}`;
    const value = `testValue${random}`;
    await cache().setKey(test_namespace, key, value);
    const result = await cache().getKey(test_namespace, key);
    expect(result).to.equal(value);
  });

  it('test key expiry', async () => {
    await testExpiry(test_namespace);
  }).timeout(5000);

  it('should get multiple keys with namespace', async () => {
    const data = await addRandomKeys(test_namespace);
    const result = await cache().getNamespaceKeys(test_namespace);
    expect(result).to.deep.equal(data);
  });

  it('should delete multiple keys with namespace', async () => {
    await addRandomKeys(test_namespace);
    const records = await cache().deleteNamespaceKeys(test_namespace);
    expect(records).to.equal(3);
    const result = await cache().getNamespaceKeys(test_namespace);
    expect(result).to.deep.equal({});
  });
});
