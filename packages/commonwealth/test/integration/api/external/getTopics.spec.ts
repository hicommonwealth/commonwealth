import chai from 'chai';
import chaiHttp from 'chai-http';

import type { TopicAttributes } from '@hicommonwealth/model';
import type { GetTopicsReq } from 'server/api/extApiTypes';
import { OrderByOptions } from 'server/api/extApiTypes';
import { get } from 'test/integration/api/external/appHook.spec';
import { testTopics } from 'test/integration/api/external/dbEntityHooks.spec';

chai.use(chaiHttp);

describe('getTopics Tests', () => {
  it('should return topics with specified community_id correctly', async () => {
    const r: GetTopicsReq = {
      community_id: testTopics[0].community_id,
      count_only: false,
    };
    const resp = await get('/api/topics', r);

    chai.assert.lengthOf(resp.result.topics, 2);
  });

  it('should return count only when specified correctly', async () => {
    const r: GetTopicsReq = {
      community_id: testTopics[0].community_id,
      count_only: true,
    };
    const resp = await get('/api/topics', r);

    chai.assert.equal(resp.result.count, 2);
    chai.assert.isUndefined(resp.result.topics);
  });

  it('should paginate correctly', async () => {
    const r: GetTopicsReq = {
      community_id: testTopics[0].community_id,
      limit: 1,
    };
    let resp = await get('/api/topics', r);

    chai.assert.lengthOf(resp.result.topics, 1);

    const first = resp.result.topics[0];
    const second = resp.result.topics[0];

    r.page = 2;
    resp = await get('/api/topics', r);

    chai.assert.lengthOf(resp.result.topics, 1);
    chai.assert.notDeepEqual(first, resp.result.topics);
    chai.assert.notDeepEqual(second, resp.result.topics);
  });

  it('should order correctly', async () => {
    const r: GetTopicsReq = {
      community_id: testTopics[0].community_id,
      sort: OrderByOptions.CREATED,
    };
    let resp = await get('/api/topics', r);

    chai.assert.lengthOf(resp.result.topics, 2);
    chai.assert.deepEqual(
      resp.result.topics,
      ([...resp.result.topics] as TopicAttributes[]).sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      ),
    );

    r.sort = OrderByOptions.UPDATED;
    resp = await get('/api/topics', r);

    chai.assert.lengthOf(resp.result.topics, 2);
    chai.assert.deepEqual(
      resp.result.topics,
      ([...resp.result.topics] as TopicAttributes[]).sort(
        (a, b) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
      ),
    );
  });

  it('should handle errors correctly', async () => {
    let resp = await get('/api/topics', {}, true);

    chai.assert.lengthOf(resp.result, 1);
    chai.assert.equal(resp.result[0].msg, 'Invalid value');
    chai.assert.equal(resp.result[0].param, 'community_id');

    resp = await get(
      '/api/topics',
      { community_id: testTopics[0].community_id, count_only: 3 },
      true,
    );

    chai.assert.lengthOf(resp.result, 1);
    chai.assert.equal(resp.result[0].msg, 'Invalid value');
    chai.assert.equal(resp.result[0].param, 'count_only');
  });
});
