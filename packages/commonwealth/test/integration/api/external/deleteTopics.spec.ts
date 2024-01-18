import { models } from '@hicommonwealth/model';
import chai from 'chai';
import { Op } from 'sequelize';
import { del, post } from './appHook.spec';
import { testChains, testTopics } from './dbEntityHooks.spec';

describe('deleteTopics Tests', () => {
  it('add entities to db', async () => {
    const smallestId = testTopics[testTopics.length - 1].id;

    chai.assert.equal(
      await models.Topic.count({
        where: { id: { [Op.in]: [smallestId - 1, smallestId - 2] } },
      }),
      0,
    );

    let resp = await post('/api/topics', {
      topics: [
        {
          id: smallestId - 1,
          community_id: testChains[0].id,
          name: 'testName',
        },
        {
          id: smallestId - 2,
          community_id: testChains[0].id,
          name: 'testName',
        },
      ],
    });

    chai.assert.equal(resp.result.error, '');
    chai.assert.equal(
      await models.Topic.count({
        where: { id: { [Op.in]: [smallestId - 1, smallestId - 2] } },
      }),
      2,
    );

    resp = await del('/api/topics', { ids: [smallestId - 1, smallestId - 2] });

    chai.assert.equal(resp.result.error, '');
    chai.assert.equal(
      await models.Topic.count({
        where: { id: { [Op.in]: [smallestId - 1, smallestId - 2] } },
      }),
      0,
    );
  });

  it('fail on input error', async () => {
    const resp = await del(
      '/api/topics',
      {
        topics: [{ bad: 3 }],
      },
      true,
    );

    chai.assert.equal(resp.status, 'Failure');
  });
});
