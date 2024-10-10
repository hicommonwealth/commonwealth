/* eslint-disable dot-notation */
/* eslint-disable no-unused-expressions */
import { CacheNamespaces, cache, dispose } from '@hicommonwealth/core';
import chai from 'chai';
import chaiHttp from 'chai-http';
import express, { RequestHandler, json } from 'express';
import { afterAll, beforeAll, describe, test } from 'vitest';
import { config } from '../../src/config';
import { CacheDecorator, RedisCache, XCACHE_VALUES } from '../../src/redis';
import {
  CACHE_ENDPOINTS,
  setupCacheTestEndpoints,
} from './setupCacheEndpoints';

chai.use(chaiHttp);
const expect = chai.expect;
const app = express();
app.use(json() as RequestHandler);

const content_type = {
  json: 'application/json; charset=utf-8',
  html: 'text/html; charset=utf-8',
};

function verifyNoCacheResponse(
  res: ChaiHttp.Response,
  status = 200,
  cacheHeader = XCACHE_VALUES.MISS,
) {
  expect(res.body).to.not.be.null;
  expect(res).to.have.status(status);
  expect(res).to.not.have.header('X-Cache', XCACHE_VALUES.HIT);
  expect(res).to.have.header('X-Cache', cacheHeader);
}

async function makeGetRequest(endpoint: string, headers = {}) {
  headers = { ...headers, Accept: 'application/json' };
  const res = await chai.request(app).get(endpoint).set(headers);

  return res;
}

async function makePostRequest(
  endpoint: string,
  body: string | object | undefined,
  headers = {},
) {
  headers = { ...headers, Accept: 'application/json' };
  const res = await chai.request(app).post(endpoint).set(headers).send(body);

  return res;
}

describe('Cache Disable Tests', () => {
  console.log(
    `Cache Disable Tests: DISABLE_CACHE ${config.CACHE.DISABLE_CACHE}`,
  );
  const route_namespace: CacheNamespaces = CacheNamespaces.Route_Response;
  let cacheDecorator;

  beforeAll(async () => {
    config.CACHE.DISABLE_CACHE = true;
    cache({
      adapter: new RedisCache('redis://localhost:6379'),
    });
    cacheDecorator = new CacheDecorator();
    await cache().ready();
    setupCacheTestEndpoints(app, cacheDecorator);
    config.CACHE.DISABLE_CACHE = false;
  });

  afterAll(async () => {
    await cache().deleteNamespaceKeys(route_namespace);
    await dispose()();
  });

  test(`verify cache route ${CACHE_ENDPOINTS.TEXT} route and expire`, async () => {
    // make request to /cachedummy/text twice, verify undef cache both first time & cache second time
    const res = await makeGetRequest(CACHE_ENDPOINTS.TEXT);
    verifyNoCacheResponse(res, 200, XCACHE_VALUES.UNDEF);
    expect(res).to.have.header('content-type', content_type.html);

    const res2 = await makeGetRequest(CACHE_ENDPOINTS.TEXT);
    verifyNoCacheResponse(res, 200, XCACHE_VALUES.UNDEF);
    expect(res2).to.have.header('content-type', content_type.html);
  });

  test(`verify cache control skip ${CACHE_ENDPOINTS.JSON} route and expire`, async () => {
    // make request to /cachedummy/json twice, verify undef cache
    const res = await makeGetRequest(CACHE_ENDPOINTS.JSON, {
      'Cache-Control': 'no-cache',
    });
    verifyNoCacheResponse(res, 200, XCACHE_VALUES.UNDEF);
    expect(res).to.have.header('content-type', content_type.json);
  });

  test(`verify no key or duration ${CACHE_ENDPOINTS.CUSTOM_KEY_DURATION} route and expire`, async () => {
    // make request to /cachedummy/customkeyduration twice, verify undef cache with no key or duration
    const res = await makePostRequest(CACHE_ENDPOINTS.CUSTOM_KEY_DURATION, {
      duration: 3,
    });
    verifyNoCacheResponse(res, 200, XCACHE_VALUES.UNDEF);

    const res2 = await makePostRequest(CACHE_ENDPOINTS.CUSTOM_KEY_DURATION, {
      key: 'test',
    });
    verifyNoCacheResponse(res2, 200, XCACHE_VALUES.UNDEF);
  });

  test(
    `verify key ${CACHE_ENDPOINTS.CUSTOM_KEY_DURATION} route and expire`,
    { timeout: 5_000 },
    async () => {
      // make request to /cachedummy/customkeyduration twice, verify undef cache with both key and duration both times
      const res = await makePostRequest(CACHE_ENDPOINTS.CUSTOM_KEY_DURATION, {
        key: 'test',
        duration: 3,
      });
      verifyNoCacheResponse(res, 200, XCACHE_VALUES.UNDEF);
      expect(res).to.have.header('content-type', content_type.json);
      expect(res.body).to.be.deep.equal({ key: 'test', duration: 3 });

      const res2 = await makePostRequest(CACHE_ENDPOINTS.CUSTOM_KEY_DURATION, {
        key: 'test',
        duration: 3,
      });
      verifyNoCacheResponse(res2, 200, XCACHE_VALUES.UNDEF);
      expect(res2).to.have.header('content-type', content_type.json);
      expect(res2.body).to.be.deep.equal({ key: 'test', duration: 3 });
    },
  );
});
