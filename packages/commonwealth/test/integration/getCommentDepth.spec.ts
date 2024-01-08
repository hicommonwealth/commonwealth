import { expect } from 'chai';
import { getCommentDepth } from 'server/util/getCommentDepth';
import models from '../../server/database';
import { CommentInstance } from '../../server/models/comment';
import { resetDatabase } from '../util/resetDatabase';

describe('getCommentDepth', () => {
  const community_id = 'ethereum';
  const comments: CommentInstance[] = [];
  const maxDepth = 8;

  before(async () => {
    await resetDatabase();
    const address = await models.Address.findOne({
      where: {
        community_id,
      },
    });
    const thread = await models.Thread.create({
      community_id,
      address_id: address.id,
      title: 'Testing',
      plaintext: '',
      kind: 'discussion',
    });
    let comment: CommentInstance;
    for (let i = 0; i < maxDepth; i++) {
      const result = await models.Comment.create({
        community_id,
        thread_id: String(thread.id),
        parent_id: comment ? String(comment.id) : undefined,
        address_id: address.id,
        text: String(i),
      });
      comments.push(result);
      comment = result;
    }
  });

  it('should correctly calculate comment depth (recursion terminated naturally)', async () => {
    for (let i = 0; i < maxDepth; i++) {
      const [exceeded, depth] = await getCommentDepth(
        models,
        comments[i],
        maxDepth,
      );
      expect(exceeded).to.be.false;
      expect(depth).to.equal(i);
    }
  });

  it('should correctly calculate comment depth (recursion depth exceeded)', async () => {
    const maxIterations = 2;
    const [exceeded, depth] = await getCommentDepth(
      models,
      comments[comments.length - 1],
      maxIterations,
    );
    expect(exceeded).to.be.true;
    expect(depth).to.equal(maxIterations);
  });
});
