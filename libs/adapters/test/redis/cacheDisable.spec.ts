/* eslint-disable dot-notation */
/* eslint-disable no-unused-expressions */
import { CacheNamespaces, cache, dispose } from '@hicommonwealth/core';
import chai from 'chai';
import chaiHttp from 'chai-http';
import * as dotenv from 'dotenv';
import express, { RequestHandler, json } from 'express';
import { CacheDecorator, RedisCache, XCACHE_VALUES } from '../../src/redis';
import {
  CACHE_ENDPOINTS,
  setupCacheTestEndpoints,
} from './setupCacheEndpoints';

dotenv.config();

chai.use(chaiHttp);
const expect = chai.expect;
const app = express();
app.use(json() as RequestHandler);

const content_type = {
  json: 'application/json; charset=utf-8',
  html: 'text/html; charset=utf-8',
};

function verifyNoCacheResponse(
  res,
  status = 200,
  cacheHeader = XCACHE_VALUES.MISS,
) {
  expect(res.body).to.not.be.null;
  expect(res).to.have.status(status);
  expect(res).to.not.have.header('X-Cache', XCACHE_VALUES.HIT);
  expect(res).to.have.header('X-Cache', cacheHeader);
}

async function makeGetRequest(endpoint, headers = {}) {
  headers = { ...headers, Accept: 'application/json' };
  const res = await chai.request(app).get(endpoint).set(headers);

  return res;
}

async function makePostRequest(endpoint, body, headers = {}) {
  headers = { ...headers, Accept: 'application/json' };
  const res = await chai.request(app).post(endpoint).set(headers).send(body);

  return res;
}

describe('Cache Disable Tests', () => {
  console.log(
    `Cache Disable Tests: DISABLE_CACHE ${process.env.DISABLE_CACHE}`,
  );
  const route_namespace: CacheNamespaces = CacheNamespaces.Route_Response;
  let cacheDecorator;

  before(async () => {
    process.env.DISABLE_CACHE = 'true';
    cache(new RedisCache('redis://localhost:6379'));
    cacheDecorator = new CacheDecorator();
    await cache().ready();
    setupCacheTestEndpoints(app, cacheDecorator);
    process.env.DISABLE_CACHE = 'false';
  });

  after(async () => {
    await cache().deleteNamespaceKeys(route_namespace);
    await dispose()();
  });

  it(`verify cache route ${CACHE_ENDPOINTS.TEXT} route and expire`, async () => {
    // make request to /cachedummy/text twice, verify undef cache both first time & cache second time
    const res = await makeGetRequest(CACHE_ENDPOINTS.TEXT);
    verifyNoCacheResponse(res, 200, XCACHE_VALUES.UNDEF);
    expect(res).to.have.header('content-type', content_type.html);

    const res2 = await makeGetRequest(CACHE_ENDPOINTS.TEXT);
    verifyNoCacheResponse(res, 200, XCACHE_VALUES.UNDEF);
    expect(res2).to.have.header('content-type', content_type.html);
  });

  it(`verify cache control skip ${CACHE_ENDPOINTS.JSON} route and expire`, async () => {
    // make request to /cachedummy/json twice, verify undef cache
    const res = await makeGetRequest(CACHE_ENDPOINTS.JSON, {
      'Cache-Control': 'no-cache',
    });
    verifyNoCacheResponse(res, 200, XCACHE_VALUES.UNDEF);
    expect(res).to.have.header('content-type', content_type.json);
  });

  it(`verify no key or duration ${CACHE_ENDPOINTS.CUSTOM_KEY_DURATION} route and expire`, async () => {
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

  it(`verify key ${CACHE_ENDPOINTS.CUSTOM_KEY_DURATION} route and expire`, async () => {
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
  }).timeout(5000);
});
