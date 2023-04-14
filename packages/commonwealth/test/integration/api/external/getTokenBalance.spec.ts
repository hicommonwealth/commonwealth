import BN from 'bn.js';
import chai from 'chai';
import type { GetTokenBalanceReq } from 'common-common/src/api/extApiTypes';
import { tokenBalanceCache, tokenProvider, } from 'test/integration/api/external/cacheHooks.spec';
import { get } from './appHook.spec';

describe('getTokenBalance Tests', async () => {
  it('returns correct token balance', async () => {
    tokenProvider.balanceFn = async (
      tokenAddress: string,
      userAddress: string
    ) => {
      if (userAddress === '0x1' || userAddress === '0x2') {
        return new BN(1);
      }
      return new BN(0);
    };

    const r: GetTokenBalanceReq = {
      chain_node_id: (await tokenBalanceCache.getChainNodes())[0].id,
      addresses: ['0x1', '0x2', '0x3'],
      balance_provider: tokenProvider.name,
      opts: { tokenAddress: '' },
    };

    const resp = await get('/api/tokenBalance', r, true);

    chai.assert.lengthOf(Object.keys(resp.result.balances), 3);
    chai.assert.lengthOf(Object.keys(resp.result.errors), 0);

    chai.assert.equal(resp.result.balances['0x1'], '1');
    chai.assert.equal(resp.result.balances['0x2'], '1');
    chai.assert.equal(resp.result.balances['0x3'], '0');
  });

  it('should handle errors correctly', async () => {
    const resp = await get('/api/tokenBalance', {}, true);

    chai.assert.lengthOf(resp.result, 3);
  });
});
