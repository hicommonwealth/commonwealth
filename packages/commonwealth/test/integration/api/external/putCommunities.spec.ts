import chai from 'chai';
import models from 'server/database';
import { Op } from "sequelize";
import { put } from "./appHook.spec";
import { testChainNodes } from "./dbEntityHooks.spec";

describe('putCommunities Tests', () => {
  it('add entities to db', async () => {
    chai.assert.equal(await models.Chain.count({ where: { id: { [Op.in]: ['-1'] } } }), 0);

    const resp = await put('/api/communities', {
      communities: [
        { id: 'testChain1', name: 'testChain1', chain_node_id: testChainNodes[0].id },
        { id: 'testChain2', name: 'testChain2', chain_node_id: testChainNodes[0].id }
      ]
    });

    chai.assert.equal(resp.result.error, '');
    chai.assert.equal(await models.Chain.count({ where: { id: { [Op.in]: ['testChain1', 'testChain2'] } } }), 2);
  });

  it('fail on input error', async () => {
    const resp = await put('/api/communities', {
      communities: [{ bad: 3 }]
    }, true);

    chai.assert.equal(resp.status, 'Failure');
  });
});