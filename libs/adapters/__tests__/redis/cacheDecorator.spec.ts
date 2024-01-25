/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable dot-notation */
/* eslint-disable no-unused-expressions */
require('dotenv').config();
import { RedisNamespaces } from '@hicommonwealth/core';
import chai from 'chai';
import chaiHttp from 'chai-http';
import express from 'express';
import {
  CacheDecorator,
  connectToRedis,
  RedisCache,
  XCACHE_VALUES,
} from '../../src/redis';
import { delay } from '../../src/utils/delayUtils';
import {
  CACHE_ENDPOINTS,
  setupCacheTestEndpoints,
} from './setupCacheEndpoints';

chai.use(chaiHttp);
const expect = chai.expect;
const app = express();
app.use(express.json());
const cacheDecorator = new CacheDecorator();
setupCacheTestEndpoints(app, cacheDecorator);

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

async function verifyCacheResponse(key, res, resEarlier) {
  expect(res).to.have.status(200);
  expect(res).to.have.header('X-Cache', XCACHE_VALUES.HIT);
  const valFromRedis = await cacheDecorator.checkCache(key);
  expect(valFromRedis).to.not.be.null;
  if (key === CACHE_ENDPOINTS.JSON) {
    // to avoid unhandled exceptions when response is not json
    expect(JSON.parse(valFromRedis)).to.be.deep.equal(res.body);
    expect(JSON.parse(valFromRedis)).to.be.deep.equal(resEarlier.body);
  }
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

describe('Cache Decorator', () => {
  const redisCache: RedisCache = new RedisCache();
  const route_namespace: RedisNamespaces = RedisNamespaces.Route_Response;

  before(async () => {
    await connectToRedis(redisCache);
    cacheDecorator.setCache(redisCache);
  });

  after(async () => {
    await redisCache.deleteNamespaceKeys(route_namespace);
    await redisCache.closeClient();
  });

  it(`verify cache route ${CACHE_ENDPOINTS.TEXT} route and expire`, async () => {
    // make request to /cachedummy/text twice, verify no cache first time & cache second time
    const res = await makeGetRequest(CACHE_ENDPOINTS.TEXT);
    verifyNoCacheResponse(res);
    expect(res).to.have.header('content-type', content_type.html);

    const res2 = await makeGetRequest(CACHE_ENDPOINTS.TEXT);
    verifyCacheResponse(CACHE_ENDPOINTS.TEXT, res2, res);
    expect(res2).to.have.header('content-type', content_type.html);

    // wait for cache to expire
    await delay(3000);
    const res3 = await makeGetRequest(CACHE_ENDPOINTS.TEXT);
    verifyNoCacheResponse(res3);
  }).timeout(5000);

  it(`verify cache control skip ${CACHE_ENDPOINTS.JSON} route and expire`, async () => {
    // make request to /cachedummy/json twice, verify skip cache first time & miss second time & hit third time
    const res = await makeGetRequest(CACHE_ENDPOINTS.JSON, {
      'Cache-Control': 'no-cache',
    });
    verifyNoCacheResponse(res, 200, XCACHE_VALUES.SKIP);
    expect(res).to.have.header('content-type', content_type.json);

    const res2 = await makeGetRequest(CACHE_ENDPOINTS.JSON);
    verifyNoCacheResponse(res2, 200);
    expect(res2).to.have.header('content-type', content_type.json);
    expect(res2.body).to.be.deep.equal(res.body);

    const res3 = await makeGetRequest(CACHE_ENDPOINTS.JSON);
    verifyCacheResponse(CACHE_ENDPOINTS.JSON, res3, res2);
    expect(res3).to.have.header('content-type', content_type.json);
    expect(res3.body).to.be.deep.equal(res.body);
    expect(res3.body).to.be.deep.equal(res2.body);
  });

  it(`verify no key or duration ${CACHE_ENDPOINTS.CUSTOM_KEY_DURATION} route and expire`, async () => {
    // make request to /cachedummy/customkeyduration twice, verify no cache both first time & second time
    const res = await makePostRequest(CACHE_ENDPOINTS.CUSTOM_KEY_DURATION, {
      duration: 3,
    });
    verifyNoCacheResponse(res, 200, XCACHE_VALUES.NOKEY);

    const res2 = await makePostRequest(CACHE_ENDPOINTS.CUSTOM_KEY_DURATION, {
      key: 'test',
    });
    verifyNoCacheResponse(res2, 200, XCACHE_VALUES.NOKEY);
  });

  it(`verify key ${CACHE_ENDPOINTS.CUSTOM_KEY_DURATION} route and expire`, async () => {
    // make request to /cachedummy/customkeyduration twice, verify no cache both first time
    // & cache second time for passed duration & expire after duration
    const res = await makePostRequest(CACHE_ENDPOINTS.CUSTOM_KEY_DURATION, {
      key: 'test',
      duration: 3,
    });
    verifyNoCacheResponse(res, 200);
    expect(res).to.have.header('content-type', content_type.json);
    expect(res.body).to.be.deep.equal({ key: 'test', duration: 3 });

    const res2 = await makePostRequest(CACHE_ENDPOINTS.CUSTOM_KEY_DURATION, {
      key: 'test',
      duration: 3,
    });
    verifyCacheResponse('test', res2, res);
    expect(res2).to.have.header('content-type', content_type.json);
    expect(res2.body).to.be.deep.equal({ key: 'test', duration: 3 });

    // wait for cache to expire
    await delay(3000);
    const res3 = await makePostRequest(CACHE_ENDPOINTS.CUSTOM_KEY_DURATION, {
      key: 'test',
      duration: 3,
    });
    verifyNoCacheResponse(res3, 200);
  }).timeout(5000);

  it(`dont cache broken route ${CACHE_ENDPOINTS.BROKEN_5XX} route`, async () => {
    // make request to /cachedummy/broken5xx twice, verify no cache both first time & second time
    let res = await makeGetRequest(CACHE_ENDPOINTS.BROKEN_5XX);
    verifyNoCacheResponse(res, 500);
    res = await makeGetRequest(CACHE_ENDPOINTS.BROKEN_5XX);
    verifyNoCacheResponse(res, 500);
  });
});
