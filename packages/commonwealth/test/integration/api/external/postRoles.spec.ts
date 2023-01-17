import chai from 'chai';
import jwt from 'jsonwebtoken';
import models from 'server/database';
import { Op } from "sequelize";
import { JWT_SECRET } from '../../../../server/config';
import { post } from './appHook.spec';
import { testAddresses, testChains, testRoles, testUsers } from './dbEntityHooks.spec';

describe('postRoles Tests', () => {
  let jwtToken;

  beforeEach(() => {
    jwtToken = jwt.sign({ id: testUsers[0].id, email: testUsers[0].email }, JWT_SECRET);
  });

  it('add entities to db', async () => {
    jwtToken = jwt.sign({ id: testUsers[2].id, email: testUsers[2].email }, JWT_SECRET);
    const smallestId = testRoles[testRoles.length - 1].id;

    chai.assert.equal(await models.Role.count({ where: { id: { [Op.in]: [smallestId - 1] } } }), 0);

    const resp = await post('/api/roles', {
      jwt: jwtToken,
      roles: [
        { id: smallestId - 1, community_id: testChains[0].id, address_id: testAddresses[2].id },
      ]
    });

    chai.assert.equal(resp.result.error, '');
    chai.assert.equal(await models.Role.count({ where: { id: { [Op.in]: [smallestId - 1] } } }), 1);
  });

  it('fail due to user not owning address', async () => {
    const smallestId = testRoles[testRoles.length - 1].id;

    chai.assert.equal(await models.Role.count({ where: { id: { [Op.in]: [smallestId - 3, smallestId - 4] } } }), 0);

    const resp = await post('/api/roles', {
      jwt: jwtToken,
      roles: [
        { id: smallestId - 1, community_id: testChains[0].id, address_id: testAddresses[1].id },
        { id: smallestId - 2, community_id: testChains[1].id, address: testAddresses[1].address }
      ]
    });

    chai.assert.deepEqual(resp.result.error.unownedAddresses, [{ address: testAddresses[1].address }, { addressId: -2 }]);
    chai.assert.equal(await models.Role.count({ where: { id: { [Op.in]: [smallestId - 3, smallestId - 4] } } }), 0);
  });

  it('fail on input error', async () => {
    const resp = await post('/api/roles', {
      jwt: jwtToken,
      roles: [{ bad: 3 }]
    }, true);

    chai.assert.equal(resp.status, 'Failure');
  });

  it('fail due to invalid jwt token', async () => {
    const resp = await post('/api/roles', {
      roles: [{}]
    }, true);

    chai.assert.equal(resp.statusCode, 401);
  });
});