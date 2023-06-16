import chai from 'chai';
import type { GetBalanceProvidersReq } from 'common-common/src/api/extApiTypes';
import models from 'server/database';
import { getBalanceProviders } from 'server/routes/getBalanceProviders';
import { tokenBalanceCache } from 'test/integration/api/external/cacheHooks.spec';
import { getReq, res } from 'test/unit/unitHelpers';

describe('getTokenBalance Tests', async () => {
  it('returns correct token balance', async () => {
    const r: GetBalanceProvidersReq = {
      chain_node_ids: [(await tokenBalanceCache.getChainNodes())[0].id],
    };

    const resp = (await getBalanceProviders(
      models,
      tokenBalanceCache,
      getReq(r),
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
