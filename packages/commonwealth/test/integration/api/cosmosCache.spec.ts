/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable dot-notation */
/* eslint-disable no-unused-expressions */
/* eslint-disable max-len */
require('dotenv').config();
import { CacheNamespaces, cache, dispose } from '@hicommonwealth/core';
import chai from 'chai';
import chaiHttp from 'chai-http';
import { TestServer, testServer } from 'server-test';
import {
  cosmosLCDDuration,
  cosmosRPCDuration,
  cosmosRPCKey,
} from 'server/util/cosmosCache';
const V1BETA1_CHAIN_ID = 'csdk-beta';
const V1_CHAIN_ID = 'csdk';
const V1BETA1_API = `/cosmosAPI`;
const V1_API = `/cosmosAPI/v1`;

chai.use(chaiHttp);
const expect = chai.expect;

function verifyNoCacheResponse(res) {
  expect(res.body).to.not.be.null;
  expect(res).to.have.status(200);
  expect(res).to.not.have.header('X-Cache', 'HIT');
}

describe('Cosmos Cache', () => {
  let server: TestServer;
  const route_namespace: CacheNamespaces = CacheNamespaces.Route_Response;

  async function verifyCacheResponse(key, res, resEarlier) {
    expect(res).to.have.status(200);
    expect(res).to.have.header('X-Cache', 'HIT');
    const valFromRedis = await server.cacheDecorator.checkCache(key);
    expect(valFromRedis).to.not.be.null;
    expect(JSON.parse(valFromRedis)).to.be.deep.equal(res.body);
    expect(JSON.parse(valFromRedis)).to.be.deep.equal(resEarlier.body);
  }

  before(async () => {
    server = await testServer();
    await cache().ready();
  });

  after(async () => {
    await cache().deleteNamespaceKeys(route_namespace);
    await dispose()();
  });

  describe('cosmosAPI', () => {
    async function makeRPCRequest(
      body,
      path = `/cosmosAPI/${V1BETA1_CHAIN_ID}`,
      headers = {
        'content-type': 'text/plain;charset=UTF-8',
        'accept-language': 'en-US,en;q=0.9',
      },
    ) {
      return chai.request(server.app).post(path).set(headers).send(body);
    }

    async function rpcTestIsCached(body, key) {
      const res1 = await makeRPCRequest(body);
      verifyNoCacheResponse(res1);
      const res2 = await makeRPCRequest(body);
      await verifyCacheResponse(key, res2, res1);
    }

    function rpcTestKeyAndDuration(body, expectedKey, expectedDuration) {
      const request = {
        originalUrl: `${V1BETA1_API}/${V1BETA1_CHAIN_ID}`,
      };
      const key = cosmosRPCKey(request, body);
      const duration = cosmosRPCDuration(body);

      expect(key).to.be.equal(expectedKey);
      expect(duration).to.be.equal(expectedDuration);
    }

    const rpcProposalsCacheExpectedTest = async (
      proposalStatus: string,
      expectedDuration: number,
    ) => {
      const request = {
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

      const key = cosmosRPCKey(request, body);
      expect(key).to.be.equal(expectedKey);

      const duration = cosmosRPCDuration(body);
      expect(duration).to.be.equal(expectedDuration);

      await rpcTestIsCached(bodyString, expectedKey);
    };
    it('should cache passed proposals', async () => {
      await rpcProposalsCacheExpectedTest('0803', 30);
    });
    it('should cache passed proposals (paginated request - 0803220a0a080000000000000087)', async () => {
      await rpcProposalsCacheExpectedTest('0803220a0a080000000000000087', 30);
    });
    it('should cache passed proposals (paginated request - 0803220a0a080000000000000100)', async () => {
      await rpcProposalsCacheExpectedTest('0803220a0a080000000000000100', 30);
    });
    it('should cache passed proposals (paginated request - 0803220a0a080000000000000189)', async () => {
      await rpcProposalsCacheExpectedTest('0803220a0a080000000000000189', 30);
    });
    it('should cache rejected proposals', async () => {
      await rpcProposalsCacheExpectedTest('0804', 30);
    });
    it('should cache failed proposals', async () => {
      await rpcProposalsCacheExpectedTest('0805', 30);
    });
    it('should cache deposit period proposals', async () => {
      await rpcProposalsCacheExpectedTest('0801', 10);
    });
    it('should cache voting period proposals', async () => {
      await rpcProposalsCacheExpectedTest('0802', 10);
    });
    it('should cache an individual proposal', async () => {
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
    it('should cache individual proposal votes', async () => {
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
    it('should cache chain params requests', async () => {
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
    it('should cache chain params requests with specific parameter', async () => {
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
    it('should cache pool requests', async () => {
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
    it('should cache status requests', async () => {
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
    it('should cache block requests', async () => {
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
  }).timeout(5000);

  describe('cosmosAPI/v1', () => {
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
      const res1 = await chai.request(server.app).get(url);
      await verifyNoCacheResponse(res1);

      const res2 = await await chai.request(server.app).get(url);
      await verifyCacheResponse(url, res2, res1);
    }

    function lcdTestDuration(
      expectedDuration: number,
      url: string,
      query?: any,
    ) {
      const request = {
        originalUrl: url,
        url,
        query,
      };
      const duration = cosmosLCDDuration(request);
      expect(duration).to.be.equal(expectedDuration);
    }

    it('should have 7-day duration for an an individual proposal', async () => {
      const url = `${V1_API}/${V1_CHAIN_ID}/cosmos/gov/v1/proposals/1`;
      lcdTestDuration(60 * 60 * 24 * 7, url);
    });
    it("should have 6-second duration for an an individual proposal's live votes", async () => {
      const url = `${V1_API}/${V1_CHAIN_ID}/cosmos/gov/v1/proposals/1/votes`;
      lcdTestDuration(6, url);
    });
    it("should have 6-second duration for an individual proposal's live tally", async () => {
      const url = `${V1_API}/${V1_CHAIN_ID}/cosmos/gov/v1/proposals/1/tally`;
      lcdTestDuration(6, url);
    });
    it("should have 6-second duration for an individual proposal's live deposits", async () => {
      const url = `${V1_API}/${V1_CHAIN_ID}/cosmos/gov/v1/proposals/1/deposits`;
      lcdTestDuration(6, url);
    });
    it('should cache deposit period proposals', async () => {
      await lcdProposalsCacheExpectedTest('1', 10);
    });
    it('should cache voting period proposals', async () => {
      await lcdProposalsCacheExpectedTest('2', 10);
    });
    it('should cache passed proposals', async () => {
      await lcdProposalsCacheExpectedTest('3', 30);
    });
    it('should cache rejected proposals', async () => {
      await lcdProposalsCacheExpectedTest('4', 30);
    });
    it('should cache failed proposals', async () => {
      await lcdProposalsCacheExpectedTest('5', 30);
    });
    it('should cache deposit params requests', async () => {
      await lcdParamsCacheExpectedTest('deposit', 60 * 60 * 24 * 5);
    });
    it('should cache tallying params requests', async () => {
      await lcdParamsCacheExpectedTest('tallying', 60 * 60 * 24 * 5);
    });
    it('should cache voting params requests', async () => {
      await lcdParamsCacheExpectedTest('voting', 60 * 60 * 24 * 5);
    });
  });
});
