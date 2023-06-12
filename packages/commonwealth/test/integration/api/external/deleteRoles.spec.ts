import chai from 'chai';
import jwt from 'jsonwebtoken';
import models from 'server/database';
import { Op } from 'sequelize';
import { JWT_SECRET } from '../../../../server/config';
import { del, post } from './appHook.spec';
import {
  testAddresses,
  testChains,
  testRoles,
  testUsers,
} from './dbEntityHooks.spec';

describe('postRoles Tests', () => {
  let jwtToken;
  let jwtTokenUser2;

  before(() => {
    jwtToken = jwt.sign(
      { id: testUsers[2].id, email: testUsers[2].email },
      JWT_SECRET
    );
    jwtTokenUser2 = jwt.sign(
      { id: testUsers[1].id, email: testUsers[1].email },
      JWT_SECRET
    );
  });

  it('add entities to db', async () => {
    const smallestId = testRoles[testRoles.length - 1].id;

    chai.assert.equal(
      await models.Role.count({ where: { id: { [Op.in]: [smallestId - 1] } } }),
      0
    );

    let resp = await post('/api/roles', {
      jwt: jwtToken,
      roles: [
        {
          id: smallestId - 1,
          community_id: testChains[0].id,
          address_id: testAddresses[2].id,
        },
      ],
    });

    chai.assert.equal(resp.result.error, '');
    chai.assert.equal(
      await models.Role.count({ where: { id: { [Op.in]: [smallestId - 1] } } }),
      1
    );

    resp = await del('/api/roles', { jwt: jwtToken, ids: [smallestId - 1] });

    chai.assert.equal(resp.result.error, '');
    chai.assert.equal(
      await models.Role.count({ where: { id: { [Op.in]: [smallestId - 1] } } }),
      0
    );
  });

  it('fail due to user not owning address', async () => {
    const smallestId = testRoles[testRoles.length - 1].id;

    chai.assert.equal(
      await models.Role.count({ where: { id: { [Op.in]: [smallestId - 2] } } }),
      0
    );

    let resp = await post('/api/roles', {
      jwt: jwtToken,
      roles: [
        {
          id: smallestId - 2,
          community_id: testChains[0].id,
          address_id: testAddresses[2].id,
        },
      ],
    });

    chai.assert.equal(resp.result.error, '');
    chai.assert.equal(
      await models.Role.count({ where: { id: { [Op.in]: [smallestId - 2] } } }),
      1
    );

    resp = await del(
      '/api/roles',
      { jwt: jwtTokenUser2, ids: [smallestId - 2] },
      true
    );

    chai.assert.deepEqual(resp.result.error.unownedAddresses, [
      { addressId: -3 },
    ]);
    chai.assert.equal(
      await models.Role.count({ where: { id: { [Op.in]: [smallestId - 2] } } }),
      1
    );
  });

  it('fail on input error', async () => {
    const resp = await del(
      '/api/roles',
      {
        jwt: jwtToken,
        roles: [{ bad: 3 }],
      },
      true
    );

    chai.assert.equal(resp.status, 'Failure');
  });

  it('fail due to invalid jwt token', async () => {
    const resp = await del(
      '/api/roles',
      {
        roles: [{}],
      },
      true
    );

    chai.assert.equal(resp.statusCode, 401);
  });
});
