import 'chai/register-should';
import models from 'server/database';
import chai from 'chai';
import 'chai/register-should';
import { req, res } from 'test/unit/unitHelpers';
import { GetChainNodesReq } from 'common-common/src/api/extApiTypes';
import { tokenBalanceCache } from 'test/integration/api/external/cacheHooks.spec';
import { getChainNodes } from 'server/routes/getChainNodes';

describe('getChainNodes Tests', () => {
  it('should return chainNodes with specified chain_node_ids correctly', async () => {
    const r: GetChainNodesReq = { chain_node_ids: (await tokenBalanceCache.getChainNodes()).map(c => c.id) };
    const resp = await getChainNodes(models, tokenBalanceCache, req(r), res()) as any;

    chai.assert.lengthOf(resp.result.chain_nodes, 1);
    chai.assert.equal(resp.result.count, 1);
  });

  it('should return chainNodes with specified name correctly', async () => {
    const r: GetChainNodesReq = { names: (await tokenBalanceCache.getChainNodes()).map(c => c.name) };
    const resp = await getChainNodes(models, tokenBalanceCache, req(r), res()) as any;

    chai.assert.lengthOf(resp.result.chain_nodes, 1);
    chai.assert.equal(resp.result.count, 1);
  });
});