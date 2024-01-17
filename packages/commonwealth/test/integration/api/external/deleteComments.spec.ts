import { models } from '@hicommonwealth/model';
import chai from 'chai';
import jwt from 'jsonwebtoken';
import { Op } from 'sequelize';
import { JWT_SECRET } from '../../../../server/config';
import { del, put } from './appHook.spec';
import {
  testAddresses,
  testChains,
  testComments,
  testThreads,
  testUsers,
} from './dbEntityHooks.spec';

describe('deleteComments Tests', () => {
  let jwtToken;
  let jwtTokenUser2;

  beforeEach(() => {
    jwtToken = jwt.sign(
      { id: testUsers[0].id, email: testUsers[0].email },
      JWT_SECRET,
    );
    jwtTokenUser2 = jwt.sign(
      { id: testUsers[1].id, email: testUsers[1].email },
      JWT_SECRET,
    );
  });

  it('add entities to db', async () => {
    const smallestId = testComments[testComments.length - 1].id;

    chai.assert.equal(
      await models.Comment.count({
        where: { id: { [Op.in]: [smallestId - 1, smallestId - 2] } },
      }),
      0,
    );

    let resp = await put('/api/comments', {
      jwt: jwtToken,
      comments: [
        {
          id: smallestId - 1,
          address_id: testAddresses[0].id,
          community_id: testChains[0].id,
          thread_id: testThreads[0].id,
          text: 'test',
        },
        {
          id: smallestId - 2,
          address_id: testAddresses[0].id,
          community_id: testChains[0].id,
          thread_id: testThreads[0].id,
          text: 'test',
        },
      ],
    });

    chai.assert.equal(resp.result.error, '');
    chai.assert.equal(
      await models.Comment.count({
        where: { id: { [Op.in]: [smallestId - 1, smallestId - 2] } },
      }),
      2,
    );

    resp = await del('/api/comments', {
      jwt: jwtToken,
      ids: [smallestId - 1, smallestId - 2],
    });

    chai.assert.equal(resp.result.error, '');
    chai.assert.equal(
      await models.Comment.count({
        where: { id: { [Op.in]: [smallestId - 1, smallestId - 2] } },
      }),
      0,
    );
  });

  it('fail due to user not owning address', async () => {
    const smallestId = testComments[testComments.length - 1].id;

    chai.assert.equal(
      await models.Comment.count({
        where: { id: { [Op.in]: [smallestId - 3, smallestId - 4] } },
      }),
      0,
    );

    let resp = await put('/api/comments', {
      jwt: jwtToken,
      comments: [
        {
          id: smallestId - 3,
          address_id: testAddresses[0].id,
          community_id: testChains[0].id,
          thread_id: testThreads[0].id,
          text: 'test',
        },
        {
          id: smallestId - 4,
          address: testAddresses[0].address,
          community_id: testChains[0].id,
          thread_id: testThreads[0].id,
          text: 'test',
        },
      ],
    });

    chai.assert.equal(resp.result.error, '');
    chai.assert.equal(
      await models.Comment.count({
        where: { id: { [Op.in]: [smallestId - 3, smallestId - 4] } },
      }),
      2,
    );

    resp = await del(
      '/api/comments',
      { jwt: jwtTokenUser2, ids: [smallestId - 3, smallestId - 4] },
      true,
    );

    chai.assert.deepEqual(resp.result.error.unownedAddresses, [
      { addressId: -1 },
    ]);
    chai.assert.equal(
      await models.Comment.count({
        where: { id: { [Op.in]: [smallestId - 3, smallestId - 4] } },
      }),
      2,
    );
  });

  it('fail on input error', async () => {
    const resp = await del(
      '/api/comments',
      {
        jwt: jwtToken,
        comments: [{ bad: 3 }],
      },
      true,
    );

    chai.assert.equal(resp.status, 'Failure');
  });

  it('fail due to invalid jwt token', async () => {
    const resp = await del(
      '/api/comments',
      {
        comments: [{}],
      },
      true,
    );

    chai.assert.equal(resp.statusCode, 401);
  });
});
