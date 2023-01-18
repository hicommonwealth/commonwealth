import chai from 'chai';
import 'chai/register-should';
import type { GetChainNodesReq } from 'common-common/src/api/extApiTypes';
import { tokenBalanceCache } from 'test/integration/api/external/cacheHooks.spec';
import { get } from './appHook.spec';

describe('getChainNodes Tests', () => {
  it('should return chainNodes with specified chain_node_ids correctly', async () => {
    const r: GetChainNodesReq = {
      chain_node_ids: (await tokenBalanceCache.getChainNodes()).map(
        (c) => c.id
      ),
    };
    const resp = await get('/api/chainNodes', r, true);

    chai.assert.lengthOf(resp.result.chain_nodes, 1);
    chai.assert.equal(resp.result.count, 1);
  });

  it('should return chainNodes with specified name correctly', async () => {
    const r: GetChainNodesReq = {
      names: (await tokenBalanceCache.getChainNodes()).map((c) => c.name),
    };
    const resp = await get('/api/chainNodes', r, true);

    chai.assert.lengthOf(resp.result.chain_nodes, 1);
    chai.assert.equal(resp.result.count, 1);
  });

  it('should handle errors correctly', async () => {
    let resp = await get('/api/chainNodes', {}, true);

    chai.assert.lengthOf(resp.result, 1);
    chai.assert.equal(
      resp.result[0].msg,
      'Please provide a parameter to query by (chain_node_ids, names)'
    );

    resp = await get(
      '/api/chainNodes',
      {
        names: (await tokenBalanceCache.getChainNodes()).map((c) => c.name),
        count_only: 3,
      },
      true
    );

    chai.assert.lengthOf(resp.result, 1);
    chai.assert.equal(resp.result[0].msg, 'Invalid value');
    chai.assert.equal(resp.result[0].param, 'count_only');
  });
});
