import 'chai/register-should';
import models from 'server/database';
import chai from 'chai';
import 'chai/register-should';
import { req, res } from 'test/unit/unitHelpers';
import { GetThreadsReq, OrderByOptions } from 'common-common/src/api/extApiTypes';
import './rootHooks.spec';
import { testThreads } from 'test/unit/api/rootHooks.spec';
import { ThreadAttributes } from 'server/models/thread';
import getThreads from 'server/routes/threads/getThreads';

describe('getThreads Tests', () => {
  it('should return threads with specified community_id correctly', async () => {
    const r: GetThreadsReq = { community_id: testThreads[0].chain };
    const resp = await getThreads(models, req(r), res()) as any;

    chai.assert.lengthOf(resp.result.threads, 5);
  });

  it('should return threads with specified address_ids correctly', async () => {
    const r: GetThreadsReq = { community_id: testThreads[0].chain, address_ids: ['-1'] };
    let resp = await getThreads(models, req(r), res()) as any;

    chai.assert.lengthOf(resp.result.threads, 2);

    r.address_ids.push('-2');
    resp = await getThreads(models, req(r), res()) as any;

    chai.assert.lengthOf(resp.result.threads, 5);
  });

  it('should return threads with specified addresses correctly', async () => {
    const r: GetThreadsReq = { community_id: testThreads[0].chain, addresses: ['testAddress-1'] };
    let resp = await getThreads(models, req(r), res()) as any;

    chai.assert.lengthOf(resp.result.threads, 2);

    r.addresses = ['testAddress-2'];
    resp = await getThreads(models, req(r), res()) as any;

    chai.assert.lengthOf(resp.result.threads, 3);
  });

  it('should return threads with specified topic_id correctly', async () => {
    const r: GetThreadsReq = { community_id: testThreads[0].chain, topic_id: -1 };
    let resp = await getThreads(models, req(r), res()) as any;

    chai.assert.lengthOf(resp.result.threads, 2);

    r.topic_id = -2;
    resp = await getThreads(models, req(r), res()) as any;

    chai.assert.lengthOf(resp.result.threads, 3);
  });

  it('should paginate correctly', async () => {
    const r: GetThreadsReq = { community_id: testThreads[0].chain, address_ids: ['-2'], limit: 2 };
    let resp = await getThreads(models, req(r), res()) as any;

    chai.assert.lengthOf(resp.result.threads, 2);

    const first = resp.result.threads[0];
    const second = resp.result.threads[0];

    r.page = 2;
    resp = await getThreads(models, req(r), res()) as any;

    chai.assert.lengthOf(resp.result.threads, 1);
    chai.assert.notDeepEqual(first, resp.result.threads);
    chai.assert.notDeepEqual(second, resp.result.threads);
  });

  it('should order correctly', async () => {
    const r: GetThreadsReq = {
      community_id: testThreads[0].chain,
      address_ids: ['-2'],
      sort: OrderByOptions.CREATED
    };
    let resp = await getThreads(models, req(r), res()) as any;

    chai.assert.lengthOf(resp.result.threads, 3);
    chai.assert.deepEqual(
      resp.result.threads,
      ([...resp.result.threads] as ThreadAttributes[]).sort(
        (a, b) => b.created_at.getTime() - a.created_at.getTime()
      )
    );

    r.sort = OrderByOptions.UPDATED;
    resp = await getThreads(models, req(r), res()) as any;

    chai.assert.lengthOf(resp.result.threads, 3);
    chai.assert.deepEqual(
      resp.result.threads,
      ([...resp.result.threads] as ThreadAttributes[]).sort(
        (a, b) => b.updated_at.getTime() - a.updated_at.getTime()
      )
    );
  });
});