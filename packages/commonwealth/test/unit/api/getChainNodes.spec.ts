import 'chai/register-should';
import models from 'server/database';
import chai from 'chai';
import 'chai/register-should';
import { req, res } from 'test/unit/unitHelpers';
import { GetChainNodesReq, OrderByOptions } from 'common-common/src/api/extApiTypes';
import './rootHooks.spec';
import { testChainNodes } from 'test/unit/api/rootHooks.spec';
import { getChainNodes } from 'server/routes/getChainNodes';

describe('getChainNodes Tests', () => {
  it('should return chainNodes with specified balance_type correctly', async () => {
    const r: GetChainNodesReq = { balance_types: [testChainNodes[0].balance_type] };
    const resp = await getChainNodes(models, req(r), res()) as any;

    chai.assert.lengthOf(resp.result.chainNodes, 2);
  });

  it('should return chainNodes with specified name correctly', async () => {
    const r: GetChainNodesReq = { names: [testChainNodes[0].name] };

    let resp = await getChainNodes(models, req(r), res()) as any;

    chai.assert.lengthOf(resp.result.chainNodes, 1);

    r.names.push(testChainNodes[1].name);
    resp = await getChainNodes(models, req(r), res()) as any;

    chai.assert.lengthOf(resp.result.chainNodes, 2);
  });
});