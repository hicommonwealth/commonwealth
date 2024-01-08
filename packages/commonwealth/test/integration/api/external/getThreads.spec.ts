import chai from 'chai';
import 'chai/register-should';
import type { GetThreadsReq } from 'server/api/extApiTypes';
import { OrderByOptions } from 'server/api/extApiTypes';
import type { ThreadAttributes } from 'server/models/thread';
import { get } from 'test/integration/api/external/appHook.spec';
import 'test/integration/api/external/dbEntityHooks.spec';
import {
  testComments,
  testThreads,
} from 'test/integration/api/external/dbEntityHooks.spec';

describe('getThreads Tests', () => {
  it('should return threads with specified community_id correctly', async () => {
    const r: GetThreadsReq = { community_id: testThreads[0].community_id };
    const resp = await get('/api/threads', r);

    chai.assert.lengthOf(resp.result.threads, 5);
  });

  it('should return threads with specified address_ids correctly', async () => {
    const r: GetThreadsReq = {
      community_id: testThreads[0].community_id,
      address_ids: ['-1'],
    };
    let resp = await get('/api/threads', r);

    chai.assert.lengthOf(resp.result.threads, 2);

    r.address_ids.push('-2');
    resp = await get('/api/threads', r);

    chai.assert.lengthOf(resp.result.threads, 5);
  });

  it('should return threads with specified addresses correctly', async () => {
    const r: GetThreadsReq = {
      community_id: testThreads[0].community_id,
      addresses: ['testAddress-1'],
    };
    let resp = await get('/api/threads', r);

    chai.assert.lengthOf(resp.result.threads, 2);

    r.addresses = ['testAddress-2'];
    resp = await get('/api/threads', r);

    chai.assert.lengthOf(resp.result.threads, 3);
  });

  it('should return threads with specified topic_id correctly', async () => {
    const r: GetThreadsReq = {
      community_id: testThreads[0].community_id,
      topic_id: -1,
    };
    let resp = await get('/api/threads', r);

    chai.assert.lengthOf(resp.result.threads, 2);

    r.topic_id = -2;
    resp = await get('/api/threads', r);

    chai.assert.lengthOf(resp.result.threads, 3);
  });

  it('should paginate correctly', async () => {
    const r: GetThreadsReq = {
      community_id: testThreads[0].community_id,
      address_ids: ['-2'],
      limit: 2,
    };
    let resp = await get('/api/threads', r);

    chai.assert.lengthOf(resp.result.threads, 2);

    const first = resp.result.threads[0];
    const second = resp.result.threads[0];

    r.page = 2;
    resp = await get('/api/threads', r);

    chai.assert.lengthOf(resp.result.threads, 1);
    chai.assert.notDeepEqual(first, resp.result.threads);
    chai.assert.notDeepEqual(second, resp.result.threads);
  });

  it('should order correctly', async () => {
    const r: GetThreadsReq = {
      community_id: testThreads[0].community_id,
      address_ids: ['-2'],
      sort: OrderByOptions.CREATED,
    };
    let resp = await get('/api/threads', r);

    chai.assert.lengthOf(resp.result.threads, 3);
    chai.assert.deepEqual(
      resp.result.threads,
      ([...resp.result.threads] as ThreadAttributes[]).sort(
        (a, b) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
      ),
    );

    r.sort = OrderByOptions.UPDATED;
    resp = await get('/api/threads', r);

    chai.assert.lengthOf(resp.result.threads, 3);
    chai.assert.deepEqual(
      resp.result.threads,
      ([...resp.result.threads] as ThreadAttributes[]).sort(
        (a, b) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
      ),
    );
  });

  it('should handle errors correctly', async () => {
    let resp = await get('/api/threads', {}, true);

    chai.assert.lengthOf(resp.result, 1);
    chai.assert.equal(resp.result[0].msg, 'Invalid value');
    chai.assert.equal(resp.result[0].param, 'community_id');

    resp = await get(
      '/api/threads',
      { community_id: testComments[0].community_id, count_only: 3 },
      true,
    );

    chai.assert.lengthOf(resp.result, 1);
    chai.assert.equal(resp.result[0].msg, 'Invalid value');
    chai.assert.equal(resp.result[0].param, 'count_only');
  });

  it('Should return sensible default for thread with no associated comment', async () => {
    let resp = await get('/api/threads', {
      community_id: testThreads[0].community_id,
      include_comments: true,
      topic_id: -1,
    });

    chai.assert.lengthOf(resp.result.threads, 2);
    const sortedByLength = resp.result.threads.sort(
      (a, b) => a.Comments.length - b.Comments.length,
    );
    chai.assert.equal(sortedByLength[0].Comments.length, 2);
    chai.assert.equal(sortedByLength[1].Comments.length, 3);

    resp = await get('/api/threads', {
      community_id: testThreads[0].community_id,
      include_comments: true,
      topic_id: -2,
    });

    chai.assert.lengthOf(resp.result.threads, 3);
    chai.assert.equal(resp.result.threads[0].Comments.length, 0);
    chai.assert.equal(resp.result.threads[1].Comments.length, 0);
    chai.assert.equal(resp.result.threads[2].Comments.length, 0);

    resp = await get('/api/threads', {
      community_id: testThreads[0].community_id,
      include_comments: false,
      topic_id: -2,
    });

    chai.assert.lengthOf(resp.result.threads, 3);
    chai.assert.equal(resp.result.threads[0].Comments, undefined);
    chai.assert.equal(resp.result.threads[1].Comments, undefined);
    chai.assert.equal(resp.result.threads[2].Comments, undefined);
  });
});
