import { GetBalanceProvidersReq } from 'common-common/src/api/extApiTypes';
import models from 'server/database';
import { req, res } from 'test/unit/unitHelpers';
import { tokenBalanceCache } from 'test/integration/api/external/cacheHooks.spec';
import chai from 'chai';
import { getBalanceProviders } from 'server/routes/getBalanceProviders';

describe('getTokenBalance Tests', async () => {
  it('returns correct token balance', async () => {
    const r: GetBalanceProvidersReq = {
      chain_node_ids: [(await tokenBalanceCache.getChainNodes())[0].id],
    };

    const resp = (await getBalanceProviders(
      models,
      tokenBalanceCache,
      req(r),
      res()
    )) as any;

    chai.assert.lengthOf(resp.result.balance_providers, 1);
    chai.assert.equal(resp.result.balance_providers[0].bp, 'eth-token');
    chai.assert.deepEqual(resp.result.balance_providers[0].opts, {
      tokenAddress: 'string',
      contractType: 'string',
    });
  });
});
