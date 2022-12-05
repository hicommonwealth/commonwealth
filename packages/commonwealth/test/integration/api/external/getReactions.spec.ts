import 'chai/register-should';
import models from 'server/database';
import chai from 'chai';
import 'chai/register-should';
import getReactions from 'server/routes/reactions/getReactions';
import { req, res } from 'test/unit/unitHelpers';
import { GetReactionsReq, OrderByOptions } from 'common-common/src/api/extApiTypes';
import 'test/integration/api/external/dbEntityHooks.spec';
import { testReactions } from 'test/integration/api/external/dbEntityHooks.spec';
import { ReactionAttributes } from 'server/models/reaction';

describe('getReactions Tests', () => {
  it('should return reactions with specified community_id correctly', async () => {
    const r: GetReactionsReq = { community_id: testReactions[0].chain };
    const resp = await getReactions(models, req(r), res()) as any;

    chai.assert.lengthOf(resp.result.reactions, 5);
  });

  it('should return reactions with specified addresses correctly', async () => {
    const r: GetReactionsReq = { community_id: testReactions[0].chain, addresses: ['testAddress-1'] };

    let resp = await getReactions(models, req(r), res()) as any;

    chai.assert.lengthOf(resp.result.reactions, 2);

    r.addresses.push('testAddress-2');
    resp = await getReactions(models, req(r), res()) as any;

    chai.assert.lengthOf(resp.result.reactions, 5);
  });

  it('should paginate correctly', async () => {
    const r: GetReactionsReq = { community_id: testReactions[0].chain, addresses: ['testAddress-2'], limit: 2 };
    let resp = await getReactions(models, req(r), res()) as any;

    chai.assert.lengthOf(resp.result.reactions, 2);

    const first = resp.result.reactions[0];
    const second = resp.result.reactions[0];

    r.page = 2;
    resp = await getReactions(models, req(r), res()) as any;

    chai.assert.lengthOf(resp.result.reactions, 1);
    chai.assert.notDeepEqual(first, resp.result.reactions);
    chai.assert.notDeepEqual(second, resp.result.reactions);
  });

  it('should order correctly', async () => {
    const r: GetReactionsReq = {
      community_id: testReactions[0].chain,
      addresses: ['testAddress-2'],
      sort: OrderByOptions.CREATED
    };
    let resp = await getReactions(models, req(r), res()) as any;

    chai.assert.lengthOf(resp.result.reactions, 3);
    chai.assert.deepEqual(
      resp.result.reactions,
      ([...resp.result.reactions] as ReactionAttributes[]).sort(
        (a, b) => b.created_at.getTime() - a.created_at.getTime()
      )
    );

    r.sort = OrderByOptions.UPDATED;
    resp = await getReactions(models, req(r), res()) as any;

    chai.assert.lengthOf(resp.result.reactions, 3);
    chai.assert.deepEqual(
      resp.result.reactions,
      ([...resp.result.reactions] as ReactionAttributes[]).sort(
        (a, b) => b.updated_at.getTime() - a.updated_at.getTime()
      )
    );
  });
});