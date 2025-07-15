/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable dot-notation */
/* eslint-disable no-unused-expressions */
import { CacheNamespaces, cache, dispose } from '@hicommonwealth/core';
import { delay } from '@hicommonwealth/shared';
import { afterAll, afterEach, beforeAll, describe, expect, test } from 'vitest';
import { RedisCache } from '../../src';

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

export async function testLpushAndGetList(test_namespace: CacheNamespaces) {
  const random = Math.random();
  const key = `testListKey${random}`;
  const items = [`item1-${random}`, `item2-${random}`, `item3-${random}`];

  await cache().lpushAndTrim(test_namespace, key, items[0], 5);
  let result = await cache().getList(test_namespace, key);
  expect(result).to.deep.equal([items[0]]);

  await cache().lpushAndTrim(test_namespace, key, items[1], 5);
  result = await cache().getList(test_namespace, key);
  expect(result).to.deep.equal([items[1], items[0]]);

  await cache().lpushAndTrim(test_namespace, key, items[2], 5);
  result = await cache().getList(test_namespace, key);
  expect(result).to.deep.equal([items[2], items[1], items[0]]);
}

export async function testLpushAndTrim(test_namespace: CacheNamespaces) {
  const random = Math.random();
  const key = `testTrimKey${random}`;

  for (let i = 0; i < 5; i++) {
    await cache().lpushAndTrim(test_namespace, key, `item${i}-${random}`, 3);
  }

  const result = await cache().getList(test_namespace, key);
  expect(result).to.have.length(3);
  expect(result).to.deep.equal([
    `item4-${random}`,
    `item3-${random}`,
    `item2-${random}`,
  ]);
}

describe('RedisCache', () => {
  const test_namespace: CacheNamespaces = CacheNamespaces.Test_Redis;

  beforeAll(async () => {
    cache({
      adapter: new RedisCache('redis://localhost:6379'),
    });
    await cache().ready();
    await cache().deleteNamespaceKeys(test_namespace);
  });

  afterAll(async () => {
    await dispose()();
  });

  afterEach(async () => {
    await cache().deleteNamespaceKeys(test_namespace);
  });

  test('should set and get a key with namespace', async () => {
    const random = Math.random();
    const key = `testKey${random}`;
    const value = `testValue${random}`;
    await cache().setKey(test_namespace, key, value);
    const result = await cache().getKey(test_namespace, key);
    expect(result).to.equal(value);
  });

  test('test key expiry', { timeout: 5_000 }, async () => {
    await testExpiry(test_namespace);
  });

  test('should be able to lpush to a list and get the list', async () => {
    await testLpushAndGetList(test_namespace);
  });

  test('should trim list when it exceeds max length', async () => {
    await testLpushAndTrim(test_namespace);
  });

  test('should get multiple keys with namespace', async () => {
    const data = await addRandomKeys(test_namespace);
    const result = await cache().getNamespaceKeys(test_namespace);
    expect(result).to.deep.equal(data);
  });

  test('should delete multiple keys with namespace', async () => {
    await addRandomKeys(test_namespace);
    const records = await cache().deleteNamespaceKeys(test_namespace);
    expect(records).to.equal(3);
    const result = await cache().getNamespaceKeys(test_namespace);
    expect(result).to.deep.equal({});
  });
});
