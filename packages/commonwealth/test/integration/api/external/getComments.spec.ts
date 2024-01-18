import chai from 'chai';
import chaiHttp from 'chai-http';

import type { CommentAttributes } from '@hicommonwealth/model';
import type { GetCommentsReq } from 'server/api/extApiTypes';
import { OrderByOptions } from 'server/api/extApiTypes';
import { get } from 'test/integration/api/external/appHook.spec';
import { testComments } from 'test/integration/api/external/dbEntityHooks.spec';

chai.use(chaiHttp);

describe('getComments Tests', () => {
  it('should return comments with specified community_id correctly', async () => {
    const r: GetCommentsReq = {
      community_id: testComments[0].community_id,
      count_only: false,
    };
    const resp = await get('/api/comments', r);

    chai.assert.lengthOf(resp.result.comments, 5);
  });

  it('should return count only when specified correctly', async () => {
    const r: GetCommentsReq = {
      community_id: testComments[0].community_id,
      count_only: true,
    };
    const resp = await get('/api/comments', r);

    chai.assert.equal(resp.result.count, 5);
    chai.assert.isUndefined(resp.result.comments);
  });

  it('should return comments with specified addresses correctly', async () => {
    const r: GetCommentsReq = {
      community_id: testComments[0].community_id,
      addresses: ['testAddress-1'],
    };

    let resp = await get('/api/comments', r);

    chai.assert.lengthOf(resp.result.comments, 2);

    r.addresses.push('testAddress-2');
    resp = await get('/api/comments', r);

    chai.assert.lengthOf(resp.result.comments, 5);
  });

  it('should return comments with specified thread_id correctly', async () => {
    const r: GetCommentsReq = {
      community_id: testComments[0].community_id,
      thread_ids: [parseInt(testComments[0].thread_id)],
    };

    let resp = await get('/api/comments', r);

    chai.assert.lengthOf(resp.result.comments, 2);

    r.thread_ids.push(parseInt(testComments[2].thread_id));
    resp = await get('/api/comments', r);

    chai.assert.lengthOf(resp.result.comments, 5);
  });

  it('should paginate correctly', async () => {
    const r: GetCommentsReq = {
      community_id: testComments[0].community_id,
      addresses: ['testAddress-2'],
      limit: 2,
    };
    let resp = await get('/api/comments', r);

    chai.assert.lengthOf(resp.result.comments, 2);

    const first = resp.result.comments[0];
    const second = resp.result.comments[0];

    r.page = 2;
    resp = await get('/api/comments', r);

    chai.assert.lengthOf(resp.result.comments, 1);
    chai.assert.notDeepEqual(first, resp.result.comments);
    chai.assert.notDeepEqual(second, resp.result.comments);
  });

  it('should order correctly', async () => {
    const r: GetCommentsReq = {
      community_id: testComments[0].community_id,
      addresses: ['testAddress-2'],
      sort: OrderByOptions.CREATED,
    };
    let resp = await get('/api/comments', r);

    chai.assert.lengthOf(resp.result.comments, 3);
    chai.assert.deepEqual(
      resp.result.comments,
      ([...resp.result.comments] as CommentAttributes[]).sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      ),
    );

    r.sort = OrderByOptions.UPDATED;
    resp = await get('/api/comments', r);

    chai.assert.lengthOf(resp.result.comments, 3);
    chai.assert.deepEqual(
      resp.result.comments,
      ([...resp.result.comments] as CommentAttributes[]).sort(
        (a, b) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
      ),
    );
  });

  it('should handle errors correctly', async () => {
    let resp = await get('/api/comments', {}, true);

    chai.assert.lengthOf(resp.result, 1);
    chai.assert.equal(resp.result[0].msg, 'Invalid value');
    chai.assert.equal(resp.result[0].param, 'community_id');

    resp = await get(
      '/api/comments',
      { community_id: testComments[0].community_id, count_only: 3 },
      true,
    );

    chai.assert.lengthOf(resp.result, 1);
    chai.assert.equal(resp.result[0].msg, 'Invalid value');
    chai.assert.equal(resp.result[0].param, 'count_only');
  });
});
