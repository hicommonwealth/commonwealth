/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable dot-notation */
/* eslint-disable no-unused-expressions */
/* eslint-disable max-len */
import { CacheNamespaces, cache, dispose } from '@hicommonwealth/core';
import fetch from 'node-fetch';
import { TestServer, testServer } from 'server-test';
import {
  cosmosLCDDuration,
  cosmosRPCDuration,
  cosmosRPCKey,
} from 'server/util/cosmosCache';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';

const V1BETA1_CHAIN_ID = 'csdk-beta';
const V1_CHAIN_ID = 'csdk';
const V1BETA1_API = `/api/cosmosProxy`;
const V1_API = `/api/cosmosProxy/v1`;

function verifyNoCacheResponse(res, body) {
  expect(body).not.toBeNull();
  expect(res.status).toBe(200);
  expect(res.headers.get('x-cache')).not.toBe('HIT');
}

describe('Cosmos Cache', () => {
  let server: TestServer;
  let baseUrl: string;
  const route_namespace: CacheNamespaces = CacheNamespaces.Route_Response;

  async function verifyCacheResponse(key, res, body, resEarlier, bodyEarlier) {
    expect(res.status).toBe(200);
    expect(res.headers.get('x-cache')).toBe('HIT');
    const valFromRedis = await server.cacheDecorator.checkCache(key);
    expect(valFromRedis).not.toBeNull();
    // @ts-expect-error StrictNullChecks
    expect(JSON.parse(valFromRedis)).toEqual(body);
    // @ts-expect-error StrictNullChecks
    expect(JSON.parse(valFromRedis)).toEqual(bodyEarlier);
  }

  beforeAll(async () => {
    server = await testServer();
    baseUrl = server.baseUrl;
    await cache().ready();
  });

  afterAll(async () => {
    await cache().deleteNamespaceKeys(route_namespace);
    await dispose()();
  });

  describe('cosmosAPI', { timeout: 5_000 }, () => {
    async function makeRPCRequest(
      body,
      path = `${V1BETA1_API}/${V1BETA1_CHAIN_ID}`,
      headers = {
        'content-type': 'text/plain;charset=UTF-8',
        'accept-language': 'en-US,en;q=0.9',
      },
    ) {
      const res = await fetch(`${baseUrl}${path}`, {
        method: 'POST',
        headers,
        body,
      });
      const resBody = await res.json();
      return { res, body: resBody };
    }

    async function rpcTestIsCached(body, key) {
      const { res: res1, body: body1 } = await makeRPCRequest(body);
      verifyNoCacheResponse(res1, body1);
      const { res: res2, body: body2 } = await makeRPCRequest(body);
      await verifyCacheResponse(key, res2, body2, res1, body1);
    }

    function rpcTestKeyAndDuration(body, expectedKey, expectedDuration) {
      const requestObj = {
        originalUrl: `${V1BETA1_API}/${V1BETA1_CHAIN_ID}`,
      };
      const key = cosmosRPCKey(requestObj, body);
      const duration = cosmosRPCDuration(body);

      expect(key).toBe(expectedKey);
      expect(duration).toBe(expectedDuration);
    }

    const rpcProposalsCacheExpectedTest = async (
      proposalStatus: string,
      expectedDuration: number,
    ) => {
      const requestObj = {
        originalUrl: `${V1BETA1_API}/${V1BETA1_CHAIN_ID}`,
      };
      const params = {
        path: '/cosmos.gov.v1beta1.Query/Proposals',
        data: proposalStatus,
        prove: false,
      };
      const body = {
        jsonrpc: '2.0',
        id: 382288611593,
        method: 'abci_query',
        params: params,
      };
      const bodyString = JSON.stringify(body);
      const expectedKey = `${V1BETA1_API}/${V1BETA1_CHAIN_ID}_{"path":"/cosmos.gov.v1beta1.Query/Proposals","data":"${proposalStatus}","prove":false}`;

      const key = cosmosRPCKey(requestObj, body);
      expect(key).toBe(expectedKey);

      const duration = cosmosRPCDuration(body);
      expect(duration).toBe(expectedDuration);

      await rpcTestIsCached(bodyString, expectedKey);
    };
    test('should cache passed proposals', async () => {
      await rpcProposalsCacheExpectedTest('0803', 30);
    });
    test('should cache passed proposals (paginated request - 0803220a0a080000000000000087)', async () => {
      await rpcProposalsCacheExpectedTest('0803220a0a080000000000000087', 30);
    });
    test('should cache passed proposals (paginated request - 0803220a0a080000000000000100)', async () => {
      await rpcProposalsCacheExpectedTest('0803220a0a080000000000000100', 30);
    });
    test('should cache passed proposals (paginated request - 0803220a0a080000000000000189)', async () => {
      await rpcProposalsCacheExpectedTest('0803220a0a080000000000000189', 30);
    });
    test('should cache rejected proposals', async () => {
      await rpcProposalsCacheExpectedTest('0804', 30);
    });
    test('should cache failed proposals', async () => {
      await rpcProposalsCacheExpectedTest('0805', 30);
    });
    test('should cache deposit period proposals', async () => {
      await rpcProposalsCacheExpectedTest('0801', 10);
    });
    test('should cache voting period proposals', async () => {
      await rpcProposalsCacheExpectedTest('0802', 10);
    });
    test('should cache an individual proposal', async () => {
      const body = {
        jsonrpc: '2.0',
        id: 695367312169,
        method: 'abci_query',
        params: {
          path: '/cosmos.gov.v1beta1.Query/Proposal',
          data: '08b502',
          prove: false,
        },
      };
      const bodyString = JSON.stringify(body);
      const expectedKey = `${V1BETA1_API}/${V1BETA1_CHAIN_ID}_{"path":"/cosmos.gov.v1beta1.Query/Proposal","data":"08b502","prove":false}`;

      rpcTestKeyAndDuration(body, expectedKey, 60 * 60 * 24 * 7);
      await rpcTestIsCached(bodyString, expectedKey);
    });
    test('should cache individual proposal votes', async () => {
      const params = {
        path: '/cosmos.gov.v1beta1.Query/Votes',
        data: '08b502',
        prove: false,
      };
      const body = {
        jsonrpc: '2.0',
        id: 382288611593,
        method: 'abci_query',
        params: params,
      };
      const bodyString = JSON.stringify(body);
      const expectedKey = `${V1BETA1_API}/${V1BETA1_CHAIN_ID}_{"path":"/cosmos.gov.v1beta1.Query/Votes","data":"08b502","prove":false}`;

      rpcTestKeyAndDuration(body, expectedKey, 6);
      await rpcTestIsCached(bodyString, expectedKey);
    });
    test('should cache chain params requests', async () => {
      const params = {
        path: '/cosmos.staking.v1beta1.Query/Params',
        data: '',
        prove: false,
      };
      const body = {
        jsonrpc: '2.0',
        id: 533311223528,
        method: 'abci_query',
        params,
      };
      const bodyString = JSON.stringify(body);
      const expectedKey = `${V1BETA1_API}/${V1BETA1_CHAIN_ID}_${params.path}`;

      rpcTestKeyAndDuration(body, expectedKey, 60 * 60 * 24 * 5);
      await rpcTestIsCached(bodyString, expectedKey);
    });
    test('should cache chain params requests with specific parameter', async () => {
      const params = {
        path: '/cosmos.staking.v1beta1.Query/Params',
        data: '0a076465706f736974',
        prove: false,
      };
      const body = {
        jsonrpc: '2.0',
        id: 533311223528,
        method: 'abci_query',
        params,
      };
      const bodyString = JSON.stringify(body);
      const expectedKey = `${V1BETA1_API}/${V1BETA1_CHAIN_ID}_${JSON.stringify(
        params,
      )}`;

      rpcTestKeyAndDuration(body, expectedKey, 60 * 60 * 24 * 5);
      await rpcTestIsCached(bodyString, expectedKey);
    });
    test('should cache pool requests', async () => {
      const params = {
        path: '/cosmos.staking.v1beta1.Query/Pool',
        data: '',
        prove: false,
      };
      const body = {
        jsonrpc: '2.0',
        id: 411681968672,
        method: 'abci_query',
        params,
      };
      const bodyString = JSON.stringify(body);
      const expectedKey = `${V1BETA1_API}/${V1BETA1_CHAIN_ID}_${params.path}`;

      rpcTestKeyAndDuration(body, expectedKey, 60 * 60 * 24 * 5);
      await rpcTestIsCached(bodyString, expectedKey);
    });
    test('should cache status requests', async () => {
      const body = {
        jsonrpc: '2.0',
        id: 927661494768,
        method: 'status',
        params: {},
      };
      const bodyString = JSON.stringify(body);
      const expectedKey = `${V1BETA1_API}/${V1BETA1_CHAIN_ID}_${bodyString}`;

      rpcTestKeyAndDuration(body, expectedKey, 6);
      await rpcTestIsCached(bodyString, expectedKey);
    });
    test('should cache block requests', async () => {
      const body = {
        jsonrpc: '2.0',
        id: 559422771321,
        method: 'block',
        params: {},
      };
      const bodyString = JSON.stringify(body);

      const expectedKey = `${V1BETA1_API}/${V1BETA1_CHAIN_ID}_${bodyString}`;

      rpcTestKeyAndDuration(body, expectedKey, 6);
      await rpcTestIsCached(bodyString, expectedKey);
    });
  });

  describe(V1_API, () => {
    const lcdProposalsCacheExpectedTest = async (
      proposalStatus: string,
      expectedDuration: number,
    ) => {
      const url = `${V1_API}/${V1_CHAIN_ID}/cosmos/gov/v1/proposals?proposal_status=${proposalStatus}&voter=&depositor=`;
      lcdTestDuration(expectedDuration, url, {
        proposal_status: proposalStatus,
      });
      await lcdTestIsCached(url);
    };

    const lcdParamsCacheExpectedTest = async (
      param: string,
      expectedDuration: number,
    ) => {
      const url = `${V1_API}/${V1_CHAIN_ID}/cosmos/gov/v1/params/${param}`;
      lcdTestDuration(expectedDuration, url);
      await lcdTestIsCached(url);
    };

    async function lcdTestIsCached(url) {
      const res1 = await fetch(`${baseUrl}${url}`);
      const body1 = await res1.json();
      await verifyNoCacheResponse(res1, body1);

      const res2 = await fetch(`${baseUrl}${url}`);
      const body2 = await res2.json();
      await verifyCacheResponse(url, res2, body2, res1, body1);
    }

    function lcdTestDuration(
      expectedDuration: number,
      url: string,
      query?: any,
    ) {
      const requestObj = {
        originalUrl: url,
        url,
        query,
      };
      const duration = cosmosLCDDuration(requestObj);
      expect(duration).toBe(expectedDuration);
    }

    test('should have 7-day duration for an an individual proposal', () => {
      const url = `${V1_API}/${V1_CHAIN_ID}/cosmos/gov/v1/proposals/1`;
      lcdTestDuration(60 * 60 * 24 * 7, url);
    });
    test("should have 6-second duration for an an individual proposal's live votes", () => {
      const url = `${V1_API}/${V1_CHAIN_ID}/cosmos/gov/v1/proposals/1/votes`;
      lcdTestDuration(6, url);
    });
    test("should have 6-second duration for an individual proposal's live tally", () => {
      const url = `${V1_API}/${V1_CHAIN_ID}/cosmos/gov/v1/proposals/1/tally`;
      lcdTestDuration(6, url);
    });
    test("should have 6-second duration for an individual proposal's live deposits", () => {
      const url = `${V1_API}/${V1_CHAIN_ID}/cosmos/gov/v1/proposals/1/deposits`;
      lcdTestDuration(6, url);
    });
    test('should cache deposit period proposals', async () => {
      await lcdProposalsCacheExpectedTest('1', 10);
    });
    test('should cache voting period proposals', async () => {
      await lcdProposalsCacheExpectedTest('2', 10);
    });
    test('should cache passed proposals', async () => {
      await lcdProposalsCacheExpectedTest('3', 30);
    });
    test('should cache rejected proposals', async () => {
      await lcdProposalsCacheExpectedTest('4', 30);
    });
    test('should cache failed proposals', async () => {
      await lcdProposalsCacheExpectedTest('5', 30);
    });
    test('should cache deposit params requests', async () => {
      await lcdParamsCacheExpectedTest('deposit', 60 * 60 * 24 * 5);
    });
    test('should cache tallying params requests', async () => {
      await lcdParamsCacheExpectedTest('tallying', 60 * 60 * 24 * 5);
    });
    test('should cache voting params requests', async () => {
      await lcdParamsCacheExpectedTest('voting', 60 * 60 * 24 * 5);
    });
  });
});
