import chai from 'chai';
import { Op } from 'sequelize';
import models from 'server/database';
import { put } from './appHook.spec';
import { testChainNodes } from './dbEntityHooks.spec';

describe('putCommunities Tests', () => {
  it('add entities to db', async () => {
    chai.assert.equal(
      await models.Community.count({ where: { id: { [Op.in]: ['-1'] } } }),
      0
    );

    const resp = await put('/api/communities', {
      community: {
        id: 'testChain1',
        name: 'testChain1',
        network: 'cmntest',
        type: 'offchain',
        chain_node_id: testChainNodes[0].id,
        default_symbol: 'test',
      },
    });

    chai.assert.equal(resp.result.error, '');
    chai.assert.equal(
      await models.Community.count({
        where: { id: { [Op.in]: ['testChain1', 'testChain2'] } },
      }),
      2
    );
  });

  it('fail on input error', async () => {
    const resp = await put(
      '/api/communities',
      {
        community: { bad: 3 },
      },
      true
    );

    chai.assert.equal(resp.status, 'Failure');
  });
});
