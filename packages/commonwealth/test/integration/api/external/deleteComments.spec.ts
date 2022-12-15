import chai from 'chai';
import models from 'server/database';
import { Op } from "sequelize";
import { del, put } from "./appHook.spec";
import { testAddresses, testChains, testComments } from "./dbEntityHooks.spec";

describe('putComments Tests', () => {
  it('add entities to db', async () => {
    const smallestId = testComments[testComments.length - 1].id;

    chai.assert.equal(await models.Comment.count({where: {id: {[Op.in]: [smallestId - 1, smallestId - 2]}}}), 0);

    let resp = await put('/api/comments', {
      comments: [
        {id: smallestId - 1, address_id: testAddresses[0].id, community_id: testChains[0].id, text: "test"},
        {id: smallestId - 2, address_id: testAddresses[0].id, community_id: testChains[0].id, text: "test"}
      ]
    });

    chai.assert.equal(resp.result.error, '');
    chai.assert.equal(await models.Comment.count({where: {id: {[Op.in]: [smallestId - 1, smallestId - 2]}}}), 2);

    resp = await del('/api/comments', { ids: [smallestId - 1, smallestId - 2] });

    chai.assert.equal(resp.result.error, '');
    chai.assert.equal(await models.Comment.count({where: {id: {[Op.in]: [smallestId - 1, smallestId - 2]}}}), 0);
  });

  it('fail on input error', async () => {
    const resp = await del('/api/comments', {
      comments: [{ bad: 3}]
    }, true);

    chai.assert.equal(resp.status, 'Failure');
  });
});