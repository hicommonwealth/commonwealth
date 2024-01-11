import chai from 'chai';

import type { GetReactionsReq } from 'server/api/extApiTypes';
import { OrderByOptions } from 'server/api/extApiTypes';
import type { ReactionAttributes } from 'server/models/reaction';
import {
  testComments,
  testReactions,
} from 'test/integration/api/external/dbEntityHooks.spec';
import { get } from './appHook.spec';

describe('getReactions Tests', () => {
  it('should return reactions with specified community_id correctly', async () => {
    const r: GetReactionsReq = { community_id: testReactions[0].community_id };
    const resp = await get('/api/reactions', r, true);

    chai.assert.lengthOf(resp.result.reactions, 5);
  });

  it('should return reactions with specified addresses correctly', async () => {
    const r: GetReactionsReq = {
      community_id: testReactions[0].community_id,
      addresses: ['testAddress-1'],
    };
    let resp = await get('/api/reactions', r, true);

    chai.assert.lengthOf(resp.result.reactions, 2);

    r.addresses.push('testAddress-2');
    resp = await get('/api/reactions', r, true);

    chai.assert.lengthOf(resp.result.reactions, 5);
  });

  it('should paginate correctly', async () => {
    const r: GetReactionsReq = {
      community_id: testReactions[0].community_id,
      addresses: ['testAddress-2'],
      limit: 2,
    };
    let resp = await get('/api/reactions', r, true);

    chai.assert.lengthOf(resp.result.reactions, 2);

    const first = resp.result.reactions[0];
    const second = resp.result.reactions[0];

    r.page = 2;
    resp = await get('/api/reactions', r, true);

    chai.assert.lengthOf(resp.result.reactions, 1);
    chai.assert.notDeepEqual(first, resp.result.reactions);
    chai.assert.notDeepEqual(second, resp.result.reactions);
  });

  it('should order correctly', async () => {
    const r: GetReactionsReq = {
      community_id: testReactions[0].community_id,
      addresses: ['testAddress-2'],
      sort: OrderByOptions.CREATED,
    };
    let resp = await get('/api/reactions', r, true);

    chai.assert.lengthOf(resp.result.reactions, 3);
    chai.assert.deepEqual(
      resp.result.reactions,
      ([...resp.result.reactions] as ReactionAttributes[]).sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      ),
    );

    r.sort = OrderByOptions.UPDATED;
    resp = await get('/api/reactions', r, true);

    chai.assert.lengthOf(resp.result.reactions, 3);
    chai.assert.deepEqual(
      resp.result.reactions,
      ([...resp.result.reactions] as ReactionAttributes[]).sort(
        (a, b) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
      ),
    );
  });

  it('should handle errors correctly', async () => {
    let resp = await get('/api/reactions', {}, true);

    chai.assert.lengthOf(resp.result, 1);
    chai.assert.equal(resp.result[0].msg, 'Invalid value');
    chai.assert.equal(resp.result[0].param, 'community_id');

    resp = await get(
      '/api/reactions',
      { community_id: testComments[0].community_id, count_only: 3 },
      true,
    );

    chai.assert.lengthOf(resp.result, 1);
    chai.assert.equal(resp.result[0].msg, 'Invalid value');
    chai.assert.equal(resp.result[0].param, 'count_only');
  });
});
