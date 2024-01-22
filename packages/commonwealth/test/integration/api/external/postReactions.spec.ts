import { models } from '@hicommonwealth/model';
import chai from 'chai';
import jwt from 'jsonwebtoken';
import { Op } from 'sequelize';
import { JWT_SECRET } from '../../../../server/config';
import { post } from './appHook.spec';
import {
  testAddresses,
  testChains,
  testReactions,
  testUsers,
} from './dbEntityHooks.spec';

describe('postReactions Tests', () => {
  let jwtToken;

  beforeEach(() => {
    jwtToken = jwt.sign(
      { id: testUsers[0].id, email: testUsers[0].email },
      JWT_SECRET,
    );
  });

  it('add entities to db', async () => {
    const smallestId = testReactions[testReactions.length - 1].id;

    chai.assert.equal(
      await models.Reaction.count({
        where: { id: { [Op.in]: [smallestId - 1, smallestId - 2] } },
      }),
      0,
    );

    const resp = await post('/api/reactions', {
      jwt: jwtToken,
      reactions: [
        {
          id: smallestId - 1,
          address_id: testAddresses[0].id,
          community_id: testChains[0].id,
          reaction: 'like',
        },
        {
          id: smallestId - 2,
          address_id: testAddresses[0].id,
          community_id: testChains[0].id,
          reaction: 'like',
        },
      ],
    });

    chai.assert.equal(resp.result.error, '');
    chai.assert.equal(
      await models.Reaction.count({
        where: { id: { [Op.in]: [smallestId - 1, smallestId - 2] } },
      }),
      2,
    );
  });

  it('fail due to user not owning address', async () => {
    const smallestId = testReactions[testReactions.length - 1].id;

    chai.assert.equal(
      await models.Reaction.count({
        where: { id: { [Op.in]: [smallestId - 3, smallestId - 4] } },
      }),
      0,
    );

    const resp = await post('/api/reactions', {
      jwt: jwtToken,
      reactions: [
        {
          id: smallestId - 1,
          address_id: testAddresses[1].id,
          community_id: testChains[0].id,
          reaction: 'like',
        },
        {
          id: smallestId - 2,
          address: testAddresses[1].address,
          community_id: testChains[0].id,
          reaction: 'like',
        },
      ],
    });

    chai.assert.deepEqual(resp.result.error.unownedAddresses, [
      { address: testAddresses[1].address },
      { addressId: -2 },
    ]);
    chai.assert.equal(
      await models.Reaction.count({
        where: { id: { [Op.in]: [smallestId - 3, smallestId - 4] } },
      }),
      0,
    );
  });

  it('fail on input error', async () => {
    const resp = await post(
      '/api/reactions',
      {
        jwt: jwtToken,
        reactions: [{ bad: 3 }],
      },
      true,
    );

    chai.assert.equal(resp.status, 'Failure');
  });

  it('fail due to invalid jwt token', async () => {
    const resp = await post(
      '/api/reactions',
      {
        comments: [{}],
      },
      true,
    );

    chai.assert.equal(resp.statusCode, 401);
  });
});
