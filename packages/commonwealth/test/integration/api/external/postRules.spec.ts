import chai from 'chai';
import { Op } from 'sequelize';
import models from 'server/database';
import { post } from './appHook.spec';
import { testChains, testRules } from './dbEntityHooks.spec';

describe('postRules Tests', () => {
  it('add entities to db', async () => {
    const smallestId = testRules[testRules.length - 1].id;

    chai.assert.equal(
      await models.Rule.count({
        where: { id: { [Op.in]: [smallestId - 1, smallestId - 2] } },
      }),
      0
    );

    const resp = await post('/api/rules', {
      rules: [
        { id: smallestId - 1, community_id: testChains[0].id, rule: '' },
        { id: smallestId - 2, community_id: testChains[1].id, rule: '' },
      ],
    });

    chai.assert.equal(resp.result.error, '');
    chai.assert.equal(
      await models.Rule.count({
        where: { id: { [Op.in]: [smallestId - 1, smallestId - 2] } },
      }),
      2
    );
  });

  it('fail on input error', async () => {
    const resp = await post(
      '/api/rules',
      {
        rules: [{ bad: 3 }],
      },
      true
    );

    chai.assert.equal(resp.status, 'Failure');
  });
});
