require('dotenv').config();
import chai from 'chai';
import 'chai/register-should';
import chaiHttp from 'chai-http';
chai.use(chaiHttp);
const expect = chai.expect;

import { RedisCache } from 'common-common/src/redisCache';
import { RedisNamespaces } from 'common-common/src/types';
import { cacheDecorator } from 'common-common/src/cacheDecorator';
import app, { resetDatabase } from '../../../server-test';
import { connectToRedis } from '../../util/redisUtils';
import {
  cosmosLCDDuration,
  cosmosRPCDuration,
  cosmosRPCKey,
} from 'server/util/cosmosCache';

function verifyNoCacheResponse(res) {
  expect(res.body).to.not.be.null;
  expect(res).to.have.status(200);
  expect(res).to.not.have.header('X-Cache', 'HIT');
}

async function verifyCacheResponse(key, res, resEarlier) {
  expect(res).to.have.status(200);
  expect(res).to.have.header('X-Cache', 'HIT');
  const valFromRedis = await cacheDecorator.checkCache(key);
  expect(valFromRedis).to.not.be.null;
  expect(JSON.parse(valFromRedis)).to.be.deep.equal(res.body);
  expect(JSON.parse(valFromRedis)).to.be.deep.equal(resEarlier.body);
}

describe('Cosmos Cache', () => {
  const redisCache: RedisCache = new RedisCache();
  const route_namespace: RedisNamespaces = RedisNamespaces.Route_Response;

  before(async () => {
    await resetDatabase();
    await connectToRedis(redisCache);
    cacheDecorator.setCache(redisCache);
  });

  after(async () => {
    await redisCache.deleteNamespaceKeys(route_namespace);
    await redisCache.closeClient();
  });

  describe('cosmosAPI', () => {
    async function makeRPCRequest(
      body,
      path = '/cosmosAPI/juno',
      headers = {
        'content-type': 'text/plain;charset=UTF-8',
        'accept-language': 'en-US,en;q=0.9',
      }
    ) {
      return chai.request(app).post(path).set(headers).send(body);
    }

    async function rpcTestIsCached(body, key) {
      const res1 = await makeRPCRequest(body);
      verifyNoCacheResponse(res1);
      const res2 = await makeRPCRequest(body);
      await verifyCacheResponse(key, res2, res1);
    }

    function rpcTestKeyAndDuration(body, expectedKey, expectedDuration) {
      const request = {
        originalUrl: '/cosmosAPI/juno',
      };
      const key = cosmosRPCKey(request, body);
      const duration = cosmosRPCDuration(body);

      expect(key).to.be.equal(expectedKey);
      expect(duration).to.be.equal(expectedDuration);
    }

    const rpcProposalsCacheExpectedTest = async (
      proposalStatus: string,
      expectedDuration: number
    ) => {
      const request = {
        originalUrl: '/cosmosAPI/juno',
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
      const expectedKey = `/cosmosAPI/juno_{"path":"/cosmos.gov.v1beta1.Query/Proposals","data":"${proposalStatus}","prove":false}`;

      const key = cosmosRPCKey(request, body);
      expect(key).to.be.equal(expectedKey);

      const duration = cosmosRPCDuration(body);
      expect(duration).to.be.equal(expectedDuration);

      await rpcTestIsCached(bodyString, expectedKey);
    };
    it('should cache passed proposals', async () => {
      await rpcProposalsCacheExpectedTest('0803', 60 * 15);
    });
    it('should cache passed proposals (paginated request - 0803220a0a080000000000000087)', async () => {
      await rpcProposalsCacheExpectedTest(
        '0803220a0a080000000000000087',
        60 * 15
      );
    });
    it('should cache passed proposals (paginated request - 0803220a0a080000000000000100)', async () => {
      await rpcProposalsCacheExpectedTest(
        '0803220a0a080000000000000100',
        60 * 15
      );
    });
    it('should cache passed proposals (paginated request - 0803220a0a080000000000000189)', async () => {
      await rpcProposalsCacheExpectedTest(
        '0803220a0a080000000000000189',
        60 * 15
      );
    });
    it('should cache rejected proposals', async () => {
      await rpcProposalsCacheExpectedTest('0804', 60 * 15);
    });
    it('should cache failed proposals', async () => {
      await rpcProposalsCacheExpectedTest('0805', 60 * 15);
    });
    it('should cache deposit period proposals', async () => {
      await rpcProposalsCacheExpectedTest('0801', 60 * 5);
    });
    it('should cache voting period proposals', async () => {
      await rpcProposalsCacheExpectedTest('0802', 60 * 5);
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
      const expectedKey =
        '/cosmosAPI/juno_{"path":"/cosmos.gov.v1beta1.Query/Proposal","data":"08b502","prove":false}';

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
      const expectedKey = `/cosmosAPI/juno_{"path":"/cosmos.gov.v1beta1.Query/Votes","data":"08b502","prove":false}`;

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
      const expectedKey = `/cosmosAPI/juno_${params.path}`;

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
      const expectedKey = `/cosmosAPI/juno_${JSON.stringify(params)}`;

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
      const expectedKey = `/cosmosAPI/juno_${params.path}`;

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
      const expectedKey = `/cosmosAPI/juno_${bodyString}`;

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

      const expectedKey = `/cosmosAPI/juno_${bodyString}`;

      rpcTestKeyAndDuration(body, expectedKey, 6);
      await rpcTestIsCached(bodyString, expectedKey);
    });
  });

  describe('cosmosLCD', () => {
    const lcdProposalsCacheExpectedTest = async (
      proposalStatus: string,
      expectedDuration: number
    ) => {
      const url = `/cosmosLCD/csdk/cosmos/gov/v1/proposals?proposal_status=${proposalStatus}&voter=&depositor=`;
      lcdTestDuration(expectedDuration, url, {
        proposal_status: proposalStatus,
      });
      await lcdTestIsCached(url);
    };

    const lcdParamsCacheExpectedTest = async (
      param: string,
      expectedDuration: number
    ) => {
      const url = `/cosmosLCD/csdk/cosmos/gov/v1/params/${param}`;
      lcdTestDuration(expectedDuration, url);
      await lcdTestIsCached(url);
    };

    async function lcdTestIsCached(url) {
      const res1 = await chai.request(app).get(url);
      await verifyNoCacheResponse(res1);

      const res2 = await await chai.request(app).get(url);
      await verifyCacheResponse(url, res2, res1);
    }

    function lcdTestDuration(
      expectedDuration: number,
      url: string,
      query?: any
    ) {
      const request = {
        originalUrl: url,
        url,
        query,
      };
      const duration = cosmosLCDDuration(request);
      expect(duration).to.be.equal(expectedDuration);
    }

    it('should cache an individual proposal', async () => {
      const url = `/cosmosLCD/csdk/cosmos/gov/v1/proposals/1`;

      lcdTestDuration(60 * 60 * 24 * 7, url);
      await lcdTestIsCached(url);
    });
    it("should cache an individual proposal's live votes", async () => {
      const url = `/cosmosLCD/csdk/cosmos/gov/v1/proposals/1/votes`;

      lcdTestDuration(6, url);
      await lcdTestIsCached(url);
    });
    it("should cache an individual proposal's live tally", async () => {
      const url = `/cosmosLCD/csdk/cosmos/gov/v1/proposals/1/tally`;

      lcdTestDuration(6, url);
      await lcdTestIsCached(url);
    });
    it("should cache an individual proposal's live deposits", async () => {
      const url = `/cosmosLCD/csdk/cosmos/gov/v1/proposals/1/deposits`;

      lcdTestDuration(6, url);
      await lcdTestIsCached(url);
    });
    it('should cache deposit period proposals', async () => {
      await lcdProposalsCacheExpectedTest('1', 60 * 5);
    });
    it('should cache voting period proposals', async () => {
      await lcdProposalsCacheExpectedTest('2', 60 * 5);
    });
    it('should cache passed proposals', async () => {
      await lcdProposalsCacheExpectedTest('3', 60 * 15);
    });
    it('should cache rejected proposals', async () => {
      await lcdProposalsCacheExpectedTest('4', 60 * 15);
    });
    it('should cache failed proposals', async () => {
      await lcdProposalsCacheExpectedTest('5', 60 * 15);
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
