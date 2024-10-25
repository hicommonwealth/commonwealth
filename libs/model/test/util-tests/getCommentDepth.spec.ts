import { dispose } from '@hicommonwealth/core';
import { expect } from 'chai';
import { afterAll, beforeAll, describe, test } from 'vitest';
import {
  CommentInstance,
  getCommentSearchVector,
  getThreadSearchVector,
  models,
  tester,
} from '../../src';
import { getCommentDepth } from '../../src/utils/getCommentDepth';

describe('getCommentDepth', () => {
  const community_id = 'ethereum';
  const comments: CommentInstance[] = [];
  const maxDepth = 8;

  beforeAll(async () => {
    await tester.seedDb();
    const address = await models.Address.findOne({
      where: {
        community_id,
      },
    });
    const thread = await models.Thread.create({
      community_id,
      body: 'test',
      address_id: address!.id!,
      title: 'Testing',
      kind: 'discussion',
      search: getThreadSearchVector('Testing', ''),
      reaction_weights_sum: '0',
    });
    let comment: CommentInstance;
    for (let i = 0; i < maxDepth; i++) {
      const result = await models.Comment.create({
        community_id,
        // @ts-expect-error StrictNullChecks
        thread_id: thread.id,
        // @ts-expect-error StrictNullChecks
        parent_id: comment ? String(comment.id) : undefined,
        // @ts-expect-error StrictNullChecks
        address_id: address.id,
        text: String(i),
        search: getCommentSearchVector(String(i)),
      });
      comments.push(result);
      comment = result;
    }
  });

  afterAll(async () => {
    await dispose()();
  });

  test('should correctly calculate comment depth (recursion terminated naturally)', async () => {
    for (let i = 0; i < maxDepth; i++) {
      const [exceeded, depth] = await getCommentDepth(comments[i], maxDepth);
      expect(exceeded).to.be.false;
      expect(depth).to.equal(i);
    }
  });

  test('should correctly calculate comment depth (recursion depth exceeded)', async () => {
    const maxIterations = 2;
    const [exceeded, depth] = await getCommentDepth(
      comments[comments.length - 1],
      maxIterations,
    );
    expect(exceeded).to.be.true;
    expect(depth).to.equal(maxIterations);
  });
});
