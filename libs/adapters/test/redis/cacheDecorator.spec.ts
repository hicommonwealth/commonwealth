/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable dot-notation */
/* eslint-disable no-unused-expressions */
import { CacheNamespaces, cache, dispose } from '@hicommonwealth/core';
import { delay } from '@hicommonwealth/shared';
import express, { RequestHandler, json } from 'express';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { CacheDecorator, RedisCache, XCACHE_VALUES } from '../../src/redis';
import {
  CACHE_ENDPOINTS,
  setupCacheTestEndpoints,
} from './setupCacheEndpoints';

const app = express();
app.use(json() as RequestHandler);

const content_type = {
  json: 'application/json; charset=utf-8',
  html: 'text/html; charset=utf-8',
};

function verifyNoCacheResponse(
  res: request.Response,
  status = 200,
  cacheHeader = XCACHE_VALUES.MISS,
) {
  expect(res.body).not.toBeNull();
  expect(res.status).toBe(status);
  expect(res.headers['x-cache']).not.toBe(XCACHE_VALUES.HIT);
  expect(res.headers['x-cache']).toBe(cacheHeader);
}

async function makeGetRequest(endpoint: string, headers = {}) {
  headers = { ...headers, Accept: 'application/json' };
  return request(app).get(endpoint).set(headers);
}

async function makePostRequest(
  endpoint: string,
  body: string | object | undefined,
  headers = {},
) {
  headers = { ...headers, Accept: 'application/json' };
  return request(app).post(endpoint).set(headers).send(body);
}

describe('Cache Decorator', () => {
  let cacheDecorator: CacheDecorator;
  const route_namespace: CacheNamespaces = CacheNamespaces.Route_Response;

  async function verifyCacheResponse(
    key: string,
    res: request.Response,
    resEarlier: request.Response,
  ) {
    expect(res.status).toBe(200);
    expect(res.headers['x-cache']).toBe(XCACHE_VALUES.HIT);
    const valFromRedis = await cacheDecorator.checkCache(key);
    expect(valFromRedis).not.toBeNull();
    if (key === CACHE_ENDPOINTS.JSON) {
      expect(JSON.parse(valFromRedis!)).toEqual(res.body);
      expect(JSON.parse(valFromRedis!)).toEqual(resEarlier.body);
    }
  }

  beforeAll(async () => {
    cache({
      adapter: new RedisCache('redis://localhost:6379'),
    });
    cacheDecorator = new CacheDecorator();
    setupCacheTestEndpoints(app, cacheDecorator);
    await cache().ready();
  });

  afterAll(async () => {
    await cache().deleteNamespaceKeys(route_namespace);
    await dispose()();
  });

  test(
    `verify cache route ${CACHE_ENDPOINTS.TEXT} route and expire`,
    { timeout: 5_000 },
    async () => {
      const res = await makeGetRequest(CACHE_ENDPOINTS.TEXT);
      verifyNoCacheResponse(res);
      expect(res.headers['content-type']).toBe(content_type.html);

      const res2 = await makeGetRequest(CACHE_ENDPOINTS.TEXT);
      await verifyCacheResponse(CACHE_ENDPOINTS.TEXT, res2, res);
      expect(res2.headers['content-type']).toBe(content_type.html);

      await delay(3000);
      const res3 = await makeGetRequest(CACHE_ENDPOINTS.TEXT);
      verifyNoCacheResponse(res3);
    },
  );

  test(`verify cache control skip ${CACHE_ENDPOINTS.JSON} route and expire`, async () => {
    const res = await makeGetRequest(CACHE_ENDPOINTS.JSON, {
      'Cache-Control': 'no-cache',
    });
    verifyNoCacheResponse(res, 200, XCACHE_VALUES.SKIP);
    expect(res.headers['content-type']).toBe(content_type.json);

    const res2 = await makeGetRequest(CACHE_ENDPOINTS.JSON);
    verifyNoCacheResponse(res2, 200);
    expect(res2.headers['content-type']).toBe(content_type.json);
    expect(res2.body).toEqual(res.body);

    const res3 = await makeGetRequest(CACHE_ENDPOINTS.JSON);
    await verifyCacheResponse(CACHE_ENDPOINTS.JSON, res3, res2);
    expect(res3.headers['content-type']).toBe(content_type.json);
    expect(res3.body).toEqual(res.body);
    expect(res3.body).toEqual(res2.body);
  });

  test(`verify no key or duration ${CACHE_ENDPOINTS.CUSTOM_KEY_DURATION} route and expire`, async () => {
    const res = await makePostRequest(CACHE_ENDPOINTS.CUSTOM_KEY_DURATION, {
      duration: 3,
    });
    verifyNoCacheResponse(res, 200, XCACHE_VALUES.NOKEY);

    const res2 = await makePostRequest(CACHE_ENDPOINTS.CUSTOM_KEY_DURATION, {
      key: 'test',
    });
    verifyNoCacheResponse(res2, 200, XCACHE_VALUES.NOKEY);
  });

  test(
    `verify key ${CACHE_ENDPOINTS.CUSTOM_KEY_DURATION} route and expire`,
    { timeout: 5000 },
    async () => {
      const res = await makePostRequest(CACHE_ENDPOINTS.CUSTOM_KEY_DURATION, {
        key: 'test',
        duration: 3,
      });
      verifyNoCacheResponse(res, 200);
      expect(res.headers['content-type']).toBe(content_type.json);
      expect(res.body).toEqual({ key: 'test', duration: 3 });

      const res2 = await makePostRequest(CACHE_ENDPOINTS.CUSTOM_KEY_DURATION, {
        key: 'test',
        duration: 3,
      });
      await verifyCacheResponse('test', res2, res);
      expect(res2.headers['content-type']).toBe(content_type.json);
      expect(res2.body).toEqual({ key: 'test', duration: 3 });

      await delay(3000);
      const res3 = await makePostRequest(CACHE_ENDPOINTS.CUSTOM_KEY_DURATION, {
        key: 'test',
        duration: 3,
      });
      verifyNoCacheResponse(res3, 200);
    },
  );

  test(`dont cache broken route ${CACHE_ENDPOINTS.BROKEN_5XX} route`, async () => {
    let res = await makeGetRequest(CACHE_ENDPOINTS.BROKEN_5XX);
    verifyNoCacheResponse(res, 500);
    res = await makeGetRequest(CACHE_ENDPOINTS.BROKEN_5XX);
    verifyNoCacheResponse(res, 500);
  });
});
