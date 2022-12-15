import chai from 'chai';
import models from 'server/database';
import { Op } from "sequelize";
import { del, post } from "./appHook.spec";
import { testChains, testRoles } from "./dbEntityHooks.spec";

describe('postRoles Tests', () => {
  it('add entities to db', async () => {
    const smallestId = testRoles[testRoles.length - 1].id;

    chai.assert.equal(await models.Role.count({ where: { id: { [Op.in]: [smallestId - 1, smallestId - 2] } } }), 0);

    let resp = await post('/api/roles', {
      roles: [
        { id: smallestId - 1, community_id: testChains[0].id, address_id: -3 },
        { id: smallestId - 2, community_id: testChains[1].id, address_id: -4 }
      ]
    });

    chai.assert.equal(resp.result.error, '');
    chai.assert.equal(await models.Role.count({ where: { id: { [Op.in]: [smallestId - 1, smallestId - 2] } } }), 2);

    resp = await del('/api/roles', { ids: [smallestId - 1, smallestId - 2] });

    chai.assert.equal(resp.result.error, '');
    chai.assert.equal(await models.Role.count({where: {id: {[Op.in]: [smallestId - 1, smallestId - 2]}}}), 0);
  });

  it('fail on input error', async () => {
    const resp = await del('/api/roles', {
      roles: [{ bad: 3 }]
    }, true);

    chai.assert.equal(resp.status, 'Failure');
  });
});