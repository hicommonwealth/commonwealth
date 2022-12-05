import 'chai/register-should';
import models from 'server/database';
import chai from 'chai';
import 'chai/register-should';
import getComments from 'server/routes/comments/getComments';
import { req, res } from 'test/unit/unitHelpers';
import { GetCommentsReq, OrderByOptions } from 'common-common/src/api/extApiTypes';
import './rootHooks.spec';
import { testComments } from 'test/unit/api/rootHooks.spec';
import { CommentAttributes } from 'server/models/comment';

describe('getComments Tests', () => {
  it('should return comments with specified community_id correctly', async () => {
    const r: GetCommentsReq = { community_id: testComments[0].chain };
    const resp = await getComments(models, req(r), res()) as any;

    chai.assert.lengthOf(resp.result.comments, 5);
  });

  it('should return comments with specified addresses correctly', async () => {
    const r: GetCommentsReq = { community_id: testComments[0].chain, addresses: ['testAddress-1'] };

    let resp = await getComments(models, req(r), res()) as any;

    chai.assert.lengthOf(resp.result.comments, 2);

    r.addresses.push('testAddress-2');
    resp = await getComments(models, req(r), res()) as any;

    chai.assert.lengthOf(resp.result.comments, 5);
  });

  it('should paginate correctly', async () => {
    const r: GetCommentsReq = { community_id: testComments[0].chain, addresses: ['testAddress-2'], limit: 2 };
    let resp = await getComments(models, req(r), res()) as any;

    chai.assert.lengthOf(resp.result.comments, 2);

    const first = resp.result.comments[0];
    const second = resp.result.comments[0];

    r.page = 2;
    resp = await getComments(models, req(r), res()) as any;

    chai.assert.lengthOf(resp.result.comments, 1);
    chai.assert.notDeepEqual(first, resp.result.comments);
    chai.assert.notDeepEqual(second, resp.result.comments);
  });

  it('should order correctly', async () => {
    const r: GetCommentsReq = {
      community_id: testComments[0].chain,
      addresses: ['testAddress-2'],
      sort: OrderByOptions.CREATED
    };
    let resp = await getComments(models, req(r), res()) as any;

    chai.assert.lengthOf(resp.result.comments, 3);
    chai.assert.deepEqual(
      resp.result.comments,
      ([...resp.result.comments] as CommentAttributes[]).sort(
        (a, b) => b.created_at.getTime() - a.created_at.getTime()
      )
    );

    r.sort = OrderByOptions.UPDATED;
    resp = await getComments(models, req(r), res()) as any;

    chai.assert.lengthOf(resp.result.comments, 3);
    chai.assert.deepEqual(
      resp.result.comments,
      ([...resp.result.comments] as CommentAttributes[]).sort(
        (a, b) => b.updated_at.getTime() - a.updated_at.getTime()
      )
    );
  });
});