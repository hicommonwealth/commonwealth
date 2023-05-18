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
import { delay } from '../../util/delayUtils';

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

    const rpcProposalsCacheExpectedTest = async (proposalStatus: string) => {
      const params = `{"path":"/cosmos.gov.v1beta1.Query/Proposals","data":"${proposalStatus}","prove":false}`;
      const body = `{"jsonrpc":"2.0","id":382288611593,"method":"abci_query","params":${params}}`;
      const key = `/cosmosAPI/juno_${params}`;
      await rpcTestIsCached(body, key);
    };

    it('should cache passed proposals', async () => {
      await rpcProposalsCacheExpectedTest('0803');
    });
    it('should cache passed proposals (Osmosis case - 0803220a0a080000000000000087)', async () => {
      await rpcProposalsCacheExpectedTest('0803220a0a080000000000000087');
    });
    it('should cache passed proposals (Osmosis case - 0803220a0a080000000000000100)', async () => {
      await rpcProposalsCacheExpectedTest('0803220a0a080000000000000100');
    });
    it('should cache passed proposals (Osmosis case - 0803220a0a080000000000000189)', async () => {
      await rpcProposalsCacheExpectedTest('0803220a0a080000000000000189');
    });
    it('should cache rejected proposals', async () => {
      await rpcProposalsCacheExpectedTest('0804');
    });
    it('should cache failed proposals', async () => {
      await rpcProposalsCacheExpectedTest('0805');
    });
    it('should cache deposit period proposals', async () => {
      await rpcProposalsCacheExpectedTest('0801');
    });
    it('should cache voting period proposals for short period', async () => {
      const statusCode = '0802';
      const body = `{"jsonrpc":"2.0","id":382288611593,"method":"abci_query","params":{"path":"/cosmos.gov.v1beta1.Query/Proposals","data":"${statusCode}","prove":false}}`;
      await rpcProposalsCacheExpectedTest(statusCode);

      console.log('waiting 7 seconds');
      // wait 7 seconds then expect cached request to be expired
      await delay(7000);
      const res3 = await makeRPCRequest(body);

      expect(res3).to.have.status(200);
      expect(res3).to.not.have.header('X-Cache', 'HIT');
    });
    it('should cache params requests', async () => {
      const body =
        '{"jsonrpc":"2.0","id":533311223528,"method":"abci_query","params":{"path":"/cosmos.staking.v1beta1.Query/Params","data":"","prove":false}}';
      const key = '/cosmosAPI/juno_/cosmos.staking.v1beta1.Query/Params';
      await rpcTestIsCached(body, key);
    });
    it('should cache pool requests', async () => {
      const body =
        '{"jsonrpc":"2.0","id":411681968672,"method":"abci_query","params":{"path":"/cosmos.staking.v1beta1.Query/Pool","data":"","prove":false}}';
      const key = '/cosmosAPI/juno_/cosmos.staking.v1beta1.Query/Pool';
      await rpcTestIsCached(body, key);
    });
    it('should cache status requests', async () => {
      const body =
        '{"jsonrpc":"2.0","id":599352122315,"method":"status","params":{}}';
      const key =
        '/cosmosAPI/juno_{"jsonrpc":"2.0","id":599352122315,"method":"status","params":{}}';
      await rpcTestIsCached(body, key);
    });
  });
  describe('cosmosLCD', () => {
    const lcdProposalsCacheExpectedTest = async (proposalStatus: string) => {
      const query = `/cosmosLCD/csdk/cosmos/gov/v1/proposals?proposal_status=${proposalStatus}&voter=&depositor=`;
      const res1 = await chai.request(app).get(query);
      await verifyNoCacheResponse(res1);

      const res2 = await chai.request(app).get(query);
      await verifyCacheResponse(query, res2, res1);
    };

    const lcdParamsCacheExpectedTest = async (param: string) => {
      const query = `/cosmosLCD/csdk/cosmos/gov/v1/params/${param}`;
      const res1 = await chai.request(app).get(query);
      await verifyNoCacheResponse(res1);

      const res2 = await await chai.request(app).get(query);
      await verifyCacheResponse(query, res2, res1);
    };

    it('should cache deposit period proposals for a short period', async () => {
      const statusCode = '1';
      const query = `/cosmosLCD/csdk/cosmos/gov/v1/proposals?proposal_status=${statusCode}&voter=&depositor=`;
      await lcdProposalsCacheExpectedTest(statusCode);

      console.log('waiting 7 seconds');
      // wait 7 seconds then expect cached request to be expired
      await delay(7000);

      const res3 = await chai
        .request(app)
        .get(query)
        .set('accept', 'application/json, text/plain, */*');

      expect(res3).to.have.status(200);
      expect(res3).to.not.have.header('X-Cache', 'HIT');
    });
    it('should cache voting period proposals', async () => {
      await lcdProposalsCacheExpectedTest('2');
    });
    it('should cache passed proposals', async () => {
      await lcdProposalsCacheExpectedTest('3');
    });
    it('should cache rejected proposals', async () => {
      await lcdProposalsCacheExpectedTest('4');
    });
    it('should cache failed proposals', async () => {
      await lcdProposalsCacheExpectedTest('5');
    });
    it('should cache deposit params requests', async () => {
      await lcdParamsCacheExpectedTest('deposit');
    });
    it('should cache tallying params requests', async () => {
      await lcdParamsCacheExpectedTest('tallying');
    });
    it('should cache voting params requests', async () => {
      await lcdParamsCacheExpectedTest('voting');
    });
  });
});
