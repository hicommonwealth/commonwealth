import 'chai/register-should';
import models from 'server/database';
import chai from 'chai';
import 'chai/register-should';
import { getReq, res } from 'test/unit/unitHelpers';
import type { GetThreadsReq } from 'common-common/src/api/extApiTypes';
import { OrderByOptions } from 'common-common/src/api/extApiTypes';
import 'test/integration/api/external/dbEntityHooks.spec';
import {
  testComments,
  testThreads,
} from 'test/integration/api/external/dbEntityHooks.spec';
import type { ThreadAttributes } from 'server/models/thread';
import { get } from 'test/integration/api/external/appHook.spec';

describe('getThreads Tests', () => {
  it('should return threads with specified community_id correctly', async () => {
    const r: GetThreadsReq = { community_id: testThreads[0].chain };
    const resp = await get('/api/threads', r);

    chai.assert.lengthOf(resp.result.threads, 5);
  });

  it('should return threads with specified address_ids correctly', async () => {
    const r: GetThreadsReq = {
      community_id: testThreads[0].chain,
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
      community_id: testThreads[0].chain,
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
      community_id: testThreads[0].chain,
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
      community_id: testThreads[0].chain,
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
      community_id: testThreads[0].chain,
      address_ids: ['-2'],
      sort: OrderByOptions.CREATED,
    };
    let resp = await get('/api/threads', r);

    chai.assert.lengthOf(resp.result.threads, 3);
    chai.assert.deepEqual(
      resp.result.threads,
      ([...resp.result.threads] as ThreadAttributes[]).sort(
        (a, b) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      )
    );

    r.sort = OrderByOptions.UPDATED;
    resp = await get('/api/threads', r);

    chai.assert.lengthOf(resp.result.threads, 3);
    chai.assert.deepEqual(
      resp.result.threads,
      ([...resp.result.threads] as ThreadAttributes[]).sort(
        (a, b) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      )
    );
  });

  it('should handle errors correctly', async () => {
    let resp = await get('/api/threads', {}, true);

    chai.assert.lengthOf(resp.result, 1);
    chai.assert.equal(resp.result[0].msg, 'Invalid value');
    chai.assert.equal(resp.result[0].param, 'community_id');

    resp = await get(
      '/api/threads',
      { community_id: testComments[0].chain, count_only: 3 },
      true
    );

    chai.assert.lengthOf(resp.result, 1);
    chai.assert.equal(resp.result[0].msg, 'Invalid value');
    chai.assert.equal(resp.result[0].param, 'count_only');
  });
});
